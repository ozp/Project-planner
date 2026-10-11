// Contrato canônico da plataforma (spine AD-3/AD-4).
// O documento do experimento é a fonte da verdade (schemaVersion = contrato
// com migração; docVersion = snapshot imutável pinado pela sessão).
// TrialResult é o formato canônico de resultado, respondente-agnóstico:
// timing completo no ramo human, inference no ramo synthetic — nunca ambos.

/** Referência a estímulo/consequência interna (asset content-addressed).
 *  Padrão que impede URL externa e marcação: sem protocolo, sem barra, sem <> (AD-10). */
export type StimulusRef = string

export const STIMULUS_REF_PATTERN = '^[a-z0-9][a-z0-9._-]*$'

export interface Consequence {
  imageRef?: StimulusRef
  soundRef?: StimulusRef
  durationSeconds: number
  /** Consequência textual (F5/Peng): reforço/punição salientes por tentativa.
   *  É o manipulando do probe — nunca nomeia a categoria da condição. */
  text?: string
}

export interface Trial {
  /** 1+ estímulos amostra; mais de 1 = estímulo contextual (semântica PyMTS v2.08). */
  sample: StimulusRef[]
  /** Som da amostra (MTS auditivo-visual) — resposta liberada após o fim. */
  sampleSoundRef?: StimulusRef
  /** Comparativos apresentados (≥2), embaralhados entre posições pelo motor.
   *  GNG/NBACK: espaço de ações binário [ação sim, ação não], ordem fixa, não renderizado. */
  comparisons: StimulusRef[]
  /** Ref correta — obrigatoriamente uma de `comparisons`. */
  correct: StimulusRef
  /** Consequências diferenciais por tentativa (PyMTS). */
  consequence: { correct: Consequence; incorrect: Consequence }
}

/** Tentativa de resposta livre (projetivos — F5 probes nº 2-5): stem textual
 *  e/ou estímulo visual text-native (manchas ASCII). Sem correct, sem
 *  consequência — a resposta vai no ramo `response.text` do TrialResult.
 *  O estímulo é texto do documento imutável (congelado pelo docVersion). */
export interface TextTrial {
  /** Frase incompleta/prompt aberto (SCT, vinhetas). */
  stem: string
  /** Estímulo visual text-native (mancha ASCII) — o adapter renderiza monospace. */
  visualText?: string
}

export type DisplayProtocol =
  | { kind: 'SMTS' } // simultâneo: amostra permanece
  | { kind: 'DMTS'; delaySeconds: number } // atraso: amostra some
  // Stroop: estímulo e comparativos juntos desde o onset — resposta única,
  // sem observing response; comparativos em ordem fixa (TR = onset→resposta)
  | { kind: 'STROOP' }
  // Go/No-Go (clássico ou com estímulos compostos — variante BR de
  // equivalência): estímulo desde o onset; responder = toque na janela,
  // inibir = deixar expirar. Comparativos = espaço de ações binário
  // [ação-go, ação-nogo] em ordem fixa — nunca renderizados como botões
  // (inibir não é escolha ativa; amostras múltiplas = estímulo composto)
  | { kind: 'GNG'; responseWindowMs: number }
  // N-back de letras: ritmo fixo (estímulo stimulusMs + ISI até a janela
  // total). Alvo = estímulo igual ao de n posições antes — a ORDEM das
  // tentativas é semântica: o documento autora a sequência e o motor NÃO
  // embaralha blocos NBACK. Comparativos = ações [match, não-match] (GNG)
  | { kind: 'NBACK'; stimulusMs: number; responseWindowMs: number }

export interface Block {
  name: string
  instructionText?: string
  instructionRef?: StimulusRef
  display: DisplayProtocol
  /** Acertos necessários para aprovar o bloco (critério de mastery). */
  criterion: number
  /** Repetições máximas do bloco ao reprovar o critério. */
  maxRepetitions: number
  trials: Trial[]
}

/** Bloco de resposta livre (projetivos): apresenta stems/manchas e captura
 *  texto — SEM critério e SEM repetições (uma passagem; a análise é de
 *  conteúdo, não de acerto). */
export interface TextBlock {
  name: string
  instructionText?: string
  instructionRef?: StimulusRef
  display: { kind: 'TEXT' }
  trials: TextTrial[]
}

/** Documento pode misturar blocos de escolha e de resposta livre. */
export type AnyBlock = Block | TextBlock

export interface ExperimentConfig {
  screenColor?: [number, number, number]
  itiSeconds: number
  volume?: number
  /** Bloco inicial (1-based) — semântica PyMTS de retomada. */
  startBlock: number
  /** Tela final da sessão (end_text do PyMTS) — asset interno. */
  endTextRef?: StimulusRef
  blocks: AnyBlock[]
}

/** Feedback descritivo/educativo ao participante — NUNCA diagnóstico (NFR7). */
export interface Feedback {
  text: string
}

export interface ExperimentDocument {
  schemaVersion: 1
  /** Snapshot imutável — emitido na submissão (Story 1.6). */
  docVersion: string
  title: string
  description: string
  language: string
  feedback?: Feedback
  experiment: ExperimentConfig
}

// ---------------------------------------------------------------------------
// TrialResult — contrato respondente-agnóstico (AD-3)
// ---------------------------------------------------------------------------

export type RespondentClass = 'human' | 'synthetic'

export interface HumanTiming {
  rtSampleMs: number
  rtComparisonMs: number
  trialMs: number
}

export interface InferenceMeta {
  modelRef: string
  provider: string
  /** Rota do gateway: byok | platform | local (AD-8). */
  route: 'byok' | 'platform' | 'local'
  latencyMs: number
  costUsd?: number
}

export interface TrialResult {
  schemaVersion: 1
  sessionId: string
  respondentClass: RespondentClass
  /** Sequência da tentativa dentro da sessão (ordenador canônico). */
  trialSeq: number
  blockName: string
  /** Hashes das refs apresentadas — não URLs (reprodutibilidade do estímulo).
   *  Obrigatório em tentativas de escolha (selectedRef); tentativas de
   *  resposta livre não têm refs — o estímulo é texto do documento imutável. */
  stimulusHashes?: { sample: StimulusRef[]; comparisons: StimulusRef[] }
  /** MTS: selectedRef; projetivos (F5): texto livre. */
  response: { selectedRef?: StimulusRef; text?: string }
  correct?: boolean
  /** Obrigatório e completo se human; proibido se synthetic. */
  timing?: HumanTiming
  /** Obrigatório se synthetic; proibido se human. */
  inference?: InferenceMeta
}

export const TRIAL_RESULT_SCHEMA_VERSION = 1
export const EXPERIMENT_SCHEMA_VERSION = 1
