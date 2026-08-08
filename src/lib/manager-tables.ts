// Allowlist of manager tables reachable through the generic data server functions.
// Anything not listed here can never be read or written from the client.
export const MANAGER_TABLES = [
  "ai_providers",
  "api_services",
  "api_keys",
  "ai_models",
  "ai_agents",
  "api_integrations",
  "product_apis",
  "role_api_permissions",
  "rate_limits",
  "usage_events",
  "usage_daily",
  "billing_plans",
  "invoices",
  "wallets",
  "wallet_transactions",
  "cost_recommendations",
  "api_request_logs",
  "ai_decision_logs",
  "audit_logs",
  "security_alerts",
  "incidents",
  "automation_rules",
  "emergency_controls",
  "prompts",
  "prompt_versions",
  "fine_tuning_jobs",
  "model_evaluations",
  "safety_policies",
  "data_governance_rules",
  "on_device_models",
  "model_versions",
  "system_settings",
  "error_events",
  "router_rules",
  "cache_entries",
  "failover_events",
] as const;

export type ManagerTable = (typeof MANAGER_TABLES)[number];

export function isManagerTable(value: string): value is ManagerTable {
  return (MANAGER_TABLES as readonly string[]).includes(value);
}
