CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  vendor text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  version text NOT NULL DEFAULT '1.0.0',
  docs_url text,
  webhook_url text,
  base_url text,
  scopes text[] NOT NULL DEFAULT '{}',
  price_usd_month numeric(10,2) NOT NULL DEFAULT 0,
  is_official boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'available',
  install_count integer NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.extension_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  product text NOT NULL DEFAULT 'platform',
  environment text NOT NULL DEFAULT 'production',
  status text NOT NULL DEFAULT 'active',
  health text NOT NULL DEFAULT 'healthy',
  granted_scopes text[] NOT NULL DEFAULT '{}',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  installed_by text NOT NULL DEFAULT 'console@softwarevala.com',
  monthly_cost_usd numeric(12,2) NOT NULL DEFAULT 0,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.extension_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id uuid REFERENCES public.extensions(id) ON DELETE CASCADE,
  install_id uuid REFERENCES public.extension_installs(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  message text,
  latency_ms integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_extension_installs_extension ON public.extension_installs(extension_id);
CREATE INDEX idx_extension_events_extension ON public.extension_events(extension_id);
CREATE INDEX idx_extension_events_occurred ON public.extension_events(occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extensions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_installs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_events TO authenticated;
GRANT SELECT ON public.extensions TO anon;
GRANT ALL ON public.extensions TO service_role;
GRANT ALL ON public.extension_installs TO service_role;
GRANT ALL ON public.extension_events TO service_role;

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extensions catalog readable by anyone" ON public.extensions FOR SELECT USING (true);
CREATE POLICY "Console users manage extensions" ON public.extensions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Console users manage extension installs" ON public.extension_installs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Console users manage extension events" ON public.extension_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON public.extensions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_extension_installs_updated_at BEFORE UPDATE ON public.extension_installs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.extensions (slug, name, vendor, category, description, version, docs_url, webhook_url, base_url, scopes, price_usd_month, is_official, status, install_count, rating) VALUES
('stripe-payments','Stripe Payments','Stripe','payments','Card, UPI and wallet collection with automatic reconciliation into the billing engine.','2024-11-20','https://docs.stripe.com/api','https://api.softwarevala.com/webhooks/stripe','https://api.stripe.com','{payments.read,payments.write,invoices.write}',0,true,'installed',412,4.90),
('razorpay-upi','Razorpay UPI','Razorpay','payments','UPI intent, collect and mandate flows for wallet top-ups in India.','1.8.4','https://razorpay.com/docs/api/','https://api.softwarevala.com/webhooks/razorpay','https://api.razorpay.com','{wallet.write,payments.read}',0,true,'installed',298,4.70),
('twilio-messaging','Twilio Messaging','Twilio','messaging','Programmable SMS and WhatsApp delivery with per-message cost attribution.','2010-04-01','https://www.twilio.com/docs/usage/api','https://api.softwarevala.com/webhooks/twilio','https://api.twilio.com','{messaging.send,usage.write}',0,true,'installed',356,4.60),
('sendgrid-email','SendGrid Email','Twilio SendGrid','messaging','Transactional email delivery, bounce handling and template management.','3.0.0','https://www.twilio.com/docs/sendgrid/api-reference',NULL,'https://api.sendgrid.com','{email.send,email.read}',0,false,'available',201,4.40),
('sentry-errors','Sentry Error Tracking','Functional Software','monitoring','Streams runtime exceptions from the console into the error monitoring module.','8.0.0','https://docs.sentry.io/api/','https://api.softwarevala.com/webhooks/sentry','https://sentry.io/api/0','{errors.write,incidents.write}',26.00,false,'installed',188,4.80),
('datadog-apm','Datadog APM','Datadog','monitoring','Latency, throughput and error-rate metrics for every registered API service.','v1','https://docs.datadoghq.com/api/latest/',NULL,'https://api.datadoghq.com/api/v1','{monitoring.read,monitoring.write}',31.00,false,'available',147,4.50),
('slack-alerts','Slack Alerts','Slack','automation','Routes wallet, cost-spike and security alerts to Slack channels.','2.0','https://api.slack.com/web','https://api.softwarevala.com/webhooks/slack','https://slack.com/api','{alerts.read,notifications.send}',0,true,'installed',503,4.90),
('github-deploy','GitHub Deployments','GitHub','automation','Links deployments and model version releases to repository commits.','2022-11-28','https://docs.github.com/en/rest','https://api.softwarevala.com/webhooks/github','https://api.github.com','{deployments.read,audit.write}',0,false,'available',164,4.60),
('hubspot-crm','HubSpot CRM','HubSpot','crm','Syncs resellers and franchise accounts with CRM contacts and deals.','v3','https://developers.hubspot.com/docs/api/overview',NULL,'https://api.hubapi.com','{customers.read,customers.write}',45.00,false,'available',92,4.20),
('aws-s3-storage','AWS S3 Storage','Amazon Web Services','storage','Archives request logs, invoices and export bundles to object storage.','2006-03-01','https://docs.aws.amazon.com/AmazonS3/latest/API/','https://api.softwarevala.com/webhooks/s3','https://s3.amazonaws.com','{storage.read,storage.write,audit.read}',12.00,false,'installed',233,4.30),
('cloudflare-waf','Cloudflare WAF','Cloudflare','security','IP and region restriction sync plus abuse-rule enforcement at the edge.','v4','https://developers.cloudflare.com/api/',NULL,'https://api.cloudflare.com/client/v4','{security.read,security.write}',20.00,false,'available',119,4.70),
('zapier-workflows','Zapier Workflows','Zapier','automation','No-code automations triggered by console events and thresholds.','v1','https://docs.zapier.com/platform/home','https://hooks.zapier.com/hooks/catch/softwarevala','https://api.zapier.com/v1','{automation.read,automation.write}',19.00,false,'disabled',77,4.00);

INSERT INTO public.extension_installs (extension_id, product, environment, status, health, granted_scopes, config, monthly_cost_usd, last_sync_at)
SELECT e.id, v.product, v.env, v.status, v.health, e.scopes, v.config::jsonb, v.cost, now() - (v.mins || ' minutes')::interval
FROM (VALUES
  ('stripe-payments','Billing Engine','production','active','healthy','{"currency":"USD","capture":"automatic"}',0.00,7),
  ('razorpay-upi','Wallet System','production','active','healthy','{"currency":"INR","mode":"collect"}',0.00,12),
  ('twilio-messaging','Notification Hub','production','active','degraded','{"sender":"SOFTVL","region":"in1"}',0.00,41),
  ('slack-alerts','Alert & Safety','production','active','healthy','{"channel":"#api-alerts"}',0.00,3),
  ('sentry-errors','Console','production','active','healthy','{"environment":"production","sample_rate":0.4}',26.00,9),
  ('aws-s3-storage','Audit & Logs','production','active','healthy','{"bucket":"softwarevala-audit","region":"ap-south-1"}',12.00,55),
  ('stripe-payments','Billing Engine','staging','paused','healthy','{"currency":"USD","capture":"manual"}',0.00,1440)
) AS v(slug, product, env, status, health, config, cost, mins)
JOIN public.extensions e ON e.slug = v.slug;

INSERT INTO public.extension_events (extension_id, install_id, event_type, status, message, latency_ms, occurred_at)
SELECT i.extension_id, i.id, v.event_type, v.status, v.message, v.latency, now() - (v.mins || ' minutes')::interval
FROM (VALUES
  ('stripe-payments','webhook.received','success','payment_intent.succeeded processed and posted to invoice ledger',214,6),
  ('stripe-payments','sync.completed','success','Reconciled 128 charges for the current billing cycle',1830,62),
  ('razorpay-upi','webhook.received','success','UPI collect mandate confirmed, wallet credited',167,11),
  ('twilio-messaging','delivery.failed','error','SMS delivery failed for 3 recipients: carrier rejected sender id',402,40),
  ('twilio-messaging','sync.completed','warning','Usage sync completed with 3 retried deliveries',2510,38),
  ('slack-alerts','notification.sent','success','Cost spike alert delivered to #api-alerts',121,3),
  ('sentry-errors','webhook.received','success','2 new runtime issues ingested into error monitoring',188,9),
  ('aws-s3-storage','archive.completed','success','Archived 41,208 request log rows to softwarevala-audit',5240,54),
  ('aws-s3-storage','permission.granted','success','Scope storage.write granted by console@softwarevala.com',0,1500)
) AS v(slug, event_type, status, message, latency, mins)
JOIN public.extensions e ON e.slug = v.slug
JOIN public.extension_installs i ON i.extension_id = e.id AND i.environment = 'production';

UPDATE public.extensions e SET install_count = e.install_count
WHERE false;