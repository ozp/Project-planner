-- 007_synthetic_meta.sql — F5 (OZP-415): metadados do respondente sintético.
-- Sessão sintética não tem usuário nem consentimento (AD-9 é gate de sessão
-- humana); o modelo/temperatura do run vivem aqui para reprodutibilidade.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS synthetic_meta jsonb;

-- sessão humana nunca carrega meta sintética (e vice-versa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_meta_por_classe') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_meta_por_classe
      CHECK (
        (respondent = 'synthetic' AND synthetic_meta IS NOT NULL) OR
        (respondent = 'human' AND synthetic_meta IS NULL)
      );
  END IF;
END $$;
