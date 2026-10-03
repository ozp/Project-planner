// Builder do batch de resultados (AD-5/AD-7): coleta TrialResults canônicos
// produzidos durante a execução e produz o payload único do fim da sessão.
// Puro e testável — o plugin client só alimenta os buffers.
import type { TrialResult } from '../../schema'

export interface BatchPayload {
  sessionId: string
  idempotencyKey: string
  results: TrialResult[]
}

/** Chave de idempotência determinística por sessão (reenvio não duplica). */
export function idempotencyKeyFor(sessionId: string): string {
  return `${sessionId}:batch-v1`
}

export class BatchBuilder {
  private readonly results = new Map<number, TrialResult>()

  constructor(private readonly sessionId: string) {}

  /** Adiciona/substitui por trialSeq (checkpoint explícito inclui tudo já visto). */
  add(result: TrialResult): void {
    if (result.sessionId !== this.sessionId) {
      throw new Error(`batch: TrialResult de sessão estranha (${result.sessionId} ≠ ${this.sessionId})`)
    }
    if (result.trialSeq < 0) throw new Error('batch: trialSeq negativo')
    this.results.set(result.trialSeq, result)
  }

  get size(): number {
    return this.results.size
  }

  build(): BatchPayload {
    const results = [...this.results.values()].sort((a, b) => a.trialSeq - b.trialSeq)
    const seqs = results.map(r => r.trialSeq)
    for (let i = 0; i < seqs.length; i++) {
      if (seqs[i] !== i) throw new Error(`batch: trialSeq esperado ${i}, encontrado ${seqs[i]}`)
    }
    return {
      sessionId: this.sessionId,
      idempotencyKey: idempotencyKeyFor(this.sessionId),
      results,
    }
  }
}
