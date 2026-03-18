-- ============================================================
-- CIA DO VISTO — FEATURES: CUPONS, MENSAGENS, WHATSAPP
-- ============================================================

-- Adicionar colunas de cupom em processes
ALTER TABLE public.processes
  ADD COLUMN IF NOT EXISTS coupon_id UUID,
  ADD COLUMN IF NOT EXISTS discount_applied_brl NUMERIC(10,2) DEFAULT 0;

-- ============================================================
-- TABELA: coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  influencer_name TEXT,
  influencer_email TEXT,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0 NOT NULL,
  total_revenue_generated NUMERIC(10,2) DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- FK de processes para coupons (depois da criação da tabela)
ALTER TABLE public.processes
  ADD CONSTRAINT fk_processes_coupon
  FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;

-- ============================================================
-- TABELA: coupon_uses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  original_amount_brl NUMERIC(10,2) NOT NULL,
  discount_applied_brl NUMERIC(10,2) NOT NULL,
  final_amount_brl NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: messages (chat cliente ↔ admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: whatsapp_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('status_update', 'appointment', 'sales', 'general', 'existing_client')),
  content TEXT NOT NULL,
  trigger_status TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: whatsapp_inbound (mensagens recebidas do Z-API)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone TEXT NOT NULL,
  from_name TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  z_api_data JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_inbound ENABLE ROW LEVEL SECURITY;

-- COUPONS: só admin gerencia
CREATE POLICY "coupons_select_active" ON public.coupons
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "coupons_all_admin" ON public.coupons
  FOR ALL USING (is_admin());

-- COUPON_USES: cliente vê os seus, admin vê todos
CREATE POLICY "coupon_uses_select" ON public.coupon_uses
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "coupon_uses_insert" ON public.coupon_uses
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "coupon_uses_admin_all" ON public.coupon_uses
  FOR ALL USING (is_admin());

-- MESSAGES: cliente vê as do próprio processo, admin vê todas
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- WHATSAPP_TEMPLATES: só admin
CREATE POLICY "whatsapp_templates_admin" ON public.whatsapp_templates
  FOR ALL USING (is_admin());

-- Leitura pública de templates ativos (para uso interno das APIs)
CREATE POLICY "whatsapp_templates_select_active" ON public.whatsapp_templates
  FOR SELECT USING (is_active = true OR is_admin());

-- WHATSAPP_INBOUND: só admin
CREATE POLICY "whatsapp_inbound_admin" ON public.whatsapp_inbound
  FOR ALL USING (is_admin());

-- ============================================================
-- SEED: Templates WhatsApp pré-definidos
-- ============================================================
INSERT INTO public.whatsapp_templates (name, category, trigger_status, content) VALUES
  ('Boas-vindas - Formulário pendente', 'status_update', 'pending_form',
   'Olá {{nome}}! 👋 Seja bem-vindo(a) à Cia do Visto!

Seu processo foi criado com sucesso. O próximo passo é preencher o formulário DS-160 com seus dados.

Acesse o portal: {{link}}

Qualquer dúvida, estamos aqui! 😊'),

  ('Formulário recebido', 'status_update', 'form_completed',
   'Ótima notícia, {{nome}}! ✅ Recebemos seu formulário DS-160.

Nossa consultora está revisando suas informações. Assim que concluir, você receberá uma nova mensagem.

Acompanhe o status no portal: {{link}}'),

  ('Taxa consular paga', 'status_update', 'consular_fee_paid',
   'Taxa consular confirmada, {{nome}}! ✅

Agora você já pode informar suas datas de preferência para o agendamento do CASV e Consulado.

Acesse: {{link}}'),

  ('Agendamento solicitado', 'appointment', 'appointment_requested',
   'Recebemos sua solicitação de agendamento, {{nome}}! 📅

Datas solicitadas:
• CASV: {{cidade_casv}}
• Consulado: {{cidade_consulado}}

Nossa consultora verificará a disponibilidade real e confirmará as datas em breve.

*Atenção:* As datas são uma preferência — não garantimos disponibilidade imediata.'),

  ('Documentos em preparação', 'status_update', 'docs_in_preparation',
   'Olá {{nome}}! 📋

Sua documentação está sendo preparada pela nossa equipe. Em breve você poderá baixar tudo pelo portal.

Acompanhe em: {{link}}'),

  ('Documentos prontos', 'status_update', 'docs_ready',
   'Seus documentos estão prontos, {{nome}}! 📄🎉

Acesse o portal para fazer o download de toda a documentação:
{{link}}

Boa sorte na entrevista consular! 🗽'),

  ('Processo concluído', 'status_update', 'completed',
   'Parabéns, {{nome}}! 🎉🗽

Seu processo foi concluído com sucesso! Toda a documentação foi entregue.

Acesse o portal para um resumo completo:
{{link}}

Foi um prazer te atender! Boa sorte na entrevista! 🍀'),

  ('Oferta especial', 'sales', NULL,
   'Olá! 👋 Temos uma *oferta especial* para assessoria de visto americano!

✅ Formulário DS-160 completo
✅ Preparação para a entrevista
✅ Suporte até a aprovação

Quer saber mais? Responda essa mensagem ou acesse: {{link}}'),

  ('Dúvida: Prazo do visto', 'general', NULL,
   'O prazo médio para obtenção do visto americano de turismo é de *2 a 6 semanas* após a entrevista consular.

Fatores que influenciam:
• Demanda no consulado
• Complexidade do caso
• Necessidade de documentação adicional

Ficou com dúvidas? Estamos aqui! 😊'),

  ('Dúvida: Taxa consular', 'general', NULL,
   'A taxa consular MRV para visto americano de turismo (B1/B2) é de *US$ 185 por pessoa*.

Essa taxa é cobrada separadamente da assessoria e deve ser paga antes do agendamento da entrevista.

A conversão é feita com câmbio do dia + spread. Quer calcular o valor exato? Acesse seu portal! 💰'),

  ('Atualização para clientes em processo', 'existing_client', NULL,
   'Olá {{nome}}! 👋

Passando para dar um recado sobre seu processo conosco.

{{mensagem_personalizada}}

Qualquer dúvida, é só responder aqui! 😊'),

  ('Confirmação de data - CASV e Consulado', 'appointment', NULL,
   'Olá {{nome}}! 📅 Temos uma novidade sobre seu agendamento!

*CASV (Biometria)*
📍 Cidade: {{cidade_casv}}
📆 Data: {{data_casv}}

*Consulado (Entrevista)*
📍 Cidade: {{cidade_consulado}}
📆 Data: {{data_consulado}}

Por favor, confirme o recebimento respondendo esta mensagem. 🙏')

ON CONFLICT DO NOTHING;
