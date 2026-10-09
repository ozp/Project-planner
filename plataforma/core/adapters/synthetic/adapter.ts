// F5.3 — Adaptador sintético (OZP-419): o contrato canônico do diálogo com
// o respondente LLM, PURO em core/ (AD-1: sem rede/DOM/SDK). O aplicador
// (story 4, estação) espelha este formato 1:1 — os goldens do teste travam
// a mensagem para os dois lados dizem a mesma coisa.
//
// Terminologia [[experimento-mts]] no código; o participante (humano ou
// modelo) vê a linguagem do documento ("símbolo do topo"/"opções").
// Decisões aprovadas pelo ozp (08/10): (a) resposta por POSIÇÃO 1|2|3;
// (b) feedback em condição com consequência = o próprio TEXTO da categoria,
// sem rótulo certo/errado; controle = silêncio; (c) multi-turno (o aplicador
// mantém a conversa); (d) resposta ilegível = tentativa perdida; (e) thinking
// OFF por padrão, estado gravado no run.

export type ContentPart =
  | { type: 'text', text: string }
  | { type: 'image_url', image_url: { url: string } }

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export interface TrialForPrompt {
  trialSeq: number
  blockName: string
  sampleUrls: string[]
  optionUrls: string[] // comparativos na ordem do plano (posições equilibradas)
  consequencia?: { acerto: string | null, erro: string | null }
}

/** Mensagem de sistema: a instrução do bloco, verbatim — nada mais (anti-vazamento). */
export function buildSessionMessages(instrucao: string): ChatMessage[] {
  return [{ role: 'system', content: instrucao }]
}

/** Mensagem de usuário da tentativa: feedback da anterior (quando houver),
 *  imagem(ns) da amostra, comparativos numerados na ordem do plano, sufixo
 *  de resposta fechada. Nunca contém a resposta correta nem rótulos. */
export function buildTrialMessage(trial: TrialForPrompt, feedback?: { correct: boolean }): ChatMessage {
  const content: ContentPart[] = []
  if (feedback && trial.consequencia) {
    const texto = feedback.correct ? trial.consequencia.acerto : trial.consequencia.erro
    if (texto) content.push({ type: 'text', text: texto })
    // controle (sem texto): silêncio — a ausência de feedback É o contraste
  }
  content.push({ type: 'text', text: 'Símbolo do topo:' })
  for (const url of trial.sampleUrls) {
    content.push({ type: 'image_url', image_url: { url } })
  }
  trial.optionUrls.forEach((url, i) => {
    content.push({ type: 'text', text: `Opção ${i + 1}:` })
    content.push({ type: 'image_url', image_url: { url } })
  })
  content.push({ type: 'text', text: `Responda apenas 1, ${trial.optionUrls.length > 2 ? '2 ou 3' : 'ou 2'}.` })
  return { role: 'user', content }
}

/** Extrai a escolha (1|2|3 nos primeiros ~15 chars da parte textual da
 *  resposta) → ref do comparativo da posição; null = ilegível (decisão d:
 *  tentativa perdida, sem re-ask e sem selectedRef inventado). */
export function parseChoice(raw: string, comparativoRefs: string[]): string | null {
  const janela = raw.slice(0, 15)
  for (const ch of janela) {
    const n = Number.parseInt(ch, 10)
    if (n >= 1 && n <= comparativoRefs.length) return comparativoRefs[n - 1]!
  }
  return null
}

export interface RunMetadata {
  modelRef: string
  provider: string
  route: 'byok' | 'platform' | 'local'
  temperature: number
  seed: number
  thinking: 'off' | 'on' | 'indisponivel'
}

/** Reprodutibilidade do run (a variação entre réplicas vem das SEEDS, não da
 *  temperatura — réplica a temp fixa não é amostra; lição do spike). */
export function runMetadata(input: RunMetadata): RunMetadata {
  return { ...input }
}
