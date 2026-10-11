import { describe, expect, it } from 'vitest'
import type { EngineEvent } from './engine'
import { MtsEngine } from './engine'
import { fixtureExperiment, fixtureGng, fixtureNback, fixtureSct, fixtureStroop } from '../schema'
import type { ExperimentDocument, TextTrial } from '../schema'

interface RunLog {
  events: EngineEvent[]
  /** trialSeq → ref selecionada (sempre a 1ª dos comparativos apresentados). */
  picks: Map<number, string>
}

/** Roda a sessão inteira respondendo sempre o 1º comparativo apresentado. */
function runAlwaysFirst(doc: ExperimentDocument, seed: number): RunLog {
  return runWith(doc, seed, presentation => presentation.comparisonOrder[0]!)
}

/** Roda a sessão inteira respondendo sempre corretamente (garante avanço por todos os blocos). */
function runAlwaysCorrect(doc: ExperimentDocument, seed: number): RunLog {
  return runWith(doc, seed, presentation => presentation.trial.correct)
}

function runWith(doc: ExperimentDocument, seed: number, pick: (p: Extract<EngineEvent, { kind: 'trial' }>['presentation']) => string): RunLog {
  const engine = new MtsEngine(doc, seed)
  const events: EngineEvent[] = []
  const picks = new Map<number, string>()
  for (;;) {
    const ev = engine.next()
    events.push(ev)
    if (ev.kind === 'sessionEnd') break
    if (ev.kind === 'trial') {
      const chosen = pick(ev.presentation)
      picks.set(ev.presentation.trialSeq, chosen)
      engine.respond(chosen)
    }
  }
  return { events, picks }
}

// Story 1.3 — ACs do motor procedural (AD-2)
describe('MtsEngine', () => {
  it('é determinístico: mesma seed + mesmo doc = mesma sequência', () => {
    const a = runAlwaysFirst(fixtureExperiment, 42)
    const b = runAlwaysFirst(fixtureExperiment, 42)
    expect(a.events).toEqual(b.events)
    expect([...a.picks.entries()]).toEqual([...b.picks.entries()])
  })

  it('comparisonOrder é sempre permutação dos comparativos da tentativa', () => {
    const { events } = runAlwaysFirst(fixtureExperiment, 42)
    for (const ev of events) {
      if (ev.kind !== 'trial') continue
      expect([...ev.presentation.comparisonOrder].sort()).toEqual([...ev.presentation.trial.comparisons].sort())
    }
  })

  it('emite blockStart → instruction (se houver) → trials → blockEnd → sessionEnd', () => {
    const { events } = runAlwaysCorrect(fixtureExperiment, 7)
    const kinds = events.map(e => e.kind)
    // estrutura geral: 3 blocos, com instruction apenas no testEq
    expect(kinds[0]).toBe('blockStart')
    const sessionEnd = events.at(-1)!
    expect(sessionEnd.kind).toBe('sessionEnd')
    const testEqIdx = kinds.findIndex(e => e === 'instruction')
    expect(events[testEqIdx]).toMatchObject({ kind: 'instruction', blockName: 'testEq' })
    // todo blockEnd é seguido de blockStart ou sessionEnd (nunca silencioso)
    kinds.forEach((k, i) => {
      if (k === 'blockEnd') {
        expect(['blockStart', 'sessionEnd']).toContain(kinds[i + 1])
      }
    })
  })

  it('bloco reprovado repete (repetition incrementa) e aprovado avança', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks = [doc.experiment.blocks[0]!] // só ABtraining (criterion 2, 2 trials)
    const engine = new MtsEngine(doc, 99)
    expect(engine.next().kind).toBe('blockStart')
    // responde errado tudo (1ª passagem) → reprova criterion 2
    let ev = engine.next()
    expect(ev.kind).toBe('trial')
    engine.respond(ev.presentation.comparisonOrder.find(c => c !== ev.presentation.trial.correct)!)
    ev = engine.next()
    expect(ev.kind).toBe('trial')
    engine.respond(ev.presentation.comparisonOrder.find(c => c !== ev.presentation.trial.correct)!)
    const end = engine.next()
    expect(end).toMatchObject({ kind: 'blockEnd', passed: false, repetition: 1 })
    expect(engine.next()).toMatchObject({ kind: 'blockStart', repetition: 2 })
    // 2ª passagem: acerta tudo → completa
    ev = engine.next()
    engine.respond(ev.presentation.trial.correct)
    ev = engine.next()
    engine.respond(ev.presentation.trial.correct)
    expect(engine.next()).toMatchObject({ kind: 'blockEnd', passed: true, repetition: 2 })
    expect(engine.next()).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
  })

  it('esgotar maxRepetitions termina a sessão com maxRepetitions', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks = [doc.experiment.blocks[0]!] // maxRepetitions 3
    const engine = new MtsEngine(doc, 5)
    engine.next() // blockStart
    for (let pass = 1; pass <= 3; pass++) {
      for (let t = 0; t < 2; t++) {
        const ev = engine.next()
        if (ev.kind !== 'trial') throw new Error(`esperado trial na passagem ${pass}`)
        const wrong = ev.presentation.comparisonOrder.find(c => c !== ev.presentation.trial.correct)!
        engine.respond(wrong)
      }
      const end = engine.next()
      expect(end).toMatchObject({ kind: 'blockEnd', passed: false, repetition: pass })
      if (pass < 3) expect(engine.next().kind).toBe('blockStart')
    }
    expect(engine.next()).toMatchObject({ kind: 'sessionEnd', reason: 'maxRepetitions' })
  })

  it('trialSeq é contínuo e único na sessão', () => {
    const { events } = runAlwaysCorrect(fixtureExperiment, 42)
    const trials = events.filter((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
    expect(trials.map(t => t.presentation.trialSeq)).toEqual(trials.map((_, i) => i))
  })

  it('leva o protocolo DMTS do bloco para a apresentação', () => {
    const { events } = runAlwaysCorrect(fixtureExperiment, 42)
    const dmts = events.find(
      (e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial' && e.presentation.blockName === 'ACtraining',
    )
    expect(dmts).toBeDefined()
    expect(dmts!.presentation.display).toEqual({ kind: 'DMTS', delaySeconds: 2 })
  })

  it('responde next() após sessionEnd com erro (sessão encerrada)', () => {
    const engine = new MtsEngine(fixtureExperiment, 1)
    for (;;) {
      const ev = engine.next()
      if (ev.kind === 'sessionEnd') break
      if (ev.kind === 'trial') engine.respond(ev.presentation.trial.correct)
    }
    expect(() => engine.next()).toThrow(/encerrada/)
  })

  it('respond() sem trial pendente lança', () => {
    const engine = new MtsEngine(fixtureExperiment, 1)
    engine.next() // blockStart
    expect(() => engine.respond('b1.png')).toThrow(/pendente/)
  })
})

// Story 3.6 — STROOP no motor
describe('MtsEngine — STROOP', () => {
  it('comparativos em ordem fixa do documento (mapeamento estável, TR limpo)', () => {
    const { events } = runAlwaysCorrect(fixtureStroop, 42)
    const trials = events.filter((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
    expect(trials.length).toBeGreaterThan(0)
    for (const ev of trials) {
      expect(ev.presentation.comparisonOrder).toEqual(ev.presentation.trial.comparisons)
      expect(ev.presentation.display).toEqual({ kind: 'STROOP' })
    }
  })

  it('tentativas do bloco STROOP seguem embaralhadas pela seed', () => {
    const firsts = new Set<string>()
    for (let seed = 1; seed <= 8; seed++) {
      const { events } = runAlwaysFirst(fixtureStroop, seed)
      const first = events.find((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
      firsts.add(first!.presentation.trial.sample[0]!)
    }
    expect(firsts.size).toBeGreaterThan(1) // ordem varia com a seed
  })

  it('bloco de passagem única (criterion 1) completa sem repetir', () => {
    const { events } = runAlwaysCorrect(fixtureStroop, 42)
    const blockEnds = events.filter(e => e.kind === 'blockEnd')
    expect(blockEnds).toHaveLength(2)
    for (const e of blockEnds) {
      expect(e).toMatchObject({ passed: true, repetition: 1 })
    }
    expect(events.at(-1)).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
  })
})

// Story 3.7 — GNG no motor (espaço de ações binário nos comparativos)
describe('MtsEngine — GNG', () => {
  it('comparativos em ordem fixa do documento e protocolo na apresentação', () => {
    const { events } = runAlwaysCorrect(fixtureGng, 42)
    const trials = events.filter((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
    expect(trials.length).toBeGreaterThan(0)
    for (const ev of trials) {
      expect(ev.presentation.comparisonOrder).toEqual(ev.presentation.trial.comparisons)
      expect(ev.presentation.display).toEqual({ kind: 'GNG', responseWindowMs: 1500 })
    }
  })

  it('tentativas do bloco GNG seguem embaralhadas pela seed', () => {
    const firsts = new Set<string>()
    for (let seed = 1; seed <= 8; seed++) {
      const { events } = runAlwaysFirst(fixtureGng, seed)
      const first = events.find((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
      firsts.add(first!.presentation.trial.sample.join('+'))
    }
    expect(firsts.size).toBeGreaterThan(1) // ordem varia com a seed
  })

  it('responder sempre (ação-go) acerta só as tentativas go — nogo viram erro de comissão', () => {
    const { events, picks } = runWith(fixtureGng, 42, () => 'gng-go.svg')
    expect([...new Set([...picks.values()])]).toEqual(['gng-go.svg'])
    const treino = events.find(e => e.kind === 'blockEnd' && e.blockName === 'treinoAB')
    expect(treino).toMatchObject({ correct: 2, total: 4, passed: false, repetition: 1 })
    expect(events.at(-1)).toMatchObject({ kind: 'sessionEnd', reason: 'maxRepetitions' })
  })

  it('inibir sempre (ação-nogo) acerta só as tentativas nogo — go viram erro de omissão', () => {
    const { events } = runWith(fixtureGng, 42, () => 'gng-nogo.svg')
    const treino = events.find(e => e.kind === 'blockEnd' && e.blockName === 'treinoAB')
    expect(treino).toMatchObject({ correct: 2, total: 4, passed: false, repetition: 1 })
  })

  it('responder a ação correta por tentativa completa os 2 blocos (equivalência via GNG)', () => {
    const { events } = runAlwaysCorrect(fixtureGng, 42)
    expect(events.at(-1)).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
    const blockEnds = events.filter(e => e.kind === 'blockEnd')
    expect(blockEnds.every(e => e.kind === 'blockEnd' && e.passed)).toBe(true)
  })
})

// Story 3.8 — NBACK no motor (sequência autoral: ordem é semântica)
describe('MtsEngine — NBACK', () => {
  it('tentativas preservam a ordem do documento em qualquer seed (alvo = relação n-back)', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const { events } = runAlwaysFirst(fixtureNback, seed)
      const trials = events.filter((e): e is Extract<EngineEvent, { kind: 'trial' }> => e.kind === 'trial')
      const docOrder = [
        ...fixtureNback.experiment.blocks[0]!.trials,
        ...fixtureNback.experiment.blocks[1]!.trials,
      ]
      expect(trials.map(t => t.presentation.trial.sample[0])).toEqual(docOrder.map(t => t.sample[0]))
    }
  })

  it('comparativos em ordem fixa e protocolo (stimulusMs/isi) na apresentação', () => {
    const { events } = runAlwaysFirst(fixtureNback, 42)
    for (const ev of events) {
      if (ev.kind !== 'trial') continue
      expect(ev.presentation.comparisonOrder).toEqual(ev.presentation.trial.comparisons)
      expect(ev.presentation.display).toEqual({ kind: 'NBACK', stimulusMs: 500, responseWindowMs: 2500 })
    }
  })

  it('participante n-back perfeito (respeita o histórico por bloco) completa 100%', () => {
    const history: Record<string, string[][]> = {}
    const { events } = runWith(fixtureNback, 42, p => {
      const n = p.blockName === 'umback' ? 1 : 2
      const seen = (history[p.blockName] ??= [])
      const isTarget = seen.length >= n && seen[seen.length - n]![0] === p.trial.sample[0]
      seen.push([...p.trial.sample])
      return isTarget ? 'nb-match.svg' : 'nb-nomatch.svg'
    })
    const blockEnds = events.filter(e => e.kind === 'blockEnd')
    expect(blockEnds.map(e => (e as { correct: number, total: number }).correct)).toEqual([4, 5])
    expect(events.at(-1)).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
  })
})

// F5 probe nº2 S1 — blocos TEXT (projetivos): resposta livre, sem correct/critério
describe('MtsEngine — blocos TEXT', () => {
  function runText(doc: ExperimentDocument, seed: number, fill = 'uma conclusão') {
    const engine = new MtsEngine(doc, seed)
    const events: EngineEvent[] = []
    const texts = new Map<number, string>()
    for (;;) {
      const ev = engine.next()
      events.push(ev)
      if (ev.kind === 'sessionEnd') break
      if (ev.kind === 'textTrial') {
        texts.set(ev.presentation.trialSeq, fill)
        engine.respondText(fill)
      }
    }
    return { events, texts }
  }

  const stemsOf = (events: EngineEvent[]) =>
    events.flatMap(ev => (ev.kind === 'textTrial' ? [ev.presentation.trial.stem] : []))

  it('é determinístico: mesma seed + mesmo doc = mesma sequência de eventos', () => {
    const a = runText(fixtureSct, 42)
    const b = runText(fixtureSct, 42)
    expect(a.events).toEqual(b.events)
    expect([...a.texts.entries()]).toEqual([...b.texts.entries()])
  })

  it('apresenta cada stem exatamente uma vez (ordem embaralhada pela seed)', () => {
    const { events } = runText(fixtureSct, 42)
    const block = fixtureSct.experiment.blocks[0]!
    if (block.display.kind !== 'TEXT') throw new Error('fixture: primeiro bloco não é TEXT')
    const expected = block.trials.map((t: TextTrial) => t.stem).sort()
    expect(stemsOf(events)).toHaveLength(expected.length)
    expect([...stemsOf(events)].sort()).toEqual(expected)
  })

  it('emite blockStart → instruction → textTrial×4 → blockEnd(passed) → sessionEnd(completed)', () => {
    const { events } = runText(fixtureSct, 7)
    expect(events.map(e => e.kind)).toEqual([
      'blockStart', 'instruction', 'textTrial', 'textTrial', 'textTrial', 'textTrial', 'blockEnd', 'sessionEnd',
    ])
    expect(events.at(-1)).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
    expect(events.find(e => e.kind === 'blockEnd')).toMatchObject({ passed: true, total: 4, repetition: 1 })
  })

  it('carrega o visualText (mancha ASCII) no evento da tentativa', () => {
    const { events } = runText(fixtureSct, 42)
    const comVisual = events.filter(
      e => e.kind === 'textTrial' && e.presentation.trial.visualText,
    ) as Extract<EngineEvent, { kind: 'textTrial' }>[]
    expect(comVisual).toHaveLength(1)
    expect(comVisual[0]!.presentation.trial.visualText).toMatch(/#/)
  })

  it('respondText sem tentativa pendente lança; respond de escolha sobre textTrial lança', () => {
    const engine = new MtsEngine(fixtureSct, 42)
    expect(() => engine.respondText('x')).toThrow()
    engine.next() // blockStart
    engine.next() // instruction
    const ev = engine.next()
    if (ev.kind !== 'textTrial') throw new Error('esperado textTrial')
    expect(() => engine.respond('sha1-x')).toThrow(/respondText/)
    engine.respondText('resposta livre')
    expect(() => engine.next()).toBeTruthy() // avança após respondText
  })

  it('trialSeq permanece monotônico entre blocos de escolha e bloco TEXT', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks.push(structuredClone(fixtureSct.experiment.blocks[0]!))
    const engine = new MtsEngine(doc, 42)
    const seqs: number[] = []
    let ev: EngineEvent
    do {
      ev = engine.next()
      if (ev.kind === 'trial') {
        seqs.push(ev.presentation.trialSeq)
        engine.respond(ev.presentation.trial.correct)
      }
      if (ev.kind === 'textTrial') {
        seqs.push(ev.presentation.trialSeq)
        engine.respondText('r')
      }
    } while (ev.kind !== 'sessionEnd')
    expect(seqs).toEqual(seqs.map((_, i) => i))
    expect(ev).toMatchObject({ kind: 'sessionEnd', reason: 'completed' })
  })
})
