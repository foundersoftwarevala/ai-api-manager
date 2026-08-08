
-- ============ CORE ============
CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'ai',
  status text NOT NULL DEFAULT 'active',
  base_url text,
  region text NOT NULL DEFAULT 'global',
  docs_url text,
  monthly_cost_usd numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.api_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'external',
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  endpoint_url text,
  health_status text NOT NULL DEFAULT 'unknown',
  uptime_pct numeric(5,2) NOT NULL DEFAULT 100,
  avg_latency_ms integer NOT NULL DEFAULT 0,
  version text NOT NULL DEFAULT 'v1',
  owner_team text NOT NULL DEFAULT 'Platform',
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.api_services(id) ON DELETE SET NULL,
  environment text NOT NULL DEFAULT 'production',
  key_prefix text NOT NULL DEFAULT 'sv',
  last_four text NOT NULL DEFAULT '0000',
  fingerprint text NOT NULL,
  secret_encrypted text,
  scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  rotation_days integer NOT NULL DEFAULT 90,
  last_rotated_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  name text NOT NULL,
  model_id text NOT NULL UNIQUE,
  modality text NOT NULL DEFAULT 'text',
  context_window integer NOT NULL DEFAULT 128000,
  input_cost_per_1k numeric(10,5) NOT NULL DEFAULT 0,
  output_cost_per_1k numeric(10,5) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  latency_ms integer NOT NULL DEFAULT 0,
  quality_score numeric(4,1) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  purpose text NOT NULL,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  system_prompt text NOT NULL DEFAULT '',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 2048,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  runs_30d integer NOT NULL DEFAULT 0,
  success_rate numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'connected',
  direction text NOT NULL DEFAULT 'outbound',
  auth_type text NOT NULL DEFAULT 'api_key',
  webhook_url text,
  last_sync_at timestamptz,
  sync_frequency text NOT NULL DEFAULT 'realtime',
  error_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  service_id uuid REFERENCES public.api_services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  quota_monthly integer NOT NULL DEFAULT 100000,
  used_this_month integer NOT NULL DEFAULT 0,
  plan text NOT NULL DEFAULT 'standard',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.role_api_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  service_id uuid REFERENCES public.api_services(id) ON DELETE CASCADE,
  can_read boolean NOT NULL DEFAULT true,
  can_write boolean NOT NULL DEFAULT false,
  can_admin boolean NOT NULL DEFAULT false,
  rate_limit_per_min integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.api_services(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'global',
  window_seconds integer NOT NULL DEFAULT 60,
  max_requests integer NOT NULL DEFAULT 1000,
  burst integer NOT NULL DEFAULT 100,
  current_usage integer NOT NULL DEFAULT 0,
  action_on_exceed text NOT NULL DEFAULT 'throttle',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ USAGE / MONEY ============
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  service_id uuid REFERENCES public.api_services(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  product text NOT NULL DEFAULT 'platform',
  requests integer NOT NULL DEFAULT 1,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  status_code integer NOT NULL DEFAULT 200,
  success boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'app'
);
CREATE INDEX usage_events_occurred_idx ON public.usage_events (occurred_at DESC);

CREATE TABLE public.usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  service_id uuid REFERENCES public.api_services(id) ON DELETE CASCADE,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  requests integer NOT NULL DEFAULT 0,
  tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,4) NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  avg_latency_ms integer NOT NULL DEFAULT 0,
  UNIQUE (day, service_id, model_id)
);

CREATE TABLE public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  included_requests integer NOT NULL DEFAULT 0,
  overage_per_1k numeric(10,4) NOT NULL DEFAULT 0,
  monthly_fee numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active',
  renewal_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount_usd numeric(12,2) NOT NULL DEFAULT 0,
  tax_usd numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_at date,
  paid_at date
);

CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  low_balance_threshold numeric(14,2) NOT NULL DEFAULT 100,
  auto_topup boolean NOT NULL DEFAULT false,
  auto_topup_amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(14,2) NOT NULL,
  balance_after numeric(14,2) NOT NULL DEFAULT 0,
  reference text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cost_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'optimization',
  detail text NOT NULL DEFAULT '',
  estimated_monthly_saving numeric(12,2) NOT NULL DEFAULT 0,
  effort text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  service_id uuid REFERENCES public.api_services(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ LOGS / TRUST ============
CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  service_id uuid REFERENCES public.api_services(id) ON DELETE SET NULL,
  method text NOT NULL DEFAULT 'GET',
  path text NOT NULL DEFAULT '/',
  status_code integer NOT NULL DEFAULT 200,
  latency_ms integer NOT NULL DEFAULT 0,
  ip text,
  user_agent text,
  request_id text,
  error_message text
);
CREATE INDEX api_request_logs_occurred_idx ON public.api_request_logs (occurred_at DESC);

CREATE TABLE public.ai_decision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  decision text NOT NULL,
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  input_summary text,
  output_summary text,
  tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  outcome text NOT NULL DEFAULT 'accepted'
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text
);
CREATE INDEX audit_logs_occurred_idx ON public.audit_logs (occurred_at DESC);

CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'access',
  source text NOT NULL DEFAULT 'gateway',
  status text NOT NULL DEFAULT 'open',
  description text,
  resolved_at timestamptz
);

CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'sev3',
  status text NOT NULL DEFAULT 'open',
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  impact text,
  root_cause text,
  service_id uuid REFERENCES public.api_services(id) ON DELETE SET NULL,
  postmortem_url text
);

CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'threshold',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL DEFAULT 'notify',
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.emergency_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  engaged boolean NOT NULL DEFAULT false,
  engaged_at timestamptz,
  engaged_by text,
  scope text NOT NULL DEFAULT 'global'
);

-- ============ AI GOVERNANCE ============
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  current_version integer NOT NULL DEFAULT 1,
  owner text NOT NULL DEFAULT 'AI Platform',
  status text NOT NULL DEFAULT 'active',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content text NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT false,
  created_by text NOT NULL DEFAULT 'AI Platform',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fine_tuning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_model text NOT NULL,
  dataset_name text NOT NULL,
  dataset_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  progress integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  cost_usd numeric(12,2) NOT NULL DEFAULT 0,
  result_model_id text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.model_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.ai_models(id) ON DELETE CASCADE,
  suite text NOT NULL,
  metric text NOT NULL,
  score numeric(6,2) NOT NULL DEFAULT 0,
  baseline numeric(6,2) NOT NULL DEFAULT 0,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'passed',
  notes text
);

CREATE TABLE public.safety_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'content',
  severity_threshold text NOT NULL DEFAULT 'medium',
  action text NOT NULL DEFAULT 'block',
  enabled boolean NOT NULL DEFAULT true,
  violations_30d integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.data_governance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  data_class text NOT NULL DEFAULT 'internal',
  region text NOT NULL DEFAULT 'global',
  retention_days integer NOT NULL DEFAULT 365,
  masking text NOT NULL DEFAULT 'none',
  encryption text NOT NULL DEFAULT 'aes-256',
  compliance_tags text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.on_device_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  framework text NOT NULL DEFAULT 'onnx',
  size_mb numeric(10,2) NOT NULL DEFAULT 0,
  platforms text[] NOT NULL DEFAULT '{}',
  version text NOT NULL DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'published',
  downloads integer NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.ai_models(id) ON DELETE CASCADE,
  version text NOT NULL,
  stage text NOT NULL DEFAULT 'production',
  released_at date,
  deprecate_at date,
  retire_at date,
  notes text
);

CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  value_type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ SECURITY: server-only access ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_providers','api_services','api_keys','ai_models','ai_agents','api_integrations',
    'product_apis','role_api_permissions','rate_limits','usage_events','usage_daily',
    'billing_plans','invoices','wallets','wallet_transactions','cost_recommendations',
    'api_request_logs','ai_decision_logs','audit_logs','security_alerts','incidents',
    'automation_rules','emergency_controls','prompts','prompt_versions','fine_tuning_jobs',
    'model_evaluations','safety_policies','data_governance_rules','on_device_models',
    'model_versions','system_settings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- ============ SEED ============
INSERT INTO public.ai_providers (name, slug, category, status, base_url, region, docs_url, monthly_cost_usd) VALUES
('Lovable AI Gateway','lovable-ai','ai','active','https://ai.gateway.lovable.dev/v1','global','https://docs.lovable.dev/features/ai',1840.50),
('OpenAI','openai','ai','active','https://api.openai.com/v1','us-east','https://platform.openai.com/docs',2960.75),
('Google AI','google-ai','ai','active','https://generativelanguage.googleapis.com/v1beta','global','https://ai.google.dev/docs',1420.00),
('Anthropic','anthropic','ai','active','https://api.anthropic.com/v1','us-east','https://docs.anthropic.com',980.25),
('Stripe','stripe','payments','active','https://api.stripe.com/v1','global','https://stripe.com/docs/api',0),
('Razorpay','razorpay','payments','active','https://api.razorpay.com/v1','ap-south','https://razorpay.com/docs/api',0),
('Twilio','twilio','messaging','active','https://api.twilio.com/2010-04-01','global','https://www.twilio.com/docs/usage/api',612.40),
('Resend','resend','email','active','https://api.resend.com','global','https://resend.com/docs',89.00),
('Google Maps Platform','google-maps','maps','active','https://maps.googleapis.com/maps/api','global','https://developers.google.com/maps/documentation',245.60),
('Cloudflare','cloudflare','infrastructure','active','https://api.cloudflare.com/client/v4','global','https://developers.cloudflare.com/api',320.00),
('Meta WhatsApp Cloud API','whatsapp','messaging','degraded','https://graph.facebook.com/v21.0','ap-south','https://developers.facebook.com/docs/whatsapp',430.80),
('ElevenLabs','elevenlabs','voice','active','https://api.elevenlabs.io/v1','global','https://elevenlabs.io/docs',176.30);

INSERT INTO public.api_services (name, slug, provider_id, type, category, status, endpoint_url, health_status, uptime_pct, avg_latency_ms, version, owner_team, last_checked_at)
SELECT v.name, v.slug, p.id, v.type, v.category, v.status, v.endpoint_url, v.health, v.uptime, v.latency, v.version, v.team, now() - (v.checked || ' minutes')::interval
FROM (VALUES
 ('AI Chat Completions','ai-chat','lovable-ai','external','ai','active','https://ai.gateway.lovable.dev/v1/chat/completions','healthy',99.98,742,'v1','AI Platform','3'),
 ('AI Image Generation','ai-image','lovable-ai','external','ai','active','https://ai.gateway.lovable.dev/v1/images/generations','healthy',99.92,4120,'v1','AI Platform','3'),
 ('AI Embeddings','ai-embeddings','openai','external','ai','active','https://api.openai.com/v1/embeddings','healthy',99.99,180,'v1','AI Platform','4'),
 ('Speech To Text','ai-stt','openai','external','ai','active','https://api.openai.com/v1/audio/transcriptions','healthy',99.85,2210,'v1','AI Platform','6'),
 ('Text To Speech','ai-tts','elevenlabs','external','ai','active','https://api.elevenlabs.io/v1/text-to-speech','degraded',99.10,3320,'v1','AI Platform','2'),
 ('Gemini Vision','gemini-vision','google-ai','external','ai','active','https://generativelanguage.googleapis.com/v1beta/models','healthy',99.94,1640,'v1beta','AI Platform','5'),
 ('Claude Reasoning','claude-reasoning','anthropic','external','ai','active','https://api.anthropic.com/v1/messages','healthy',99.90,1980,'v1','AI Platform','7'),
 ('Payments Charge API','payments-charge','stripe','external','payments','active','https://api.stripe.com/v1/payment_intents','healthy',99.99,310,'2024-06-20','Finance Systems','2'),
 ('Razorpay Orders','razorpay-orders','razorpay','external','payments','active','https://api.razorpay.com/v1/orders','healthy',99.95,420,'v1','Finance Systems','2'),
 ('SMS Delivery','sms-delivery','twilio','external','messaging','active','https://api.twilio.com/2010-04-01/Messages.json','healthy',99.87,530,'2010-04-01','Comms','8'),
 ('WhatsApp Business','whatsapp-business','whatsapp','external','messaging','degraded','https://graph.facebook.com/v21.0/messages','degraded',97.40,1210,'v21.0','Comms','1'),
 ('Transactional Email','email-transactional','resend','external','email','active','https://api.resend.com/emails','healthy',99.96,290,'v1','Comms','4'),
 ('Geocoding','maps-geocoding','google-maps','external','maps','active','https://maps.googleapis.com/maps/api/geocode/json','healthy',99.98,240,'v1','Platform','9'),
 ('CDN Purge','cdn-purge','cloudflare','external','infrastructure','active','https://api.cloudflare.com/client/v4/zones/purge_cache','healthy',99.99,160,'v4','Platform','11'),
 ('Vala Demo Provisioning','demo-provisioning',NULL,'internal','platform','active','/api/internal/demo/provision','healthy',99.93,380,'v2','Demo Manager','6'),
 ('Vala Franchise Sync','franchise-sync',NULL,'internal','platform','active','/api/internal/franchise/sync','healthy',99.88,610,'v2','Franchise Ops','12'),
 ('Vala Wallet Ledger','wallet-ledger',NULL,'internal','finance','active','/api/internal/wallet/ledger','healthy',99.97,210,'v3','Finance Systems','5'),
 ('Vala Lead Router','lead-router',NULL,'internal','sales','maintenance','/api/internal/leads/route','maintenance',98.60,470,'v1','Sales Command','15')
) AS v(name, slug, prov, type, category, status, endpoint_url, health, uptime, latency, version, team, checked)
LEFT JOIN public.ai_providers p ON p.slug = v.prov;

INSERT INTO public.ai_models (provider_id, name, model_id, modality, context_window, input_cost_per_1k, output_cost_per_1k, status, latency_ms, quality_score, is_default)
SELECT p.id, v.name, v.mid, v.modality, v.ctx, v.cin, v.cout, v.status, v.lat, v.q, v.def
FROM (VALUES
 ('lovable-ai','GPT-5.6 Sol','openai/gpt-5.6-sol','text',400000,0.00125,0.01000,'active',980,9.7,true),
 ('lovable-ai','GPT-5.6 Terra','openai/gpt-5.6-terra','text',400000,0.00060,0.00480,'active',720,9.2,false),
 ('lovable-ai','GPT-5.6 Luna','openai/gpt-5.6-luna','text',256000,0.00020,0.00160,'active',410,8.6,false),
 ('lovable-ai','Gemini 3.5 Flash','google/gemini-3.5-flash','text',1000000,0.00030,0.00250,'active',560,8.9,false),
 ('lovable-ai','Gemini 2.5 Pro','google/gemini-2.5-pro','multimodal',2000000,0.00125,0.01000,'active',1640,9.4,false),
 ('lovable-ai','Gemini 2.5 Flash Image','google/gemini-2.5-flash-image','image',32000,0.00000,0.03000,'active',4120,8.8,false),
 ('openai','Text Embedding 3 Small','openai/text-embedding-3-small','embedding',8191,0.00002,0.00000,'active',180,8.4,false),
 ('anthropic','Claude Sonnet','anthropic/claude-sonnet','text',200000,0.00300,0.01500,'evaluation',1980,9.3,false),
 ('elevenlabs','ElevenLabs Multilingual v2','elevenlabs/multilingual-v2','speech',5000,0.00000,0.18000,'active',3320,9.0,false)
) AS v(prov, name, mid, modality, ctx, cin, cout, status, lat, q, def)
LEFT JOIN public.ai_providers p ON p.slug = v.prov;

INSERT INTO public.ai_agents (name, purpose, model_id, status, system_prompt, temperature, max_tokens, tools, runs_30d, success_rate)
SELECT v.name, v.purpose, m.id, v.status, v.prompt, v.temp, v.maxt, v.tools::jsonb, v.runs, v.rate
FROM (VALUES
 ('Lead Qualifier','Scores and routes inbound franchise and reseller leads','openai/gpt-5.6-terra','active','You qualify inbound Software Vala leads. Score intent 0-100, extract budget, territory and product interest, and recommend a routing queue.',0.30,1200,'["crm_lookup","territory_check"]',18420,96.40),
 ('Support Triage Bot','First-response triage for support tickets across all products','openai/gpt-5.6-luna','active','You triage Software Vala support tickets. Classify severity, product area and suggested owner. Never promise refunds.',0.20,900,'["ticket_search","kb_lookup"]',42310,94.10),
 ('Demo Health Analyst','Reviews demo telemetry and flags broken demos','google/gemini-3.5-flash','active','You analyse demo environment telemetry and report broken flows with reproduction steps.',0.10,1500,'["demo_metrics"]',6210,98.20),
 ('Sentiment Monitor','Behaviour and sentiment analysis on client conversations','openai/gpt-5.6-luna','active','You analyse conversation sentiment and escalate churn risk signals.',0.20,600,'[]',31500,95.80),
 ('Keyword Optimizer','SEO keyword expansion and content scoring','google/gemini-3.5-flash','paused','You expand seed keywords into clusters and score existing content coverage.',0.60,2000,'["serp_lookup"]',2140,91.30),
 ('Voice Concierge','Voice bot handling inbound product enquiries','elevenlabs/multilingual-v2','active','You are the Software Vala voice concierge. Keep replies under 3 sentences.',0.40,400,'["catalog_lookup"]',8760,92.70)
) AS v(name, purpose, mid, status, prompt, temp, maxt, tools, runs, rate)
LEFT JOIN public.ai_models m ON m.model_id = v.mid;

INSERT INTO public.api_keys (label, provider_id, service_id, environment, key_prefix, last_four, fingerprint, scopes, status, rotation_days, last_rotated_at, expires_at, last_used_at, created_by)
SELECT v.label, p.id, s.id, v.env, v.prefix, v.last4, encode(gen_random_bytes(16),'hex'), v.scopes::text[], v.status, v.rot,
       now() - (v.rotated || ' days')::interval, now() + (v.expires || ' days')::interval, now() - (v.used || ' minutes')::interval, v.creator
FROM (VALUES
 ('Lovable AI Gateway — Production','lovable-ai','ai-chat','production','lov','7f2c','{chat,image,embeddings}','active',90,'12','78','2','platform@softwarevala.com'),
 ('OpenAI Embeddings — Production','openai','ai-embeddings','production','sk','a91d','{embeddings}','active',90,'34','56','14','platform@softwarevala.com'),
 ('OpenAI Whisper — Production','openai','ai-stt','production','sk','3b58','{audio}','active',90,'34','56','220','platform@softwarevala.com'),
 ('Google AI — Production','google-ai','gemini-vision','production','AIza','c402','{generate,vision}','active',180,'61','119','35','platform@softwarevala.com'),
 ('Anthropic — Evaluation','anthropic','claude-reasoning','staging','sk-ant','de77','{messages}','active',90,'8','82','2880','ai-lab@softwarevala.com'),
 ('Stripe Live','stripe','payments-charge','production','sk_live','9e13','{charges,refunds,customers}','active',180,'45','135','1','finance@softwarevala.com'),
 ('Stripe Test','stripe','payments-charge','sandbox','sk_test','1a06','{charges,refunds}','active',365,'120','245','4320','finance@softwarevala.com'),
 ('Razorpay Live','razorpay','razorpay-orders','production','rzp_live','5c8b','{orders,payments}','active',180,'22','158','6','finance@softwarevala.com'),
 ('Twilio Messaging','twilio','sms-delivery','production','SK','b7f0','{sms}','active',90,'70','20','9','comms@softwarevala.com'),
 ('Resend Transactional','resend','email-transactional','production','re','4d92','{email.send}','active',180,'15','165','3','comms@softwarevala.com'),
 ('WhatsApp Cloud Token','whatsapp','whatsapp-business','production','EAA','0f45','{messages,templates}','expiring',60,'53','7','18','comms@softwarevala.com'),
 ('Google Maps Server Key','google-maps','maps-geocoding','production','AIza','2e6a','{geocoding,places}','active',365,'200','165','12','platform@softwarevala.com'),
 ('Cloudflare API Token','cloudflare','cdn-purge','production','cf','8a31','{cache.purge,zone.read}','active',365,'110','255','1440','platform@softwarevala.com'),
 ('ElevenLabs Voice','elevenlabs','ai-tts','production','el','6c19','{tts}','active',90,'80','10','48','ai-lab@softwarevala.com'),
 ('Legacy Twilio Key','twilio','sms-delivery','production','SK','fa22','{sms}','revoked',90,'400','-40','43200','comms@softwarevala.com')
) AS v(label, prov, svc, env, prefix, last4, scopes, status, rot, rotated, expires, used, creator)
LEFT JOIN public.ai_providers p ON p.slug = v.prov
LEFT JOIN public.api_services s ON s.slug = v.svc;

INSERT INTO public.api_integrations (name, provider_id, category, status, direction, auth_type, webhook_url, last_sync_at, sync_frequency, error_count)
SELECT v.name, p.id, v.cat, v.status, v.dir, v.auth, v.hook, now() - (v.sync || ' minutes')::interval, v.freq, v.errs
FROM (VALUES
 ('Stripe Payment Webhooks','stripe','payments','connected','inbound','signature','/api/public/webhooks/stripe','4','realtime',0),
 ('Razorpay Payment Webhooks','razorpay','payments','connected','inbound','signature','/api/public/webhooks/razorpay','11','realtime',2),
 ('WhatsApp Message Webhooks','whatsapp','messaging','error','inbound','signature','/api/public/webhooks/whatsapp','96','realtime',37),
 ('Twilio Delivery Receipts','twilio','messaging','connected','inbound','signature','/api/public/webhooks/twilio','7','realtime',1),
 ('Resend Delivery Events','resend','email','connected','inbound','signature','/api/public/webhooks/resend','16','realtime',0),
 ('Lovable AI Gateway','lovable-ai','ai','connected','outbound','api_key',NULL,'1','realtime',0),
 ('Cloudflare Cache Automation','cloudflare','infrastructure','connected','outbound','api_key',NULL,'240','hourly',0),
 ('Google Maps Geocoder','google-maps','maps','connected','outbound','api_key',NULL,'34','on-demand',3)
) AS v(name, prov, cat, status, dir, auth, hook, sync, freq, errs)
LEFT JOIN public.ai_providers p ON p.slug = v.prov;

INSERT INTO public.product_apis (product, service_id, enabled, quota_monthly, used_this_month, plan, notes)
SELECT v.product, s.id, v.enabled, v.quota, v.used, v.plan, v.notes
FROM (VALUES
 ('Retail POS','payments-charge',true,500000,318420,'enterprise','Card + UPI settlement path'),
 ('Retail POS','sms-delivery',true,200000,142310,'standard','Order receipts'),
 ('Restaurant POS','payments-charge',true,300000,187640,'enterprise','Table + delivery orders'),
 ('Restaurant POS','ai-chat',true,120000,74210,'standard','Menu assistant'),
 ('School Software','email-transactional',true,250000,96430,'standard','Fee reminders and circulars'),
 ('School Software','whatsapp-business',true,180000,151220,'standard','Parent notifications'),
 ('SaaS HRM','ai-chat',true,150000,88940,'enterprise','Policy assistant'),
 ('SaaS HRM','ai-embeddings',true,400000,214300,'standard','Document search'),
 ('Pro Accounting','ai-chat',true,100000,41260,'standard','Ledger explanations'),
 ('Demo Platform','demo-provisioning',true,60000,38120,'internal','Demo environment spin-up'),
 ('Franchise Portal','franchise-sync',true,90000,55410,'internal','Territory + commission sync'),
 ('Sales CRM','lead-router',false,120000,0,'internal','Paused during maintenance window')
) AS v(product, svc, enabled, quota, used, plan, notes)
LEFT JOIN public.api_services s ON s.slug = v.svc;

INSERT INTO public.role_api_permissions (role_name, service_id, can_read, can_write, can_admin, rate_limit_per_min)
SELECT v.role, s.id, v.r, v.w, v.a, v.rl
FROM (VALUES
 ('boss_owner','ai-chat',true,true,true,600),
 ('boss_owner','payments-charge',true,true,true,600),
 ('ai_manager','ai-chat',true,true,true,600),
 ('ai_manager','ai-image',true,true,true,240),
 ('ai_manager','ai-embeddings',true,true,false,600),
 ('finance_manager','payments-charge',true,true,false,300),
 ('finance_manager','wallet-ledger',true,true,false,300),
 ('support_agent','ai-chat',true,false,false,120),
 ('support_agent','sms-delivery',true,true,false,90),
 ('developer','demo-provisioning',true,true,false,180),
 ('franchise_owner','franchise-sync',true,false,false,60),
 ('reseller','lead-router',true,false,false,60)
) AS v(role, svc, r, w, a, rl)
LEFT JOIN public.api_services s ON s.slug = v.svc;

INSERT INTO public.rate_limits (service_id, scope, window_seconds, max_requests, burst, current_usage, action_on_exceed, enabled)
SELECT s.id, v.scope, v.win, v.maxr, v.burst, v.cur, v.act, v.en
FROM (VALUES
 ('ai-chat','global',60,3000,500,2140,'throttle',true),
 ('ai-chat','per_product',60,600,100,412,'throttle',true),
 ('ai-image','global',60,300,50,168,'queue',true),
 ('ai-embeddings','global',60,6000,1000,3820,'throttle',true),
 ('payments-charge','global',60,1200,200,684,'reject',true),
 ('sms-delivery','global',60,900,150,510,'queue',true),
 ('whatsapp-business','global',60,600,80,588,'throttle',true),
 ('email-transactional','global',60,1500,250,392,'queue',true),
 ('maps-geocoding','global',60,2400,400,910,'throttle',true),
 ('demo-provisioning','global',300,120,20,44,'reject',true)
) AS v(svc, scope, win, maxr, burst, cur, act, en)
LEFT JOIN public.api_services s ON s.slug = v.svc;

-- 60 days of usage rollups + matching event samples
INSERT INTO public.usage_daily (day, service_id, model_id, requests, tokens, cost_usd, errors, avg_latency_ms)
SELECT d::date,
       s.id,
       m.id,
       (base.req * (0.75 + random() * 0.5))::int,
       (base.req * (0.75 + random() * 0.5) * base.tok)::int,
       round((base.req * (0.75 + random() * 0.5) * base.cost)::numeric, 4),
       (base.req * random() * 0.012)::int,
       (base.lat * (0.85 + random() * 0.35))::int
FROM generate_series(CURRENT_DATE - 59, CURRENT_DATE, '1 day') AS d
CROSS JOIN (VALUES
 ('ai-chat','openai/gpt-5.6-terra',9200,780,0.0031,742),
 ('ai-chat','openai/gpt-5.6-luna',14100,540,0.0009,410),
 ('ai-image','google/gemini-2.5-flash-image',640,0,0.0300,4120),
 ('ai-embeddings','openai/text-embedding-3-small',22800,420,0.00002,180),
 ('gemini-vision','google/gemini-2.5-pro',2100,1400,0.0088,1640),
 ('payments-charge',NULL,18400,0,0,310),
 ('sms-delivery',NULL,7600,0,0,530),
 ('whatsapp-business',NULL,9100,0,0,1210),
 ('email-transactional',NULL,5400,0,0,290),
 ('maps-geocoding',NULL,12300,0,0,240)
) AS base(svc, mid, req, tok, cost, lat)
JOIN public.api_services s ON s.slug = base.svc
LEFT JOIN public.ai_models m ON m.model_id = base.mid;

INSERT INTO public.usage_events (occurred_at, service_id, model_id, product, requests, tokens_in, tokens_out, cost_usd, latency_ms, status_code, success, source)
SELECT now() - (g * interval '7 minutes'),
       s.id, m.id,
       (ARRAY['Retail POS','Restaurant POS','School Software','SaaS HRM','Pro Accounting','Demo Platform'])[1 + (g % 6)],
       1,
       (300 + random() * 900)::int,
       (120 + random() * 600)::int,
       round((0.0004 + random() * 0.004)::numeric, 6),
       (200 + random() * 1800)::int,
       CASE WHEN random() < 0.972 THEN 200 WHEN random() < 0.6 THEN 429 ELSE 500 END,
       random() < 0.972,
       'app'
FROM generate_series(0, 599) AS g
JOIN LATERAL (SELECT id FROM public.api_services ORDER BY md5(g::text || slug) LIMIT 1) s ON true
LEFT JOIN LATERAL (SELECT id FROM public.ai_models ORDER BY md5(g::text || model_id) LIMIT 1) m ON true;

INSERT INTO public.billing_plans (name, provider_id, billing_cycle, included_requests, overage_per_1k, monthly_fee, currency, status, renewal_date)
SELECT v.name, p.id, v.cycle, v.incl, v.over, v.fee, 'USD', v.status, CURRENT_DATE + v.renew
FROM (VALUES
 ('Lovable AI — Scale','lovable-ai','monthly',5000000,1.2500,1500.00,'active',12),
 ('OpenAI — Enterprise Commit','openai','monthly',8000000,0.9000,2500.00,'active',19),
 ('Google AI — Pay As You Go','google-ai','monthly',0,0.7500,0.00,'active',9),
 ('Anthropic — Evaluation Tier','anthropic','monthly',250000,3.0000,0.00,'trial',22),
 ('Twilio — Committed Use','twilio','monthly',1500000,0.4200,499.00,'active',5),
 ('Resend — Pro','resend','monthly',500000,0.1000,89.00,'active',27),
 ('Cloudflare — Business','cloudflare','monthly',0,0.0000,320.00,'active',3),
 ('ElevenLabs — Growth','elevenlabs','monthly',2000000,0.1800,165.00,'active',16)
) AS v(name, prov, cycle, incl, over, fee, status, renew)
LEFT JOIN public.ai_providers p ON p.slug = v.prov;

INSERT INTO public.invoices (invoice_number, provider_id, period_start, period_end, amount_usd, tax_usd, status, issued_at, due_at, paid_at)
SELECT v.num, p.id, v.ps::date, v.pe::date, v.amt, v.tax, v.status, v.iss::date, v.due::date, v.paid::date
FROM (VALUES
 ('SV-AIG-2026-06','lovable-ai',date_trunc('month', CURRENT_DATE - 60)::text, (date_trunc('month', CURRENT_DATE - 60) + interval '1 month - 1 day')::text,1842.60,331.67,'paid',(CURRENT_DATE-58)::text,(CURRENT_DATE-44)::text,(CURRENT_DATE-51)::text),
 ('SV-OAI-2026-06','openai',date_trunc('month', CURRENT_DATE - 60)::text, (date_trunc('month', CURRENT_DATE - 60) + interval '1 month - 1 day')::text,2960.75,532.94,'paid',(CURRENT_DATE-58)::text,(CURRENT_DATE-44)::text,(CURRENT_DATE-49)::text),
 ('SV-AIG-2026-07','lovable-ai',date_trunc('month', CURRENT_DATE - 30)::text, (date_trunc('month', CURRENT_DATE - 30) + interval '1 month - 1 day')::text,1910.40,343.87,'paid',(CURRENT_DATE-28)::text,(CURRENT_DATE-14)::text,(CURRENT_DATE-20)::text),
 ('SV-OAI-2026-07','openai',date_trunc('month', CURRENT_DATE - 30)::text, (date_trunc('month', CURRENT_DATE - 30) + interval '1 month - 1 day')::text,3104.10,558.74,'overdue',(CURRENT_DATE-28)::text,(CURRENT_DATE-14)::text,NULL),
 ('SV-TWL-2026-07','twilio',date_trunc('month', CURRENT_DATE - 30)::text, (date_trunc('month', CURRENT_DATE - 30) + interval '1 month - 1 day')::text,612.40,110.23,'paid',(CURRENT_DATE-28)::text,(CURRENT_DATE-14)::text,(CURRENT_DATE-18)::text),
 ('SV-GAI-2026-08','google-ai',date_trunc('month', CURRENT_DATE)::text, CURRENT_DATE::text,1420.00,255.60,'pending',CURRENT_DATE::text,(CURRENT_DATE+14)::text,NULL),
 ('SV-ELB-2026-08','elevenlabs',date_trunc('month', CURRENT_DATE)::text, CURRENT_DATE::text,176.30,31.73,'pending',CURRENT_DATE::text,(CURRENT_DATE+14)::text,NULL)
) AS v(num, prov, ps, pe, amt, tax, status, iss, due, paid)
LEFT JOIN public.ai_providers p ON p.slug = v.prov;

INSERT INTO public.wallets (name, currency, balance, low_balance_threshold, auto_topup, auto_topup_amount, status) VALUES
('AI Operations Wallet','USD',8420.55,2000.00,true,5000.00,'active'),
('Messaging Wallet','USD',1284.10,1500.00,true,2000.00,'low'),
('Franchise Payout Wallet','INR',462800.00,100000.00,false,0.00,'active'),
('R&D Experiments Wallet','USD',3150.00,500.00,false,0.00,'active');

INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, description, created_at)
SELECT w.id, v.type, v.amt, v.after, v.ref, v.descr, now() - (v.ago || ' hours')::interval
FROM (VALUES
 ('AI Operations Wallet','topup',5000.00,12420.55,'TOPUP-88213','Auto top-up triggered at threshold','96'),
 ('AI Operations Wallet','debit',-1840.50,10580.05,'AIG-USAGE-07','Lovable AI Gateway usage settlement','72'),
 ('AI Operations Wallet','debit',-2159.50,8420.55,'OAI-USAGE-07','OpenAI usage settlement','48'),
 ('Messaging Wallet','topup',2000.00,3284.10,'TOPUP-88420','Auto top-up triggered at threshold','120'),
 ('Messaging Wallet','debit',-1200.00,2084.10,'TWL-USAGE-07','Twilio SMS settlement','60'),
 ('Messaging Wallet','debit',-800.00,1284.10,'WA-USAGE-07','WhatsApp conversation charges','12'),
 ('Franchise Payout Wallet','credit',180000.00,462800.00,'FR-COMM-2026-07','Franchise commission credit','36'),
 ('R&D Experiments Wallet','debit',-350.00,3150.00,'ANT-EVAL-01','Anthropic evaluation spend','24')
) AS v(wallet, type, amt, after, ref, descr, ago)
JOIN public.wallets w ON w.name = v.wallet;

INSERT INTO public.cost_recommendations (title, category, detail, estimated_monthly_saving, effort, status, service_id)
SELECT v.title, v.cat, v.detail, v.save, v.effort, v.status, s.id
FROM (VALUES
 ('Route short support replies to GPT-5.6 Luna','model-routing','62% of support triage prompts are under 400 tokens and score identically on Luna. Switch the triage agent default model.',742.00,'low','open','ai-chat'),
 ('Cache repeated embedding requests','caching','18% of embedding calls repeat the same document hash within 24 hours. Add a content-hash cache.',311.00,'medium','open','ai-embeddings'),
 ('Batch geocoding lookups','batching','Geocoding is called per-row during franchise import. Batch to 25 addresses per request.',96.00,'low','in_progress','maps-geocoding'),
 ('Consolidate WhatsApp template sends','provider','Duplicate template sends to the same parent within 10 minutes account for 7% of volume.',180.00,'medium','open','whatsapp-business'),
 ('Downgrade Anthropic evaluation tier','plan','Evaluation traffic has been below 4% of the committed volume for two cycles.',420.00,'low','open','claude-reasoning'),
 ('Compress TTS output to 64kbps','optimization','Voice concierge audio is generated at 128kbps but played back at phone quality.',88.00,'low','done','ai-tts')
) AS v(title, cat, detail, save, effort, status, svc)
LEFT JOIN public.api_services s ON s.slug = v.svc;

INSERT INTO public.api_request_logs (occurred_at, service_id, method, path, status_code, latency_ms, ip, user_agent, request_id, error_message)
SELECT now() - (g * interval '3 minutes'),
       s.id,
       (ARRAY['GET','POST','POST','POST','DELETE'])[1 + (g % 5)],
       s.endpoint_url,
       CASE WHEN g % 37 = 0 THEN 500 WHEN g % 19 = 0 THEN 429 WHEN g % 23 = 0 THEN 401 ELSE 200 END,
       (120 + random() * 2400)::int,
       '203.0.113.' || (1 + (g % 250)),
       'SoftwareVala/2035.8 (+platform)',
       'req_' || encode(gen_random_bytes(6),'hex'),
       CASE WHEN g % 37 = 0 THEN 'Upstream provider returned 500' WHEN g % 19 = 0 THEN 'Rate limit exceeded for scope global' WHEN g % 23 = 0 THEN 'Invalid or expired API key' ELSE NULL END
FROM generate_series(0, 399) AS g
JOIN LATERAL (SELECT id, endpoint_url, slug FROM public.api_services ORDER BY md5(g::text || slug) LIMIT 1) s ON true;

INSERT INTO public.ai_decision_logs (occurred_at, agent_id, model_id, decision, confidence, input_summary, output_summary, tokens, cost_usd, outcome)
SELECT now() - (g * interval '19 minutes'),
       a.id, a.model_id,
       (ARRAY['Routed lead to Gujarat franchise queue','Escalated ticket to Tier 2 support','Flagged demo environment as broken','Marked conversation as churn risk','Approved automated refund review','Suggested keyword cluster expansion'])[1 + (g % 6)],
       round((72 + random() * 27)::numeric, 2),
       (ARRAY['Inbound lead form, retail POS, Ahmedabad','Ticket #48213 payment failure','Demo telemetry: restaurant-pos-new','Chat transcript, 14 turns','Refund request INR 12,400','Seed keyword: billing software india'])[1 + (g % 6)],
       (ARRAY['Queue: franchise-gj, score 84','Severity: high, owner: payments','Broken: checkout step 3 timeout','Risk: 0.71, action: notify CSM','Recommend manual review','32 keyword clusters generated'])[1 + (g % 6)],
       (280 + random() * 1600)::int,
       round((0.0006 + random() * 0.006)::numeric, 6),
       (ARRAY['accepted','accepted','accepted','overridden','accepted','accepted'])[1 + (g % 6)]
FROM generate_series(0, 199) AS g
JOIN LATERAL (SELECT id, model_id FROM public.ai_agents ORDER BY md5(g::text || name) LIMIT 1) a ON true;

INSERT INTO public.audit_logs (occurred_at, actor, action, entity_type, entity_id, severity, metadata, ip) VALUES
(now() - interval '18 minutes','platform@softwarevala.com','api_key.rotated','api_key','Lovable AI Gateway — Production','info','{"rotation":"scheduled"}','198.51.100.24'),
(now() - interval '2 hours','ai-lab@softwarevala.com','model.enabled','ai_model','anthropic/claude-sonnet','info','{"stage":"evaluation"}','198.51.100.31'),
(now() - interval '5 hours','finance@softwarevala.com','billing_plan.updated','billing_plan','OpenAI — Enterprise Commit','warning','{"monthly_fee":"2500.00"}','198.51.100.12'),
(now() - interval '9 hours','system','rate_limit.triggered','rate_limit','whatsapp-business','warning','{"scope":"global","peak":588}','127.0.0.1'),
(now() - interval '14 hours','platform@softwarevala.com','emergency_control.engaged','emergency_control','pause_image_generation','critical','{"reason":"cost spike"}','198.51.100.24'),
(now() - interval '20 hours','platform@softwarevala.com','emergency_control.released','emergency_control','pause_image_generation','info','{}','198.51.100.24'),
(now() - interval '1 day','comms@softwarevala.com','integration.reconnected','api_integration','WhatsApp Message Webhooks','warning','{"errors_cleared":31}','198.51.100.44'),
(now() - interval '2 days','system','automation_rule.executed','automation_rule','Auto-throttle on cost spike','info','{"action":"throttle","service":"ai-image"}','127.0.0.1'),
(now() - interval '3 days','platform@softwarevala.com','api_key.revoked','api_key','Legacy Twilio Key','critical','{"reason":"superseded"}','198.51.100.24'),
(now() - interval '4 days','ai-lab@softwarevala.com','prompt.published','prompt','support-triage-v4','info','{"version":4}','198.51.100.31');

INSERT INTO public.security_alerts (detected_at, title, severity, category, source, status, description, resolved_at) VALUES
(now() - interval '42 minutes','Repeated 401s from unknown IP range','high','access','gateway','open','214 requests with an invalid API key from 203.0.113.0/24 in 10 minutes.',NULL),
(now() - interval '3 hours','WhatsApp token nearing expiry','medium','credentials','scheduler','open','WhatsApp Cloud token expires in 7 days and has no rotation job.',NULL),
(now() - interval '11 hours','Unusual image generation spend','medium','cost','cost-monitor','acknowledged','Image generation spend is 3.1x the 30-day median for this hour.',NULL),
(now() - interval '1 day','Prompt injection attempt blocked','high','ai-safety','safety-filter','resolved','Support triage input contained an instruction override pattern; blocked by policy.',now() - interval '22 hours'),
(now() - interval '2 days','Service role key used from new region','critical','access','gateway','resolved','Server key observed from ap-south-1 for the first time; confirmed as new worker region.',now() - interval '1 day'),
(now() - interval '4 days','Rate limit sustained at 98% for 30 minutes','low','capacity','rate-limiter','resolved','WhatsApp Business global limit sustained near ceiling during exam-result broadcast.',now() - interval '3 days');

INSERT INTO public.incidents (title, severity, status, started_at, resolved_at, impact, root_cause, service_id, postmortem_url)
SELECT v.title, v.sev, v.status, now() - (v.started || ' hours')::interval,
       CASE WHEN v.resolved IS NULL THEN NULL ELSE now() - (v.resolved || ' hours')::interval END,
       v.impact, v.cause, s.id, v.pm
FROM (VALUES
 ('WhatsApp delivery failures for parent notifications','sev2','investigating','6',NULL,'School Software notifications delayed for ~4,200 parents','Upstream template rate limiting under review','whatsapp-business',NULL),
 ('Elevated TTS latency','sev3','monitoring','20','2','Voice concierge responses averaged 6.2s','Provider region failover to eu-west','ai-tts',NULL),
 ('Image generation cost spike','sev3','resolved','54','48','No customer impact; $340 unplanned spend','Retry loop in demo seeding script','ai-image','/docs/postmortems/img-cost-spike'),
 ('Payment webhook backlog','sev2','resolved','120','116','Order confirmations delayed up to 9 minutes','Webhook consumer pod eviction','payments-charge','/docs/postmortems/webhook-backlog'),
 ('Lead router maintenance overrun','sev4','resolved','200','190','Lead routing paused for 10 hours','Planned migration ran long','lead-router',NULL)
) AS v(title, sev, status, started, resolved, impact, cause, svc, pm)
LEFT JOIN public.api_services s ON s.slug = v.svc;

INSERT INTO public.automation_rules (name, trigger_type, condition, action_type, action_config, enabled, last_run_at, run_count) VALUES
('Auto-throttle on cost spike','threshold','{"metric":"hourly_cost_usd","operator":">","value":75,"service":"ai-image"}','throttle','{"scope":"global","max_requests":120}',true, now() - interval '11 hours', 14),
('Rotate keys older than 90 days','schedule','{"cron":"0 3 * * 1","max_age_days":90}','rotate_key','{"notify":["platform@softwarevala.com"]}',true, now() - interval '3 days', 26),
('Alert on 5xx burst','threshold','{"metric":"error_rate_5m","operator":">","value":0.05}','notify','{"channels":["email","in_app"]}',true, now() - interval '9 hours', 118),
('Fail over TTS to backup voice','threshold','{"metric":"latency_p95_ms","operator":">","value":5000,"service":"ai-tts"}','failover','{"target":"ai-chat-tts-fallback"}',true, now() - interval '20 hours', 3),
('Disable expired keys','schedule','{"cron":"0 * * * *"}','revoke_key','{"grace_hours":24}',true, now() - interval '38 minutes', 742),
('Downgrade idle evaluation models','schedule','{"cron":"0 4 1 * *","idle_days":30}','notify','{"channels":["email"]}',false, NULL, 0);

INSERT INTO public.emergency_controls (key, label, description, engaged, engaged_at, engaged_by, scope) VALUES
('global_ai_kill_switch','Global AI Kill Switch','Immediately stops every outbound AI model call across all products.',false,NULL,NULL,'global'),
('pause_image_generation','Pause Image Generation','Stops image generation traffic while keeping text models online.',false,now() - interval '20 hours','platform@softwarevala.com','service'),
('freeze_api_keys','Freeze All API Keys','Blocks new key issuance and suspends non-critical keys.',false,NULL,NULL,'global'),
('block_external_apis','Block External APIs','Blocks all non-internal outbound API traffic.',false,NULL,NULL,'global'),
('read_only_mode','Read-Only Mode','Allows reads but rejects every write across the manager.',false,NULL,NULL,'global'),
('suspend_wallet_debits','Suspend Wallet Debits','Stops automatic wallet debits and auto top-ups.',false,NULL,NULL,'finance'),
('maintenance_banner','Maintenance Broadcast','Shows a maintenance banner across all product surfaces.',false,NULL,NULL,'global');

INSERT INTO public.prompts (name, slug, category, current_version, owner, status, description) VALUES
('Support Triage','support-triage-v4','support',4,'Support Ops','active','Classifies tickets by severity, product and owner.'),
('Lead Qualification','lead-qualification','sales',3,'Sales Command','active','Scores inbound leads and recommends a routing queue.'),
('Demo Health Report','demo-health-report','platform',2,'Demo Manager','active','Summarises demo telemetry into an actionable report.'),
('Churn Risk Analysis','churn-risk-analysis','client-success',5,'Client Success','active','Detects churn signals in conversation transcripts.'),
('SEO Keyword Expansion','seo-keyword-expansion','marketing',2,'SEO Manager','draft','Expands seed keywords into clusters with intent labels.'),
('Voice Concierge','voice-concierge','voice',1,'AI Platform','active','Short spoken answers for inbound product enquiries.');

INSERT INTO public.prompt_versions (prompt_id, version, content, notes, is_active, created_by, created_at)
SELECT p.id, v.ver, v.content, v.notes, v.active, v.author, now() - (v.ago || ' days')::interval
FROM (VALUES
 ('support-triage-v4',3,'You triage Software Vala support tickets. Return severity, product area and owner.','Baseline version',false,'Support Ops','40'),
 ('support-triage-v4',4,'You triage Software Vala support tickets. Classify severity, product area and suggested owner. Never promise refunds or timelines.','Added refund guardrail after audit',true,'Support Ops','9'),
 ('lead-qualification',2,'Score inbound leads 0-100 based on intent and budget.','Baseline version',false,'Sales Command','55'),
 ('lead-qualification',3,'Score inbound leads 0-100 on intent, budget, territory fit and product interest. Return a routing queue.','Added territory routing',true,'Sales Command','16'),
 ('demo-health-report',2,'Analyse demo telemetry and report broken flows with reproduction steps and severity.','Added reproduction steps',true,'Demo Manager','21'),
 ('churn-risk-analysis',5,'Analyse conversation sentiment and return churn risk 0-1 with the three strongest signals.','Reduced false positives',true,'Client Success','6'),
 ('seo-keyword-expansion',2,'Expand the seed keyword into clusters with search intent and difficulty estimates.','Draft under review',true,'SEO Manager','3'),
 ('voice-concierge',1,'You are the Software Vala voice concierge. Keep replies under three sentences and always offer a demo.','Initial release',true,'AI Platform','28')
) AS v(slug, ver, content, notes, active, author, ago)
JOIN public.prompts p ON p.slug = v.slug;

INSERT INTO public.fine_tuning_jobs (name, base_model, dataset_name, dataset_rows, status, progress, started_at, completed_at, cost_usd, result_model_id, metrics) VALUES
('Support triage specialist v2','openai/gpt-5.6-luna','support_tickets_labelled_2026',48200,'completed',100, now() - interval '18 days', now() - interval '17 days', 412.60,'sv-support-triage-v2','{"accuracy":0.941,"f1":0.928}'),
('Lead scoring regional tuning','openai/gpt-5.6-terra','leads_india_2025_2026',26400,'completed',100, now() - interval '9 days', now() - interval '8 days', 688.20,'sv-lead-scoring-in','{"auc":0.897,"precision":0.874}'),
('Invoice field extraction','google/gemini-3.5-flash','invoices_ocr_pairs',15800,'running',62, now() - interval '6 hours', NULL, 210.00,NULL,'{"step":"epoch 2/3"}'),
('Gujarati support replies','openai/gpt-5.6-luna','support_gu_transcripts',9100,'queued',0, NULL, NULL, 0.00,NULL,'{}'),
('Churn signal classifier','openai/gpt-5.6-luna','csat_churn_labels',12300,'failed',34, now() - interval '25 days', now() - interval '25 days', 96.40,NULL,'{"error":"dataset validation failed on 412 rows"}');

INSERT INTO public.model_evaluations (model_id, suite, metric, score, baseline, evaluated_at, status, notes)
SELECT m.id, v.suite, v.metric, v.score, v.baseline, now() - (v.ago || ' days')::interval, v.status, v.notes
FROM (VALUES
 ('openai/gpt-5.6-sol','Support Triage Golden Set','accuracy',96.20,94.00,'2','passed','Best overall accuracy, highest cost'),
 ('openai/gpt-5.6-terra','Support Triage Golden Set','accuracy',94.80,94.00,'2','passed','Recommended default for triage'),
 ('openai/gpt-5.6-luna','Support Triage Golden Set','accuracy',92.10,94.00,'2','warning','Below baseline on multi-issue tickets'),
 ('google/gemini-3.5-flash','Lead Scoring Backtest','auc',88.40,86.00,'5','passed','Strong on territory features'),
 ('google/gemini-2.5-pro','Document Vision Set','field_f1',93.70,90.00,'7','passed','Best on scanned invoices'),
 ('openai/gpt-5.6-terra','Safety Red Team','refusal_rate',99.10,98.00,'3','passed','No jailbreak escapes in 1,200 prompts'),
 ('openai/gpt-5.6-luna','Latency Benchmark','p95_ms',612.00,800.00,'1','passed','Fastest text model in fleet'),
 ('anthropic/claude-sonnet','Support Triage Golden Set','accuracy',95.10,94.00,'4','passed','Under commercial evaluation')
) AS v(mid, suite, metric, score, baseline, ago, status, notes)
JOIN public.ai_models m ON m.model_id = v.mid;

INSERT INTO public.safety_policies (name, category, severity_threshold, action, enabled, violations_30d, description) VALUES
('Prompt injection detection','security','medium','block',true,214,'Blocks instruction-override patterns in user supplied content.'),
('PII redaction before model call','privacy','low','redact',true,4820,'Redacts phone numbers, emails, PAN and Aadhaar before any model call.'),
('Financial advice guardrail','content','medium','block',true,63,'Prevents agents from issuing binding financial or legal advice.'),
('Refund promise guardrail','business','low','rewrite',true,142,'Rewrites replies that promise refunds or delivery timelines.'),
('Toxicity filter','content','high','block',true,38,'Blocks abusive or harassing generations in customer-facing channels.'),
('Model output length cap','operations','low','truncate',true,910,'Caps agent responses to configured max tokens per channel.'),
('Off-topic drift monitor','quality','low','flag',false,0,'Flags conversations drifting away from the product domain.');

INSERT INTO public.data_governance_rules (name, data_class, region, retention_days, masking, encryption, compliance_tags, enabled) VALUES
('Customer chat transcripts','confidential','ap-south',180,'partial','aes-256','{DPDP,ISO27001}',true),
('Payment metadata','restricted','global',2555,'full','aes-256','{PCI-DSS,SOC2}',true),
('Support ticket attachments','confidential','ap-south',365,'partial','aes-256','{DPDP}',true),
('AI prompt and completion logs','internal','global',90,'partial','aes-256','{SOC2}',true),
('Student records (School Software)','restricted','ap-south',1095,'full','aes-256','{DPDP,COPPA-like}',true),
('Model evaluation datasets','internal','global',730,'none','aes-256','{SOC2}',true),
('Voice recordings','confidential','ap-south',60,'full','aes-256','{DPDP}',true);

INSERT INTO public.on_device_models (name, framework, size_mb, platforms, version, status, downloads, accuracy) VALUES
('Receipt OCR Lite','onnx',18.40,'{android,ios}','2.3.0','published',24810,94.20),
('Offline Intent Classifier','tflite',6.10,'{android}','1.8.2','published',41320,91.60),
('Barcode + Label Reader','coreml',11.80,'{ios}','3.0.1','published',18740,96.80),
('Voice Wake Word','tflite',2.30,'{android,ios}','1.2.0','beta',3120,88.40),
('Handwriting Field Extract','onnx',31.60,'{android,ios}','0.9.4','experimental',640,82.10);

INSERT INTO public.model_versions (model_id, version, stage, released_at, deprecate_at, retire_at, notes)
SELECT m.id, v.ver, v.stage, v.rel::date, v.dep::date, v.ret::date, v.notes
FROM (VALUES
 ('openai/gpt-5.6-sol','2026.06','production',(CURRENT_DATE-70)::text,NULL,NULL,'Flagship reasoning model'),
 ('openai/gpt-5.6-terra','2026.06','production',(CURRENT_DATE-70)::text,NULL,NULL,'Default for high-volume agents'),
 ('openai/gpt-5.6-luna','2026.06','production',(CURRENT_DATE-70)::text,NULL,NULL,'Latency-optimised tier'),
 ('google/gemini-3.5-flash','2026.05','production',(CURRENT_DATE-95)::text,NULL,NULL,'Long-context workloads'),
 ('google/gemini-2.5-pro','2025.11','deprecated',(CURRENT_DATE-260)::text,(CURRENT_DATE+30)::text,(CURRENT_DATE+90)::text,'Migrate vision workloads to Gemini 3.x'),
 ('anthropic/claude-sonnet','2026.07','evaluation',(CURRENT_DATE-30)::text,NULL,NULL,'Commercial evaluation in progress'),
 ('openai/text-embedding-3-small','2024.01','production',(CURRENT_DATE-600)::text,NULL,NULL,'Search and RAG embeddings')
) AS v(mid, ver, stage, rel, dep, ret, notes)
JOIN public.ai_models m ON m.model_id = v.mid;

INSERT INTO public.system_settings (key, label, value, value_type, category, description) VALUES
('default_chat_model','Default chat model','openai/gpt-5.6-sol','text','ai','Model used when an agent does not pin one.'),
('default_temperature','Default temperature','0.4','number','ai','Applied to agents without an explicit temperature.'),
('global_request_timeout_ms','Global request timeout','30000','number','operations','Outbound API timeout before failing over.'),
('retry_policy','Retry policy','exponential:3','text','operations','Retry strategy for retryable upstream errors.'),
('cost_alert_threshold_usd','Daily cost alert threshold','450','number','finance','Triggers a cost alert when daily spend exceeds this.'),
('log_retention_days','Log retention','90','number','governance','How long request and decision logs are kept.'),
('pii_redaction','PII redaction','true','boolean','governance','Redact personal data before any model call.'),
('health_check_interval_minutes','Health check interval','5','number','monitoring','How often service health checks run.'),
('notify_email','Operations notification email','platform@softwarevala.com','text','notifications','Recipient for automation and alert emails.'),
('maintenance_mode','Maintenance mode','false','boolean','operations','Shows the maintenance banner and pauses non-critical jobs.');
