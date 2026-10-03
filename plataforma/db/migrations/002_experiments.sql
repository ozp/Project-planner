-- 002_experiments.sql — autoria por documento (AD-4/AD-9, Story 1.6):
-- documento imutável por docVersion, idempotente por conteúdo;
-- estímulos content-addressed (sha1) com ref lógica por documento.

CREATE TABLE IF NOT EXISTS experiment_docs (
  doc_version  uuid PRIMARY KEY DEFAULT uuidv7(),
  document     jsonb NOT NULL,
  content_sha1 text NOT NULL UNIQUE,   -- mesmo conteúdo = mesmo docVersion (idempotência)
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stimulus_assets (
  sha1         text PRIMARY KEY,       -- content-addressed (AD-9): o arquivo É o hash
  content_type text NOT NULL,
  size_bytes   integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiment_assets (
  doc_version  uuid NOT NULL REFERENCES experiment_docs(doc_version),
  ref          text NOT NULL,          -- ref lógica usada no documento (a1.svg, ding.wav…)
  sha1         text NOT NULL REFERENCES stimulus_assets(sha1),
  PRIMARY KEY (doc_version, ref)
);
