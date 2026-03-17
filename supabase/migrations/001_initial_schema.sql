-- ============================================================
-- CIA DO VISTO — SCHEMA INICIAL
-- ============================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: processes
-- ============================================================
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('start_plus', 'pro_plus', 'vip_plus')),
  max_applicants INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_form'
    CHECK (status IN (
      'pending_form', 'form_completed', 'consular_fee_paid',
      'appointment_requested', 'docs_in_preparation', 'docs_ready', 'completed'
    )),
  consulting_payment_id TEXT,
  consulting_amount_brl NUMERIC(10,2),
  consulting_paid_at TIMESTAMPTZ,
  consular_payment_id TEXT,
  consular_amount_brl NUMERIC(10,2),
  consular_usd_rate NUMERIC(8,4),
  consular_paid_at TIMESTAMPTZ,
  casv_city TEXT,
  casv_intended_date DATE,
  consulate_city TEXT,
  consulate_intended_date DATE,
  appointment_disclaimer_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: applicants
-- ============================================================
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  label TEXT NOT NULL DEFAULT 'Solicitante',
  -- Dados pessoais
  surname TEXT,
  given_name TEXT,
  other_names TEXT,
  gender TEXT CHECK (gender IN ('M', 'F', 'X')),
  marital_status TEXT,
  birth_date DATE,
  birth_city TEXT,
  birth_state TEXT,
  birth_country TEXT,
  -- Passaporte
  passport_type TEXT,
  passport_number TEXT,
  passport_country TEXT,
  passport_issue_date DATE,
  passport_expiry_date DATE,
  -- Contato
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  phone_residential TEXT,
  phone_mobile TEXT,
  email TEXT,
  -- Viagem
  travel_purpose TEXT,
  intended_arrival_date DATE,
  intended_stay_duration TEXT,
  us_address TEXT,
  trip_payer TEXT,
  -- Dados complexos em JSONB
  employment_data JSONB,
  education_data JSONB,
  family_data JSONB,
  security_questions JSONB,
  previous_us_travel JSONB,
  social_media JSONB,
  -- Foto
  photo_url TEXT,
  -- Progresso do formulário
  form_step INTEGER DEFAULT 0 NOT NULL,
  form_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: documents
-- ============================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: available_dates
-- ============================================================
CREATE TABLE public.available_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type TEXT NOT NULL CHECK (location_type IN ('casv', 'consulate')),
  city TEXT NOT NULL,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(location_type, city, date)
);

-- ============================================================
-- TABELA: whatsapp_logs
-- ============================================================
CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  to_number TEXT NOT NULL,
  message TEXT NOT NULL,
  event TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  z_api_response JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: admin_audit_log
-- ============================================================
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABELA: admin_notes
-- ============================================================
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_processes_updated_at
  BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applicants_updated_at
  BEFORE UPDATE ON public.applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Função helper: verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.email() = current_setting('app.admin_email', true) OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROCESSES: cliente vê só o próprio, admin vê tudo
CREATE POLICY "processes_select_own" ON public.processes
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "processes_insert_service" ON public.processes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "processes_update_own" ON public.processes
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- APPLICANTS: herda acesso do processo
CREATE POLICY "applicants_select" ON public.applicants
  FOR SELECT USING (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "applicants_insert" ON public.applicants
  FOR INSERT WITH CHECK (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "applicants_update" ON public.applicants
  FOR UPDATE USING (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- DOCUMENTS: cliente vê, admin gerencia
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    process_id IN (
      SELECT id FROM public.processes WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "documents_insert_admin" ON public.documents
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "documents_delete_admin" ON public.documents
  FOR DELETE USING (is_admin());

-- AVAILABLE_DATES: todos podem ver datas ativas, só admin gerencia
CREATE POLICY "available_dates_select" ON public.available_dates
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "available_dates_all_admin" ON public.available_dates
  FOR ALL USING (is_admin());

-- WHATSAPP_LOGS: só admin
CREATE POLICY "whatsapp_logs_admin" ON public.whatsapp_logs
  FOR ALL USING (is_admin());

-- AUDIT_LOG: só admin
CREATE POLICY "audit_log_admin" ON public.admin_audit_log
  FOR ALL USING (is_admin());

-- ADMIN_NOTES: só admin
CREATE POLICY "admin_notes_admin" ON public.admin_notes
  FOR ALL USING (is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('applicant-photos', 'applicant-photos', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('client-documents', 'client-documents', false, 52428800,
   ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Policies de storage
CREATE POLICY "photos_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'applicant-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "photos_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'applicant-photos' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_admin()
    )
  );

CREATE POLICY "docs_upload_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-documents' AND is_admin()
  );

CREATE POLICY "docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-documents' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      is_admin()
    )
  );
