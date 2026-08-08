export interface HealthResult {
  serviceId: string;
  name: string;
  url: string;
  status: "healthy" | "degraded" | "down" | "skipped";
  statusCode: number | null;
  latencyMs: number;
  error: string | null;
}

export interface ModelTestResult {
  model: string;
  reply: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
}
