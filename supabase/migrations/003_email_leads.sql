-- =============================================
-- Migration 003: Email System + Lead Management
-- =============================================

-- Helper: check admin (same pattern as 001)
-- Assumes is_admin() function already exists from migration 001

-- =============================================
-- TABLE: leads
-- =============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interested_package TEXT CHECK (interested_package IN ('start_plus', 'pro_plus', 'vip_plus')),
  source TEXT NOT NULL DEFAULT 'site' CHECK (source IN ('site', 'instagram', 'whatsapp', 'referral', 'google', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'nurturing', 'hot', 'converted', 'lost')),
  notes TEXT,
  converted_process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  lead_score INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX leads_email_unique ON public.leads (LOWER(email));

-- =============================================
-- TABLE: email_templates
-- =============================================
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'status_update', 'lead_nurturing', 'admin_notification', 'lead_magnet')),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}',
  trigger_status TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  send_delay_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLE: email_logs
-- =============================================
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  template_key TEXT,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLE: lead_email_queue
-- =============================================
CREATE TABLE public.lead_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  template_key TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled'))
);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_admin_all" ON public.leads FOR ALL USING (is_admin());

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_admin_all" ON public.email_templates FOR ALL USING (is_admin());
CREATE POLICY "email_templates_public_read" ON public.email_templates FOR SELECT USING (is_active = true);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_admin_all" ON public.email_logs FOR ALL USING (is_admin());

ALTER TABLE public.lead_email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_email_queue_admin_all" ON public.lead_email_queue FOR ALL USING (is_admin());

-- =============================================
-- updated_at triggers
-- =============================================
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- SEED: email_templates
-- 20 templates prontos para uso
-- =============================================
INSERT INTO public.email_templates (key, name, category, subject, body_html, body_text, variables, trigger_status, send_delay_hours) VALUES

-- TRANSACIONAL: Boas-vindas
('welcome', 'Boas-vindas ao cliente', 'transactional',
'Bem-vindo à Cia do Visto, {{nome}}! 🎉',
'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bem-vindo à Cia do Visto</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:40px;text-align:center"><img src="{{app_url}}/logo.png" alt="Cia do Visto" width="50" style="border-radius:10px;margin-bottom:16px"><h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">Bem-vindo à Cia do Visto!</h1><p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:16px">Seu processo de visto americano começa agora.</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>! 👋</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Estamos muito felizes em ter você como nosso cliente. Nossa equipe vai acompanhar cada passo do seu processo de visto americano até a aprovação.</p><h3 style="color:#1e293b;margin:0 0 16px">Seus próximos passos:</h3><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background:#EFF6FF;border-radius:10px;margin-bottom:8px;border-left:4px solid #1D4ED8"><p style="margin:0;color:#1e293b;font-weight:600">1. Preencha o formulário DS-160</p><p style="margin:4px 0 0;color:#64748b;font-size:14px">Acesse seu painel e preencha os dados do solicitante</p></td></tr></table><br><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background:#F0FDF4;border-radius:10px;margin-bottom:8px;border-left:4px solid #22C55E"><p style="margin:0;color:#1e293b;font-weight:600">2. Aguarde nossa análise</p><p style="margin:4px 0 0;color:#64748b;font-size:14px">Nossa equipe revisará seus dados em até 48h</p></td></tr></table><br><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Acessar meu painel →</a></div><hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"><p style="color:#94a3b8;font-size:14px;text-align:center;margin:0">Dúvidas? Fale conosco pelo WhatsApp: <a href="https://wa.me/{{whatsapp_number}}" style="color:#1D4ED8">{{whatsapp_number}}</a></p></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos<br>© 2025 Todos os direitos reservados</p></td></tr></table></td></tr></table></body></html>',
'Bem-vindo à Cia do Visto, {{nome}}! Acesse seu painel em: {{dashboard_url}}. Dúvidas? WhatsApp: {{whatsapp_number}}',
ARRAY['{{nome}}', '{{dashboard_url}}', '{{app_url}}', '{{whatsapp_number}}'],
'pending_form', 0),

-- TRANSACIONAL: Pagamento confirmado
('payment_confirmed', 'Pagamento confirmado', 'transactional',
'Pagamento confirmado! Seu processo foi criado ✅',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pagamento Confirmado</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#16a34a;padding:40px;text-align:center"><div style="background:rgba(255,255,255,0.2);width:64px;height:64px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px">✅</div><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Pagamento Confirmado!</h1><p style="color:rgba(255,255,255,0.85);margin:12px 0 0">Seu processo foi criado com sucesso.</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 8px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Recebemos seu pagamento de <strong>R$ {{valor}}</strong> e seu processo já está ativo em nosso sistema. Nossa equipe foi notificada e iniciará o acompanhamento imediatamente.</p><table width="100%" cellpadding="16" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0"><tr><td><p style="margin:0 0 4px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Resumo do pedido</p><p style="margin:0;color:#1e293b;font-size:16px;font-weight:700">Plano {{plano}} — R$ {{valor}}</p><p style="margin:4px 0 0;color:#64748b;font-size:14px">ID do processo: #{{process_id}}</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Ver meu processo →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Pagamento de R$ {{valor}} confirmado! Processo #{{process_id}} criado. Acesse: {{dashboard_url}}',
ARRAY['{{nome}}', '{{valor}}', '{{plano}}', '{{process_id}}', '{{dashboard_url}}'],
NULL, 0),

-- STATUS: Formulário preenchido
('status_form_completed', 'Formulário DS-160 recebido', 'status_update',
'Formulário recebido! Próximo passo: Taxa Consular 📋',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Formulário Recebido</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">📋 Formulário Recebido!</h1><p style="color:rgba(255,255,255,0.85);margin:12px 0 0">Sua solicitação está em análise.</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Recebemos e verificamos seu formulário DS-160. Tudo certo! O próximo passo é o pagamento da Taxa Consular.</p><table width="100%" style="border-collapse:collapse"><tr><td style="padding:16px;background:#EFF6FF;border-radius:10px;border-left:4px solid #1D4ED8"><p style="margin:0;font-weight:600;color:#1e293b">💰 Próximo passo: Pagar a Taxa Consular</p><p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">A taxa consular é um valor cobrado pelo governo americano (US$ 185/pessoa) e deve ser paga separadamente. Nossa equipe te enviará as instruções em breve.</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Ver status do processo →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Formulário recebido! Próximo passo: pagar a Taxa Consular. Acesse: {{dashboard_url}}',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'form_completed', 0),

-- STATUS: Taxa consular paga
('status_consular_fee_paid', 'Taxa consular confirmada', 'status_update',
'Taxa Consular paga com sucesso! Solicitando agendamento 📅',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Taxa Consular Paga</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#059669,#10B981);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">✅ Taxa Consular Confirmada!</h1></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Ótimo, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">O pagamento da taxa consular foi confirmado. Agora vamos solicitar as datas de entrevista no CASV e no Consulado. Aguarde — te avisaremos assim que o agendamento for confirmado.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700">Acompanhar processo →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Taxa consular confirmada! Solicitaremos as datas de agendamento em breve. Acompanhe: {{dashboard_url}}',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'consular_fee_paid', 0),

-- STATUS: Agendamento solicitado
('status_appointment_requested', 'Agendamento solicitado', 'status_update',
'Agendamento solicitado! Aguardando confirmação 🗓️',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agendamento Solicitado</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#7C3AED,#8B5CF6);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">🗓️ Agendamento Solicitado!</h1></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Ótimas notícias, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Solicitamos os agendamentos para entrevista no CASV e Consulado. Assim que as datas forem confirmadas pelo sistema, você receberá um novo email com todos os detalhes.</p><table width="100%" style="border-collapse:collapse"><tr><td style="padding:16px;background:#F5F3FF;border-radius:10px;border-left:4px solid #7C3AED"><p style="margin:0;font-weight:600;color:#1e293b">📝 O que você deve fazer agora?</p><ul style="margin:8px 0 0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8"><li>Aguardar a confirmação das datas (pode levar alguns dias)</li><li>Verificar se seu passaporte está válido</li><li>Separar documentos originais conforme lista enviada</li></ul></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700">Ver status →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Agendamento solicitado! Aguarde a confirmação das datas. Acompanhe: {{dashboard_url}}',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'appointment_requested', 0),

-- STATUS: Documentos em preparação
('status_docs_in_preparation', 'Documentos em preparação', 'status_update',
'Seus documentos estão sendo preparados 📂',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Documentos em Preparação</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">📂 Documentos em Preparação</h1></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Nossa equipe está finalizando a preparação de todos os seus documentos. Em breve eles estarão disponíveis para download no seu painel.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700">Verificar status →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Seus documentos estão sendo preparados. Em breve disponíveis em: {{dashboard_url}}',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'docs_in_preparation', 0),

-- STATUS: Documentos prontos
('status_docs_ready', 'Documentos prontos para download', 'status_update',
'Seus documentos estão prontos! Faça o download agora 📄',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Documentos Prontos</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0891B2,#06B6D4);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">📄 Documentos Prontos!</h1><p style="color:rgba(255,255,255,0.85);margin:12px 0 0">Faça o download e leve para a entrevista.</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Excelente, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Seus documentos estão prontos e disponíveis para download no painel. Baixe-os e organize uma pasta para levar no dia da entrevista.</p><div style="text-align:center;margin:32px 0"><a href="{{dashboard_url}}/documentos" style="display:inline-block;background:#0891B2;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">📥 Baixar documentos →</a></div><table width="100%" style="border-collapse:collapse"><tr><td style="padding:16px;background:#ECFEFF;border-radius:10px;border-left:4px solid #06B6D4"><p style="margin:0;font-weight:600;color:#1e293b">⚠️ Importante na entrevista:</p><ul style="margin:8px 0 0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8"><li>Leve todos os documentos impressos</li><li>Chegue com pelo menos 30 minutos de antecedência</li><li>Não leve celular ou eletrônicos para o interior do consulado</li></ul></td></tr></table></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Documentos prontos! Acesse: {{dashboard_url}}/documentos. Lembre de imprimir tudo para a entrevista.',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'docs_ready', 0),

-- STATUS: Processo concluído
('status_completed', 'Processo concluído — Parabéns!', 'status_update',
'🎉 Processo concluído! Boa sorte na entrevista!',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Processo Concluído</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#7C3AED);padding:48px 40px;text-align:center"><p style="font-size:64px;margin:0 0 16px">🎉</p><h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">Processo Concluído!</h1><p style="color:rgba(255,255,255,0.85);margin:12px 0 0;font-size:16px">Você está pronto para conquistar seu visto!</p></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Parabéns, <strong>{{nome}}</strong>! 🎊</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Nossa equipe finalizou todos os trâmites do seu processo. Agora é só ir para a entrevista com toda a documentação e confiança. Você está preparado!</p><table width="100%" style="border-collapse:collapse"><tr><td style="padding:20px;background:linear-gradient(135deg,#EFF6FF,#F5F3FF);border-radius:12px;text-align:center"><p style="margin:0;font-size:20px;font-weight:700;color:#1D4ED8">Vai arrasar na entrevista! 💪</p><p style="margin:8px 0 0;color:#475569;font-size:14px">Nossa equipe torce por você.</p></td></tr></table><hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"><p style="color:#475569;font-size:14px;text-align:center;margin:0">Se precisar de ajuda ou indicação, conte conosco sempre.<br>Compartilhe sua experiência e ajude outros brasileiros! ⭐</p></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos</p></td></tr></table></td></tr></table></body></html>',
'Processo concluído! Boa sorte na entrevista, {{nome}}! Foi um prazer te assessorar.',
ARRAY['{{nome}}', '{{dashboard_url}}'],
'completed', 0),

-- LEAD NURTURING: D+0
('lead_d0_welcome', 'Lead — Boas-vindas imediato', 'lead_nurturing',
'Obrigado pelo interesse, {{nome}}! 🇺🇸',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Obrigado pelo interesse</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:40px;text-align:center"><p style="font-size:48px;margin:0 0 16px">🇺🇸</p><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Seu sonho americano começa aqui!</h1></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 16px">Obrigado por entrar em contato com a Cia do Visto. Nossa equipe de especialistas em vistos americanos vai te ajudar em cada etapa do processo.</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Enquanto isso, separamos algumas informações úteis sobre o visto americano:</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px;background:#EFF6FF;border-radius:10px;margin-bottom:8px"><p style="margin:0;font-weight:600;color:#1e293b">📋 Taxa de aprovação</p><p style="margin:4px 0 0;color:#475569;font-size:14px">Clientes com assessoria têm taxa de aprovação até 3x maior que candidatos sem ajuda.</p></td></tr></table><br><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px;background:#F0FDF4;border-radius:10px"><p style="margin:0;font-weight:600;color:#1e293b">⏱️ Prazo médio</p><p style="margin:4px 0 0;color:#475569;font-size:14px">O processo completo leva em média 3 a 6 semanas da contratação até a entrevista.</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{checkout_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Começar meu processo →</a></div><p style="color:#64748b;font-size:14px;text-align:center;margin:0">Dúvidas? Responda este email ou fale pelo WhatsApp: <a href="https://wa.me/{{whatsapp_number}}" style="color:#1D4ED8">Clique aqui</a></p></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — Assessoria em Vistos Americanos<br><a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Obrigado pelo interesse, {{nome}}! Sua assessoria de visto americano começa aqui. Acesse: {{checkout_url}}',
ARRAY['{{nome}}', '{{checkout_url}}', '{{whatsapp_number}}', '{{unsubscribe_url}}'],
NULL, 0),

-- LEAD NURTURING: D+3
('lead_d3_followup', 'Lead — D+3 Casos de sucesso', 'lead_nurturing',
'{{nome}}, veja quem já realizou o sonho americano com a gente 🌟',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Casos de sucesso</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">🌟 Resultados reais de clientes reais</h1></td></tr><tr><td style="padding:40px"><p style="font-size:18px;color:#1e293b;margin:0 0 24px">Olá, <strong>{{nome}}</strong>!</p><table width="100%" style="border-collapse:collapse;margin-bottom:16px"><tr><td style="padding:20px;background:#f8fafc;border-radius:12px;border-left:4px solid #1D4ED8"><p style="margin:0 0 8px;color:#1e293b;font-style:italic;line-height:1.6">"Aprovei no visto em 3 semanas! A equipe me guiou em cada detalhe do formulário DS-160 e fiz a entrevista sem nenhuma surpresa."</p><p style="margin:0;color:#64748b;font-size:14px;font-weight:600">— Maria S., São Paulo</p></td></tr></table><table width="100%" style="border-collapse:collapse;margin-bottom:16px"><tr><td style="padding:20px;background:#f8fafc;border-radius:12px;border-left:4px solid #7C3AED"><p style="margin:0 0 8px;color:#1e293b;font-style:italic;line-height:1.6">"Já havia tentado antes sem assessoria e negado. Com a Cia do Visto, aprovei em 2 semanas. Vale muito o investimento!"</p><p style="margin:0;color:#64748b;font-size:14px;font-weight:600">— Carlos M., Belo Horizonte</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{checkout_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Quero meu visto também →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Veja casos de sucesso de clientes que aprovaram o visto americano com a Cia do Visto.',
ARRAY['{{nome}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 72),

-- LEAD NURTURING: D+7
('lead_d7_value', 'Lead — D+7 Valor da assessoria', 'lead_nurturing',
'Por que 87% dos nossos clientes aprovam no primeiro visto? 🎯',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Por que a assessoria funciona</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#059669,#10B981);padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">87% de taxa de aprovação 🎯</h1><p style="color:rgba(255,255,255,0.9);margin:12px 0 0">Descubra por que a assessoria faz toda a diferença.</p></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#1e293b;margin:0 0 24px">Olá, <strong>{{nome}}</strong>! Muita gente nos pergunta: "por que contratar assessoria se posso fazer sozinho?"</p><p style="color:#475569;line-height:1.7;margin:0 0 24px"><strong>A resposta está nos números:</strong></p><table width="100%" style="border-collapse:collapse"><tr><td width="50%" style="padding:16px;background:#EFF6FF;border-radius:10px;text-align:center;vertical-align:top"><p style="font-size:36px;font-weight:800;color:#1D4ED8;margin:0">87%</p><p style="color:#475569;font-size:14px;margin:4px 0 0">Taxa de aprovação<br>com assessoria</p></td><td width="4%"></td><td width="46%" style="padding:16px;background:#FEF2F2;border-radius:10px;text-align:center;vertical-align:top"><p style="font-size:36px;font-weight:800;color:#EF4444;margin:0">42%</p><p style="color:#475569;font-size:14px;margin:4px 0 0">Taxa de aprovação<br>sem assessoria</p></td></tr></table><br><p style="color:#475569;line-height:1.7;margin:0 0 24px">Os erros mais comuns que levam à negativa: DS-160 preenchido incorretamente, documentação incompleta, e falta de preparação para a entrevista. Nós eliminamos todos esses riscos.</p><div style="text-align:center;margin:32px 0"><a href="{{checkout_url}}" style="display:inline-block;background:#059669;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Garantir minha aprovação →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'87% dos nossos clientes aprovam no primeiro visto. Descubra por que a assessoria faz a diferença.',
ARRAY['{{nome}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 168),

-- LEAD NURTURING: D+14 (urgência / deadline funnel)
('lead_d14_urgency', 'Lead — D+14 Urgência / Vagas limitadas', 'lead_nurturing',
'⚠️ {{nome}}, apenas {{vagas}} vagas disponíveis este mês',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vagas limitadas</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:40px;text-align:center"><p style="font-size:40px;margin:0 0 12px">⚠️</p><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Vagas limitadas este mês!</h1><p style="color:rgba(255,255,255,0.9);margin:12px 0 0;font-size:16px">Apenas <strong>{{vagas}} vagas</strong> restantes para novos clientes.</p></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 16px">Nossa equipe atende um número limitado de clientes por mês para garantir a qualidade de cada processo. Este mês estamos quase no limite.</p><table width="100%" style="border-collapse:collapse;margin-bottom:24px"><tr><td style="padding:20px;background:#FEF2F2;border-radius:12px;text-align:center;border:2px solid #FCA5A5"><p style="margin:0;font-size:24px;font-weight:800;color:#DC2626">{{vagas}} vagas restantes</p><p style="margin:8px 0 0;color:#64748b;font-size:14px">Válido até {{deadline_date}}</p></td></tr></table><p style="color:#475569;line-height:1.7;margin:0 0 24px">Se você ainda não garantiu sua vaga, agora é o momento. Use o cupom abaixo para <strong>10% de desconto</strong>:</p><table width="100%" style="border-collapse:collapse;margin-bottom:24px"><tr><td style="padding:16px;background:#EFF6FF;border-radius:10px;text-align:center;border:2px dashed #93C5FD"><p style="margin:0;font-size:22px;font-weight:800;color:#1D4ED8;letter-spacing:2px">{{coupon_code}}</p><p style="margin:4px 0 0;color:#64748b;font-size:13px">10% de desconto — válido por 48h</p></td></tr></table><div style="text-align:center;margin:24px 0"><a href="{{checkout_url}}?cupom={{coupon_code}}" style="display:inline-block;background:#DC2626;color:#fff;padding:18px 48px;border-radius:12px;text-decoration:none;font-weight:700;font-size:18px">Garantir minha vaga agora →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Apenas {{vagas}} vagas este mês! Use o cupom {{coupon_code}} para 10% de desconto. Válido 48h.',
ARRAY['{{nome}}', '{{vagas}}', '{{deadline_date}}', '{{coupon_code}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 336),

-- LEAD NURTURING: D+21 (última chance)
('lead_d21_lastchance', 'Lead — D+21 Última chance', 'lead_nurturing',
'{{nome}}, última chance com desconto especial 🔔',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Última chance</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#92400E,#D97706);padding:40px;text-align:center"><p style="font-size:40px;margin:0 0 12px">🔔</p><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Última Chance com Desconto</h1></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Percebemos que você ainda não garantiu seu processo de visto. Queremos muito te ajudar, então preparamos uma condição especial que expira em <strong>24 horas</strong>.</p><table width="100%" style="border-collapse:collapse;margin-bottom:24px"><tr><td style="padding:20px;background:#FFFBEB;border-radius:12px;border:2px solid #FCD34D"><p style="margin:0;font-size:20px;font-weight:700;color:#92400E;text-align:center">15% de desconto + 1ª consulta grátis</p><p style="margin:8px 0 0;color:#64748b;font-size:14px;text-align:center">Cupom: <strong style="font-size:18px;letter-spacing:1px;color:#D97706">{{coupon_code}}</strong></p></td></tr></table><div style="text-align:center;margin:24px 0"><a href="{{checkout_url}}?cupom={{coupon_code}}" style="display:inline-block;background:#D97706;color:#fff;padding:18px 48px;border-radius:12px;text-decoration:none;font-weight:700;font-size:18px">Aproveitar desconto agora →</a></div><p style="color:#64748b;font-size:14px;text-align:center;margin:0">Após esse prazo, não podemos garantir disponibilidade.</p></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Última chance: 15% desconto + consulta grátis. Cupom: {{coupon_code}}. Válido 24h.',
ARRAY['{{nome}}', '{{coupon_code}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 504),

-- LEAD NURTURING: D+30 (re-engajamento)
('lead_d30_reengagement', 'Lead — D+30 Re-engajamento', 'lead_nurturing',
'{{nome}}, ainda quer tirar seu visto americano? 🤔',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ainda quer o visto?</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#334155;padding:40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Ainda quer o visto americano?</h1><p style="color:#94a3b8;margin:12px 0 0">Estamos aqui quando você estiver pronto.</p></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#1e293b;margin:0 0 16px">Olá, <strong>{{nome}}</strong>!</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Faz um tempo desde seu primeiro contato conosco. Queremos saber se ainda podemos te ajudar a realizar o sonho de visitar os Estados Unidos.</p><p style="color:#475569;line-height:1.7;margin:0 0 24px">Se mudou de planos, tudo bem — só responda "não tenho interesse" e não te incomodaremos mais. Mas se ainda quer o visto, que tal começarmos hoje?</p><div style="text-align:center;margin:32px 0"><a href="{{checkout_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;margin-right:8px">Sim, quero começar!</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Ainda quer o visto americano? Estamos prontos para te ajudar. Acesse: {{checkout_url}}',
ARRAY['{{nome}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 720),

-- LEAD MAGNET: Checklist
('lead_magnet_checklist', 'Lead magnet — Checklist de documentos', 'lead_magnet',
'Seu checklist gratuito de documentos para visto americano 📋',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Checklist Documentos</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:40px;text-align:center"><p style="font-size:48px;margin:0 0 12px">📋</p><h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">Checklist Completo de Documentos</h1><p style="color:rgba(255,255,255,0.9);margin:12px 0 0">Tudo que você precisa para a entrevista de visto americano</p></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#1e293b;margin:0 0 24px">Olá, <strong>{{nome}}</strong>! Aqui está o checklist completo:</p><table width="100%" style="border-collapse:collapse"><tr><td style="padding:12px 0;border-bottom:1px solid #e2e8f0"><p style="margin:0;color:#1e293b;font-weight:600">📄 Documentos Pessoais</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ Passaporte válido (mín. 6 meses após viagem)</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ Passaporte anterior (se houver)</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ RG e CPF</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ Certidão de nascimento/casamento</p></td></tr><tr><td style="padding:12px 0 12px 0;border-bottom:1px solid #e2e8f0"><p style="margin:0;color:#1e293b;font-weight:600">💼 Documentos Profissionais</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ Carteira de trabalho</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ 3 últimos holerites</p></td></tr><tr><td style="padding:8px 0 8px 16px;border-bottom:1px solid #f1f5f9"><p style="margin:0;color:#475569">☐ Declaração de imposto de renda</p></td></tr><tr><td style="padding:12px 0 12px 0"><p style="margin:0;color:#1e293b;font-weight:600">💰 Documentos Financeiros</p></td></tr><tr><td style="padding:8px 0 8px 16px"><p style="margin:0;color:#475569">☐ Extrato bancário dos últimos 3 meses</p></td></tr><tr><td style="padding:8px 0 8px 16px"><p style="margin:0;color:#475569">☐ Comprovante de renda</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{checkout_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700">Iniciar meu processo →</a></div></td></tr><tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:13px;margin:0">Cia do Visto — <a href="{{unsubscribe_url}}" style="color:#94a3b8">Cancelar inscrição</a></p></td></tr></table></td></tr></table></body></html>',
'Checklist de documentos para visto americano: passaporte, RG, holerites, extrato bancário e mais.',
ARRAY['{{nome}}', '{{checkout_url}}', '{{unsubscribe_url}}'],
NULL, 0),

-- ADMIN NOTIFICATION: Novo lead
('admin_new_lead', 'Admin — Novo lead capturado', 'admin_notification',
'[LEAD] Novo lead: {{nome}} — {{email}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Novo Lead</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#1e293b;padding:32px 40px"><h2 style="color:#fff;margin:0;font-size:20px">🔔 Novo Lead Capturado</h2></td></tr><tr><td style="padding:32px 40px"><table width="100%" style="border-collapse:collapse"><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong style="color:#475569">Nome:</strong> <span style="color:#1e293b">{{nome}}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong style="color:#475569">Email:</strong> <a href="mailto:{{email}}" style="color:#1D4ED8">{{email}}</a></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong style="color:#475569">Telefone:</strong> <span style="color:#1e293b">{{phone}}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong style="color:#475569">Pacote de interesse:</strong> <span style="color:#1e293b">{{interested_package}}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong style="color:#475569">Fonte:</strong> <span style="color:#1e293b">{{source}}</span></td></tr><tr><td style="padding:8px 0"><strong style="color:#475569">Recebido em:</strong> <span style="color:#1e293b">{{created_at}}</span></td></tr></table><div style="text-align:center;margin:24px 0"><a href="{{admin_leads_url}}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700">Ver no painel →</a></div></td></tr></table></td></tr></table></body></html>',
'Novo lead: {{nome}} ({{email}}) — Interesse: {{interested_package}}. Ver: {{admin_leads_url}}',
ARRAY['{{nome}}', '{{email}}', '{{phone}}', '{{interested_package}}', '{{source}}', '{{created_at}}', '{{admin_leads_url}}'],
NULL, 0),

-- ADMIN NOTIFICATION: Pagamento recebido
('admin_payment_received', 'Admin — Pagamento recebido', 'admin_notification',
'[PAGAMENTO] R$ {{valor}} recebido — {{nome}}',
'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pagamento Recebido</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#16a34a;padding:32px 40px"><h2 style="color:#fff;margin:0;font-size:20px">💰 Pagamento Confirmado</h2></td></tr><tr><td style="padding:32px 40px"><table width="100%" style="border-collapse:collapse"><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong>Cliente:</strong> {{nome}} ({{email}})</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong>Valor:</strong> R$ {{valor}}</td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9"><strong>Plano:</strong> {{plano}}</td></tr><tr><td style="padding:8px 0"><strong>Processo ID:</strong> #{{process_id}}</td></tr></table><div style="text-align:center;margin:24px 0"><a href="{{admin_process_url}}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700">Ver processo →</a></div></td></tr></table></td></tr></table></body></html>',
'Pagamento de R$ {{valor}} recebido de {{nome}} ({{email}}). Processo: {{process_id}}',
ARRAY['{{nome}}', '{{email}}', '{{valor}}', '{{plano}}', '{{process_id}}', '{{admin_process_url}}'],
NULL, 0);
