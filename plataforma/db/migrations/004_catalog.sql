-- 004_catalog.sql — catálogo, ownership e publicação (Stories 3.3/3.4)
-- Experimento tem dono (pesquisador que submeteu); publicação é o que o
-- torna visível/participável no catálogo (F1: por convite; F2: público).

ALTER TABLE experiment_docs
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES user_accounts(id),
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS experiment_docs_published_idx ON experiment_docs (published) WHERE published;
CREATE INDEX IF NOT EXISTS experiment_docs_owner_idx ON experiment_docs (owner_user_id);
