-- 006_invites.sql — registro por convite (Story 3.1, FR3/FR9): piloto fechado;
-- link único por experimento; convite inválido/expirado/esgotado → recusa.
-- Esgoto e validação são atômicos no próprio UPDATE (guard em max_uses/validade).

CREATE TABLE IF NOT EXISTS experiment_invites (
  token       text PRIMARY KEY,
  doc_version uuid NOT NULL REFERENCES experiment_docs(doc_version),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,               -- NULL = sem prazo
  max_uses    integer,                   -- NULL = ilimitado
  uses        integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS experiment_invites_doc_idx ON experiment_invites (doc_version);
