// Motor procedural respondente-agnóstico (AD-2).
// Executa blocos com critério de mastery, repetições e re-embaralhamento com
// seed registrada. Adapters apenas renderizam estímulos (EngineEvent) e
// devolvem a resposta do respondente (respond). Sem HTTP, DOM, clock ou LLM.
import type { DisplayProtocol, ExperimentDocument, StimulusRef, Trial } from '../schema'
import { mulberry32, shuffled } from './prng'

export interface PresentedTrial {
  /** Tentativa do documento (inclui `correct` — o adapter NÃO decide acerto). */
  trial: Readonly<Trial>
  /** Comparativos na ordem de apresentação (posições embaralhadas nesta tentativa). */
  comparisonOrder: readonly StimulusRef[]
  /** Protocolo do bloco (SMTS ou DMTS com delay) — o adapter faseia a apresentação. */
  display: DisplayProtocol
  /** Sequência global da tentativa na sessão — casa com TrialResult.trialSeq. */
  trialSeq: number
  blockName: string
}

export type EngineEvent =
  | { kind: 'blockStart'; blockName: string; repetition: number }
  | { kind: 'instruction'; blockName: string; instructionText?: string; instructionRef?: string }
  | { kind: 'trial'; presentation: PresentedTrial }
  | { kind: 'blockEnd'; blockName: string; passed: boolean; correct: number; total: number; repetition: number }
  | { kind: 'sessionEnd'; reason: 'completed' | 'maxRepetitions' }

/**
 * Máquina de estados do experimento.
 *
 * Uso: `next()` entrega o próximo evento de apresentação; quando o evento é
 * `trial`, o adapter coleta a resposta e devolve via `respond(selectedRef)`.
 * `respond` só é válido sobre um `trial` pendente; `next` só avança quando não
 * há trial pendente. Eventos `blockEnd`/`sessionEnd` são terminais de passo —
 * `next()` após `sessionEnd` lança (a sessão acabou).
 */
export class MtsEngine {
  readonly seed: number

  private readonly doc: ExperimentDocument
  private readonly rand: () => number

  private blockIndex: number // índice em doc.experiment.blocks
  private repetition = 1
  private blockCorrect = 0
  private blockTotal = 0
  private queue: readonly Trial[] = [] // linhas da passagem atual (embaralhadas)
  private pendingTrial: Readonly<Trial> | null = null
  private trialSeq = -1
  private lastEvent: EngineEvent['kind'] | null = null
  private finished = false
  private afterBlockEnd: 'advance' | 'repeat' | 'finish-max' | 'finish-done' | null = null

  constructor(doc: ExperimentDocument, seed: number) {
    this.doc = doc
    this.seed = seed
    this.rand = mulberry32(seed)
    this.blockIndex = doc.experiment.startBlock - 1
  }

  /** Contexto global da sessão (o adapter aplica: cor de fundo, ITI, volume, tela final). */
  get context(): Readonly<ExperimentDocument['experiment']> {
    return this.doc.experiment
  }

  next(): EngineEvent {
    if (this.finished) throw new Error('engine: sessão encerrada — next() após sessionEnd')
    if (this.pendingTrial) throw new Error('engine: trial pendente — chame respond() antes de next()')

    // decisão pendente de um blockEnd anterior
    if (this.lastEvent === 'blockEnd') {
      const decision = this.afterBlockEnd
      this.afterBlockEnd = null
      if (decision === 'finish-max') {
        this.finished = true
        // PyMTS: ao esgotar repetições a sessão termina (retomada via startBlock)
        return { kind: 'sessionEnd', reason: 'maxRepetitions' }
      }
      if (decision === 'finish-done') {
        this.finished = true
        return { kind: 'sessionEnd', reason: 'completed' }
      }
      if (decision === 'advance') {
        this.blockIndex += 1
        this.repetition = 1
      } else {
        this.repetition += 1
      }
    }

    const block = this.doc.experiment.blocks[this.blockIndex]!

    if (this.lastEvent === null || this.lastEvent === 'blockEnd') {
      // início de passagem do bloco: (re)embaralha as linhas — EXCETO NBACK:
      // a ordem é semântica (alvo = estímulo igual ao de n posições antes);
      // o documento autora a sequência e a seed não pode destruí-la
      this.queue = block.display.kind === 'NBACK' ? block.trials : shuffled(block.trials, this.rand)
      this.blockCorrect = 0
      this.blockTotal = 0
      this.lastEvent = 'blockStart'
      return { kind: 'blockStart', blockName: block.name, repetition: this.repetition }
    }

    if (this.lastEvent === 'blockStart' && (block.instructionText || block.instructionRef)) {
      this.lastEvent = 'instruction'
      return {
        kind: 'instruction',
        blockName: block.name,
        instructionText: block.instructionText,
        instructionRef: block.instructionRef,
      }
    }

    const nextTrial = this.queue[this.blockTotal]
    if (nextTrial) {
      this.trialSeq += 1
      this.pendingTrial = nextTrial
      this.lastEvent = 'trial'
      return {
        kind: 'trial',
        presentation: {
          trial: nextTrial,
          // Stroop mantém os comparativos na ordem do documento: mapeamento de
          // resposta estável entre tentativas é requisito de TR limpo. GNG e
          // NBACK idem — comparativos são o espaço de ações [sim, não] fixo
          comparisonOrder: block.display.kind === 'STROOP' || block.display.kind === 'GNG' || block.display.kind === 'NBACK'
            ? nextTrial.comparisons
            : shuffled(nextTrial.comparisons, this.rand),
          display: block.display,
          trialSeq: this.trialSeq,
          blockName: block.name,
        },
      }
    }

    // passagem esgotada: emite blockEnd e agenda a decisão (o dado do bloco é científico)
    this.lastEvent = 'blockEnd'
    const passed = this.blockCorrect >= block.criterion
    this.afterBlockEnd = passed
      ? (this.blockIndex === this.doc.experiment.blocks.length - 1 ? 'finish-done' : 'advance')
      : (this.repetition >= block.maxRepetitions ? 'finish-max' : 'repeat')
    return {
      kind: 'blockEnd',
      blockName: block.name,
      passed,
      correct: this.blockCorrect,
      total: this.blockTotal,
      repetition: this.repetition,
    }
  }

  /** Registra a resposta do respondente para o trial pendente e computa o acerto. */
  respond(selectedRef: StimulusRef): boolean {
    const trial = this.pendingTrial
    if (!trial) throw new Error('engine: respond() sem trial pendente')
    const correct = selectedRef === trial.correct
    if (correct) this.blockCorrect += 1
    this.blockTotal += 1
    this.pendingTrial = null
    return correct
  }
}
