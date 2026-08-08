CREATE TABLE public.router_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pattern text NOT NULL,
  target_model text NOT NULL,
  fallback_model text,
  priority text NOT NULL DEFAULT 'medium',
  active boolean NOT NULL DEFAULT true,
  matches_30d integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.router_rules TO service_role;
ALTER TABLE public.router_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cache_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  model text NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  cost_saved_usd numeric NOT NULL DEFAULT 0,
  ttl_hours integer NOT NULL DEFAULT 24,
  size_kb numeric NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cache_entries TO service_role;
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.failover_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  from_model text NOT NULL,
  to_model text NOT NULL,
  reason text NOT NULL,
  extra_latency_ms integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT 'success'
);
GRANT ALL ON public.failover_events TO service_role;
ALTER TABLE public.failover_events ENABLE ROW LEVEL SECURITY;

INSERT INTO public.router_rules (name, pattern, target_model, fallback_model, priority, active, matches_30d, sort_order) VALUES
  ('Code Generation', '*code*|*build*|*generate*', 'GPT-5', 'Claude Sonnet 4', 'high', true, 48210, 1),
  ('Chat & Support', '*chat*|*help*|*support*', 'GPT-5-mini', 'Gemini 2.5 Flash', 'medium', true, 128400, 2),
  ('Classification', '*classify*|*categorize*', 'GPT-5-nano', 'Claude Haiku 3.5', 'low', true, 89100, 3),
  ('Vision & Image', '*image*|*vision*|*photo*', 'GPT-4o', 'Gemini 2.5 Pro', 'medium', true, 34700, 4),
  ('Voice & TTS', '*voice*|*speech*|*audio*', 'ElevenLabs TTS', 'Whisper', 'medium', true, 7800, 5),
  ('Fast Queries', '*quick*|*simple*|*short*', 'Gemini 3 Flash', 'GPT-5-nano', 'low', false, 31500, 6);

INSERT INTO public.cache_entries (cache_key, model, hits, cost_saved_usd, ttl_hours, size_kb, last_hit_at) VALUES
  ('hash:a8f2c4e1b7', 'GPT-5-mini', 342, 4.82, 24, 2.1, now() - interval '4 minutes'),
  ('hash:b3d1e9a2c5', 'Claude Haiku 3.5', 128, 1.28, 12, 1.4, now() - interval '22 minutes'),
  ('hash:c7a9f3d8e2', 'Gemini 2.5 Flash', 891, 8.91, 48, 3.2, now() - interval '1 minute'),
  ('hash:d2b4c6f1a9', 'GPT-5-nano', 567, 3.40, 6, 0.8, now() - interval '9 minutes'),
  ('hash:e5f8a2c7d4', 'GPT-5', 89, 12.46, 1, 4.7, now() - interval '38 minutes'),
  ('hash:f1c3d5b8e6', 'Gemini 2.5 Pro', 214, 6.18, 24, 2.9, now() - interval '2 hours');

INSERT INTO public.failover_events (occurred_at, from_model, to_model, reason, extra_latency_ms, result) VALUES
  (now() - interval '2 hours', 'GPT-5', 'Claude Sonnet 4', 'Rate limit 429', 300, 'success'),
  (now() - interval '5 hours', 'Gemini 2.5 Pro', 'GPT-4o', 'Timeout 30s', 800, 'success'),
  (now() - interval '9 hours', 'ElevenLabs TTS', 'Whisper', 'Service 503', 1200, 'success'),
  (now() - interval '14 hours', 'Claude Sonnet 4', 'GPT-5', 'Auth error 401', 500, 'success'),
  (now() - interval '20 hours', 'GPT-5-nano', 'Gemini 3 Flash', 'Rate limit 429', 100, 'success'),
  (now() - interval '2 days', 'GPT-4o', 'Gemini 2.5 Pro', 'Upstream 502', 700, 'success'),
  (now() - interval '3 days', 'Gemini 2.5 Flash', 'GPT-5-nano', 'Rate limit 429', 200, 'success');