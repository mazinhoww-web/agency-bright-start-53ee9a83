CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write config
CREATE POLICY "system_config_admin" ON public.system_config
  FOR ALL USING (
    auth.email() = current_setting('app.admin_email', true) OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Insert default values
INSERT INTO public.system_config (key, value) VALUES
  ('price_start_plus', '299'),
  ('price_pro_plus', '599'),
  ('price_vip_plus', '999'),
  ('consular_fee_usd', '185'),
  ('markup_card', '1.10'),
  ('markup_pix', '1.15'),
  ('company_name', 'Cia do Visto'),
  ('company_email', 'contato@ciadovisto.com.br'),
  ('company_phone', ''),
  ('company_address', '')
ON CONFLICT (key) DO NOTHING;
