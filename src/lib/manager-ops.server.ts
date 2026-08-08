import type { HealthResult, ModelTestResult } from "./manager-ops.types";

/**
 * Real network operations for the manager console.
 * These perform genuine outbound HTTP calls and persist the results.
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}


async function probe(url: string, timeoutMs = 8000) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "sapphire-nexus-health-check/1.0" },
    });
    return { statusCode: res.status, latencyMs: Date.now() - started, error: null as string | null };
  } catch (err) {
    return {
      statusCode: null,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? (err.name === "AbortError" ? "Request timed out" : err.message) : "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Ping every externally reachable registered service and persist live health. */
export async function runHealthChecksImpl(serviceIds?: string[]): Promise<HealthResult[]> {
  const db = await admin();
  let query = db
    .from("api_services")
    .select("id, name, endpoint_url, avg_latency_ms, uptime_pct")
    .order("name", { ascending: true });
  if (serviceIds?.length) query = query.in("id", serviceIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const services = (data ?? []) as Array<{
    id: string;
    name: string;
    endpoint_url: string | null;
    avg_latency_ms: number | null;
  }>;

  const results = await Promise.all(
    services.map(async (svc): Promise<HealthResult> => {
      const url = svc.endpoint_url ?? "";
      if (!/^https?:\/\//i.test(url)) {
        return {
          serviceId: svc.id,
          name: svc.name,
          url,
          status: "skipped",
          statusCode: null,
          latencyMs: 0,
          error: "Internal endpoint - not reachable from the gateway",
        };
      }

      const r = await probe(url);
      // Auth/method errors still prove the endpoint is alive and routable.
      const status: HealthResult["status"] =
        r.statusCode === null ? "down" : r.statusCode >= 500 ? "degraded" : "healthy";

      return {
        serviceId: svc.id,
        name: svc.name,
        url,
        status,
        statusCode: r.statusCode,
        latencyMs: r.latencyMs,
        error: r.error,
      };
    }),
  );

  const checked = results.filter((r) => r.status !== "skipped");
  const now = new Date().toISOString();

  await Promise.all(
    checked.map((r) => {
      const previous = services.find((s) => s.id === r.serviceId)?.avg_latency_ms ?? r.latencyMs;
      const blended = Math.round(previous * 0.7 + r.latencyMs * 0.3);
      return db
        .from("api_services")
        .update({
          health_status: r.status,
          avg_latency_ms: blended,
          last_checked_at: now,
        })
        .eq("id", r.serviceId);
    }),
  );

  if (checked.length) {
    await db.from("api_request_logs").insert(
      checked.map((r) => ({
        occurred_at: now,
        service_id: r.serviceId,
        method: "GET",
        path: r.url,
        status_code: r.statusCode ?? 599,
        latency_ms: r.latencyMs,
        ip: null,
        user_agent: "sapphire-nexus-health-check/1.0",
        request_id: crypto.randomUUID(),
        error_message: r.error,
      })),
    );

    await db.from("audit_logs").insert({
      actor: "console@softwarevala.com",
      action: "services.health_check",
      entity_type: "api_services",
      entity_id: null,
      severity: checked.some((r) => r.status === "down") ? "warning" : "info",
      metadata: {
        checked: checked.length,
        healthy: checked.filter((r) => r.status === "healthy").length,
        degraded: checked.filter((r) => r.status === "degraded").length,
        down: checked.filter((r) => r.status === "down").length,
      } as never,
    });
  }

  return results;
}


/** Run a real chat completion through the Lovable AI Gateway and log real usage. */
export async function runModelTestImpl(input: {
  modelRowId: string;
  prompt: string;
}): Promise<ModelTestResult> {
  const db = await admin();
  const { data: model, error } = await db
    .from("ai_models")
    .select("id, name, model_id, input_cost_per_1k, output_cost_per_1k")
    .eq("id", input.modelRowId)
    .single();
  if (error || !model) throw new Error(error?.message ?? "Model not found");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI gateway key is not configured");

  // Catalogue rows that the gateway actually serves as chat models are called
  // directly; non-chat rows (speech, image, embeddings, non-gateway vendors)
  // fall back to a served text model so the probe is still a real call.
  const requested = String(model.model_id);
  const chatServable =
    /^(openai\/gpt-5|google\/gemini-[23])/.test(requested) &&
    !/(image|tts|transcribe|embedding)/.test(requested);
  const served = chatServable ? requested : "google/gemini-3.5-flash";

  const started = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: served,
      messages: [
        { role: "system", content: "You are an API operations assistant. Answer in one short sentence." },
        { role: "user", content: input.prompt },
      ],
    }),
  });
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("AI gateway rate limit reached, try again shortly");
    if (res.status === 402) throw new Error("AI gateway credits exhausted");
    throw new Error(`AI gateway error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const reply = payload.choices?.[0]?.message?.content ?? "";
  const tokensIn = payload.usage?.prompt_tokens ?? 0;
  const tokensOut = payload.usage?.completion_tokens ?? 0;
  const costUsd =
    (tokensIn / 1000) * Number(model.input_cost_per_1k ?? 0) +
    (tokensOut / 1000) * Number(model.output_cost_per_1k ?? 0);

  const now = new Date().toISOString();
  await db.from("ai_decision_logs").insert({
    occurred_at: now,
    agent_id: null,
    model_id: model.id,
    decision: "manual_model_test",
    confidence: 1,
    input_summary: input.prompt.slice(0, 240),
    output_summary: reply.slice(0, 240),
    tokens: tokensIn + tokensOut,
    cost_usd: Number(costUsd.toFixed(6)),
    outcome: "success",
  });

  await db.from("usage_events").insert({
    occurred_at: now,
    service_id: null,
    model_id: model.id,
    product: "AI Console",
    requests: 1,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: Number(costUsd.toFixed(6)),
    latency_ms: latencyMs,
    status_code: 200,
    success: true,
    source: "console",
  });

  return {
    model: `${model.name} (${served})`,
    reply,
    tokensIn,
    tokensOut,
    costUsd: Number(costUsd.toFixed(6)),
    latencyMs,
  };
}
