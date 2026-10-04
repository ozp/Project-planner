-- 005_demographics.sql — dados demográficos da sessão (jornada, passo 5).
-- Classe protegida (AD-6): vive em sessions, nunca em exports/análise.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS demographics jsonb;
