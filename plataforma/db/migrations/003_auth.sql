-- 003_auth.sql — identidade, papéis, consentimento e pseudonimização (Epic 2)
-- AD-5: owner único da sessão; AD-6: mapping segregado; AD-9: gate de consentimento.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS user_accounts (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  email         citext UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'researcher', 'admin')),
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'pending_researcher', 'suspended')),
  totp_secret_enc bytea,            -- cifrado (nunca plaintext); NULL = MFA desativado
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash text PRIMARY KEY,      -- só o hash do cookie vive no banco
  user_id    uuid NOT NULL REFERENCES user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

-- Trilha de auditoria do admin (AC 2.4 / spec 03 admin_actions)
CREATE TABLE IF NOT EXISTS admin_actions (
  id             uuid PRIMARY KEY DEFAULT uuidv7(),
  admin_id       uuid NOT NULL REFERENCES user_accounts(id),
  action_type    text NOT NULL,
  target_user_id uuid REFERENCES user_accounts(id),
  detail         jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Termos de consentimento por experimento, versionados (AD-9)
CREATE TABLE IF NOT EXISTS consent_terms (
  id          uuid PRIMARY KEY DEFAULT uuidv7(),
  doc_version uuid NOT NULL REFERENCES experiment_docs(doc_version),
  version     integer NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_version, version)
);

-- Aceite registrado: (participante, termo, timestamp) — prova LGPD
CREATE TABLE IF NOT EXISTS consent_acceptances (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  term_id    uuid NOT NULL REFERENCES consent_terms(id),
  user_id    uuid NOT NULL REFERENCES user_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term_id, user_id)
);

-- Mapping pseudônimo↔usuário por experimento (AD-6): segregado por role na
-- leitura (só o módulo identity consulta); dissociação futura = destruir chave.
CREATE TABLE IF NOT EXISTS anonymized_ids (
  user_id     uuid NOT NULL REFERENCES user_accounts(id),
  doc_version uuid NOT NULL REFERENCES experiment_docs(doc_version),
  pseudonym   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, doc_version)
);

-- Sessão ganha dono humano + termo aceito (AD-5/AD-9): gate de consentimento
-- virou constraint — sessão humana sem termo aceito não existe no banco.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES user_accounts(id),
  ADD COLUMN IF NOT EXISTS consent_term_id uuid REFERENCES consent_terms(id),
  ADD COLUMN IF NOT EXISTS pseudonym text;

DO $$
BEGIN
  ALTER TABLE sessions
    ADD CONSTRAINT sessions_human_requires_consent
    CHECK (respondent = 'synthetic' OR (user_id IS NOT NULL AND consent_term_id IS NOT NULL AND pseudonym IS NOT NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL; -- já aplicada (re-entrância)
END $$;
