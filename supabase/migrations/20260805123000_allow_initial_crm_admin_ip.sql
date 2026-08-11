/* Initial CRM administrator network requested for whitelist enforcement. */

INSERT INTO public.crm_ip_whitelist (ip_address, label)
VALUES ('81.16.239.187'::inet, 'Initial administrator IP')
ON CONFLICT (ip_address) DO NOTHING;
