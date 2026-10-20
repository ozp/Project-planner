-- 009_codificacao.sql — módulo folha de codificação C2 (gabarito humano):
-- 2 codificadores cegos por token + 1 consenso; κ/ICC contra o export.
-- Tabelas NOVAS (resultados de codificação têm fase de revisão/consenso —
-- não entram no trial_results append-only, AD-4). O item guarda a âncora
-- científica (session_id + trial_seq + segment_tag) que NUNCA chega ao
-- codificador: o GET do token devolve só itemIndex/stem/responseText
-- (cegueira por desenho, §8 do plano C2).
CREATE TABLE IF NOT EXISTS coding_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  doc_escopo  text,                          -- ex.: experimento/título de origem
  modo        text NOT NULL DEFAULT 'foco' CHECK (modo IN ('foco','compacta','contínua')),
  status      text NOT NULL DEFAULT 'codificando' CHECK (status IN ('codificando','consenso','travada')),
  expires_at  timestamptz,                   -- NULL = sem prazo (padrão invite)
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3 folhas por task: 2 cegas + 1 consenso; token é o gate (padrão invite).
CREATE TABLE IF NOT EXISTS coding_sheets (
  token     text PRIMARY KEY,
  task_id   uuid NOT NULL REFERENCES coding_tasks(id) ON DELETE CASCADE,
  papel     text NOT NULL CHECK (papel IN ('cega1','cega2','consenso')),
  finalizada timestamptz,                    -- NULL = em andamento
  UNIQUE (task_id, papel)
);

-- Itens: a resposta a codificar + a re-ligação científica (admin-only).
CREATE TABLE IF NOT EXISTS coding_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid NOT NULL REFERENCES coding_tasks(id) ON DELETE CASCADE,
  item_index   integer NOT NULL,              -- ordem canônica (admin)
  session_id   text NOT NULL,                 -- re-ligação pós-consenso (ler-batch devolve)
  trial_seq    integer NOT NULL,
  segment_tag  text,                          -- grupo.domínio.registro.condição (admin-only)
  stem         text NOT NULL,
  response_text text NOT NULL,
  UNIQUE (task_id, item_index)
);

-- Respostas por folha×item; updatable até finalizar (codificação é revisável,
-- não append-only). D1–D3 1–5 (0 = sem resposta), flag não-codificável (C5).
CREATE TABLE IF NOT EXISTS coding_responses (
  sheet_token text NOT NULL REFERENCES coding_sheets(token) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES coding_items(id) ON DELETE CASCADE,
  d1 smallint NOT NULL DEFAULT 0 CHECK (d1 BETWEEN 0 AND 5),
  d2 smallint NOT NULL DEFAULT 0 CHECK (d2 BETWEEN 0 AND 5),
  d3 smallint NOT NULL DEFAULT 0 CHECK (d3 BETWEEN 0 AND 5),
  nao_codificavel boolean NOT NULL DEFAULT false,
  nota         text NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sheet_token, item_id)
);

CREATE INDEX IF NOT EXISTS coding_items_task_idx ON coding_items (task_id);
CREATE INDEX IF NOT EXISTS coding_responses_item_idx ON coding_responses (item_id);
