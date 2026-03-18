-- ============================================================
-- Migration 004: Criar usuário admin espindolanogueira
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Inserir usuário admin (ou atualizar se já existir)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'espindolanogueira@yahoo.com.br',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO UPDATE
  SET
    raw_user_meta_data = '{"role": "admin"}',
    encrypted_password  = crypt('123456', gen_salt('bf')),
    email_confirmed_at  = COALESCE(auth.users.email_confirmed_at, now()),
    updated_at          = now();

-- Garantir que o app.admin_email do banco também reconheça este email
-- (complementa o check por user_metadata.role = 'admin' já feito pelo middleware)
