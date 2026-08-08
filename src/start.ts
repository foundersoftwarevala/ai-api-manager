import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    const { recordError } = await import("./lib/error-monitor.server");
    await recordError({
      source: "ssr",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      route: (() => {
        try {
          return new URL(request.url).pathname;
        } catch {
          return undefined;
        }
      })(),
      severity: "critical",
    });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Records every failing server action (server function) before rethrowing so
// the caller still sees the original error.
const serverFnErrorMonitor = createMiddleware({ type: "function" }).server(
  async ({ next, ...ctx }) => {
    try {
      return await next();
    } catch (error) {
      if (!(error instanceof Response)) {
        const { recordError } = await import("./lib/error-monitor.server");
        await recordError({
          source: "server_fn",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          fnName: String((ctx as { functionId?: string }).functionId ?? "server_fn"),
        });
      }
      throw error;
    }
  },
);

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, serverFnErrorMonitor],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
