-- 001_sessions.sql — sessões e resultados append-only (AD-4/AD-5)
-- UUIDv7 nativo do PostgreSQL 18 como PK (convenção do spine).

CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT uuidv7(),
  doc_version   text NOT NULL,
  seed          bigint NOT NULL,
  respondent    text NOT NULL DEFAULT 'human' CHECK (respondent IN ('human', 'synthetic')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz
);

CREATE TABLE IF NOT EXISTS trial_results (
  session_id  uuid NOT NULL REFERENCES sessions(id),
  trial_seq   integer NOT NULL CHECK (trial_seq >= 0),
  payload     jsonb NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, trial_seq)
);

-- Append-only científico (AD-4): resultado gravado nunca muda nem sai.
CREATE OR REPLACE FUNCTION forbid_result_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'trial_results é append-only (AD-4)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_results_append_only ON trial_results;
CREATE TRIGGER trial_results_append_only
  BEFORE UPDATE OR DELETE ON trial_results
  FOR EACH ROW EXECUTE FUNCTION forbid_result_mutation();

-- Ingestão idempotente do batch (AD-5): uma aceitação por chave.
CREATE TABLE IF NOT EXISTS ingest_log (
  idempotency_key text PRIMARY KEY,
  session_id      uuid NOT NULL REFERENCES sessions(id),
  accepted_count  integer NOT NULL,
  accepted_at     timestamptz NOT NULL DEFAULT now()
);
