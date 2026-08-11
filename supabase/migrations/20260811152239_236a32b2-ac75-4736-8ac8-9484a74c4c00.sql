ALTER TABLE public.extensions
  ADD COLUMN IF NOT EXISTS publisher_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS publisher_url text,
  ADD COLUMN IF NOT EXISTS support_url text,
  ADD COLUMN IF NOT EXISTS license text NOT NULL DEFAULT 'Commercial',
  ADD COLUMN IF NOT EXISTS latest_version text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS min_platform_version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS dependencies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS compatibility text NOT NULL DEFAULT 'compatible';

UPDATE public.extensions SET latest_version = version WHERE latest_version = '';

UPDATE public.extensions SET
  publisher_url = 'https://stripe.com',
  publisher_email = 'support@stripe.com',
  support_url = 'https://support.stripe.com',
  license = 'Commercial',
  latest_version = '2025-03-31',
  min_platform_version = '1.4.0',
  dependencies = ARRAY['wallet-core','billing-engine'],
  tags = ARRAY['payments','cards','invoicing','pci'],
  compatibility = 'update-available'
WHERE slug = 'stripe-payments';

UPDATE public.extensions SET
  publisher_url = 'https://razorpay.com',
  publisher_email = 'support@razorpay.com',
  support_url = 'https://razorpay.com/support/',
  license = 'Commercial',
  latest_version = '1.9.0',
  min_platform_version = '1.4.0',
  dependencies = ARRAY['wallet-core'],
  tags = ARRAY['payments','upi','india'],
  compatibility = 'update-available'
WHERE slug = 'razorpay-upi';

UPDATE public.extensions SET
  publisher_url = 'https://www.twilio.com',
  publisher_email = 'help@twilio.com',
  support_url = 'https://support.twilio.com',
  license = 'Commercial',
  latest_version = '2010-04-01',
  min_platform_version = '1.2.0',
  dependencies = ARRAY['messaging-gateway'],
  tags = ARRAY['sms','voice','whatsapp'],
  compatibility = 'compatible'
WHERE slug = 'twilio-messaging';

UPDATE public.extensions SET
  publisher_url = 'https://sendgrid.com',
  publisher_email = 'support@sendgrid.com',
  support_url = 'https://support.sendgrid.com',
  license = 'Commercial',
  latest_version = '3.0.0',
  min_platform_version = '1.2.0',
  dependencies = ARRAY['messaging-gateway'],
  tags = ARRAY['email','transactional'],
  compatibility = 'compatible'
WHERE slug = 'sendgrid-email';

UPDATE public.extensions SET
  publisher_url = 'https://slack.com',
  publisher_email = 'feedback@slack.com',
  support_url = 'https://slack.com/help',
  license = 'Commercial',
  latest_version = '2.0',
  min_platform_version = '1.0.0',
  dependencies = ARRAY['alert-engine'],
  tags = ARRAY['alerts','chatops'],
  compatibility = 'compatible'
WHERE slug = 'slack-alerts';

UPDATE public.extensions SET
  publisher_url = 'https://sentry.io',
  publisher_email = 'support@sentry.io',
  support_url = 'https://sentry.io/support/',
  license = 'BSL-1.1',
  latest_version = '9.0.0',
  min_platform_version = '1.3.0',
  dependencies = ARRAY['error-monitor'],
  tags = ARRAY['errors','observability'],
  compatibility = 'update-available'
WHERE slug = 'sentry-errors';

UPDATE public.extensions SET
  publisher_url = 'https://www.datadoghq.com',
  publisher_email = 'support@datadoghq.com',
  support_url = 'https://www.datadoghq.com/support/',
  license = 'Commercial',
  latest_version = 'v2',
  min_platform_version = '1.3.0',
  dependencies = ARRAY['metrics-collector'],
  tags = ARRAY['apm','metrics','tracing'],
  compatibility = 'update-available'
WHERE slug = 'datadog-apm';

UPDATE public.extensions SET
  publisher_url = 'https://www.cloudflare.com',
  publisher_email = 'support@cloudflare.com',
  support_url = 'https://support.cloudflare.com',
  license = 'Commercial',
  latest_version = 'v4',
  min_platform_version = '1.1.0',
  dependencies = ARRAY['gateway-core'],
  tags = ARRAY['waf','ddos','security'],
  compatibility = 'compatible'
WHERE slug = 'cloudflare-waf';

UPDATE public.extensions SET
  publisher_url = 'https://github.com',
  publisher_email = 'support@github.com',
  support_url = 'https://support.github.com',
  license = 'Commercial',
  latest_version = '2022-11-28',
  min_platform_version = '1.0.0',
  dependencies = ARRAY[]::text[],
  tags = ARRAY['ci','deployments','devops'],
  compatibility = 'compatible'
WHERE slug = 'github-deploy';

UPDATE public.extensions SET
  publisher_url = 'https://zapier.com',
  publisher_email = 'contact@zapier.com',
  support_url = 'https://help.zapier.com',
  license = 'Commercial',
  latest_version = 'v2',
  min_platform_version = '1.5.0',
  dependencies = ARRAY['automation-engine'],
  tags = ARRAY['automation','workflows'],
  compatibility = 'requires-upgrade'
WHERE slug = 'zapier-workflows';

UPDATE public.extensions SET
  publisher_url = 'https://www.hubspot.com',
  publisher_email = 'support@hubspot.com',
  support_url = 'https://help.hubspot.com',
  license = 'Commercial',
  latest_version = 'v4',
  min_platform_version = '1.4.0',
  dependencies = ARRAY['crm-sync'],
  tags = ARRAY['crm','sales'],
  compatibility = 'update-available'
WHERE slug = 'hubspot-crm';

UPDATE public.extensions SET
  publisher_url = 'https://aws.amazon.com/s3/',
  publisher_email = 'aws-support@amazon.com',
  support_url = 'https://aws.amazon.com/contact-us/',
  license = 'Commercial',
  latest_version = '2006-03-01',
  min_platform_version = '1.0.0',
  dependencies = ARRAY['storage-core'],
  tags = ARRAY['storage','s3','files'],
  compatibility = 'compatible'
WHERE slug = 'aws-s3-storage';

CREATE TABLE IF NOT EXISTS public.extension_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id uuid NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  version text NOT NULL,
  channel text NOT NULL DEFAULT 'stable',
  released_at timestamptz NOT NULL DEFAULT now(),
  notes_url text,
  is_security_update boolean NOT NULL DEFAULT false,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (extension_id, version)
);

GRANT SELECT ON public.extension_versions TO authenticated;
GRANT ALL ON public.extension_versions TO service_role;
ALTER TABLE public.extension_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read extension versions"
ON public.extension_versions FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_extension_versions_updated_at
BEFORE UPDATE ON public.extension_versions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.extension_versions (extension_id, version, channel, released_at, notes_url, is_security_update, is_current)
SELECT e.id, e.version, 'stable', e.created_at, e.docs_url, false, true FROM public.extensions e
ON CONFLICT (extension_id, version) DO NOTHING;

INSERT INTO public.extension_versions (extension_id, version, channel, released_at, notes_url, is_security_update, is_current)
SELECT e.id, e.latest_version, 'stable', now() - interval '21 days', e.docs_url,
       e.slug IN ('sentry-errors','stripe-payments'), false
FROM public.extensions e
WHERE e.latest_version <> e.version
ON CONFLICT (extension_id, version) DO NOTHING;