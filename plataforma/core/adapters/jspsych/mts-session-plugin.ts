// Plugin jsPsych 8 de SESSÃO MTS (AD-2): dirige o MtsEngine (next/respond)
// e renderiza as fases — sample (observing response + som opcional) →
// delay DMTS → comparativos → consequência diferencial → ITI.
// Zero chamadas de rede entre trials (AD-7): áudios e imagens vêm do
// preload inicial; só há rede no POST final do batch.
import { ParameterType } from 'jspsych'
import type { JsPsych, JsPsychPlugin, TrialType } from 'jspsych'
import type { MtsEngine, EngineEvent  } from '../../engine/engine'
import type { ExperimentDocument, StimulusRef, TrialResult } from '../../schema'
import { BatchBuilder } from './batch'

interface MtsSessionParams {
  engine: MtsEngine
  document: ExperimentDocument
  sessionId: string
  assetBase: string
  /** Resolução custom de ref→URL (docs submetidos: /api/assets/<ref>; default: assetBase+ref). */
  resolveAsset?: (ref: StimulusRef) => string
  /** Fim da sessão — a página envia o batch. */
  onFinish?: (batch: BatchBuilder, reason: string) => void
}

export class MtsSessionPlugin implements JsPsychPlugin<MtsSessionParams> {
  static info = {
    name: 'mts-session',
    version: '0.1.0',
    parameters: {
      engine: { type: ParameterType.OBJECT, default: undefined },
      document: { type: ParameterType.OBJECT, default: undefined },
      sessionId: { type: ParameterType.STRING, default: undefined },
      assetBase: { type: ParameterType.STRING, default: '/stimuli/' },
      resolveAsset: { type: ParameterType.FUNCTION, default: undefined },
      onFinish: { type: ParameterType.FUNCTION, default: undefined },
    },
    data: {
      session_summary: { type: ParameterType.OBJECT },
    },
  } as const

  constructor(public jsPsych: JsPsych) {}

  async trial(display: HTMLElement, trial: TrialType<typeof this>) {
    const { engine, document: doc, sessionId, assetBase, resolveAsset, onFinish } = trial
    const batch = new BatchBuilder(sessionId)
    const rgb = doc.experiment.screenColor ?? [0, 0, 0]
    const bg = rgb.join(', ')
    // luminância decide a cor do texto (Stroop usa fundo claro, MTS escuro)
    const fg = 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]! > 128 ? '#111' : '#eee'
    display.innerHTML = `<div id="mts-stage" style="background: rgb(${bg}); color: ${fg}; min-height: 90vh; display: flex; align-items: center; justify-content: center; flex-direction: column; user-select: none;"></div>`
    const stage = display.querySelector<HTMLElement>('#mts-stage')!

    const assetUrl = (ref: StimulusRef): string => resolveAsset ? resolveAsset(ref) : `${assetBase}${ref}`
    const img = (ref: StimulusRef, size = 160): string =>
      `<img src="${assetUrl(ref)}" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;">`
    const audio = (ref: StimulusRef): HTMLAudioElement => {
      const a = new window.Audio(assetUrl(ref))
      a.volume = doc.experiment.volume ?? 0.5
      return a
    }
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
    const clickOn = (el: HTMLElement) => new Promise<void>(r => el.addEventListener('click', () => r(), { once: true }))

    try {
      for (;;) {
        const ev: EngineEvent = engine.next()
        if (ev.kind === 'sessionEnd') {
          const reason = ev.reason
          // tela final (AD-9 endTextRef) + encerra
          const endRef = doc.experiment.endTextRef
          stage.innerHTML = endRef
            ? `<div>${img(endRef, 320)}</div>`
            : `<p style="font-size:1.4rem">${doc.feedback?.text ?? 'Sessão concluída.'}</p>`
          onFinish?.(batch, reason)
          this.jsPsych.finishTrial({ session_summary: { reason, trials: batch.size } })
          return
        }
        if (ev.kind === 'instruction') {
          stage.innerHTML = `
            <div style="max-width:640px;text-align:center;font-size:1.15rem;line-height:1.6">
              ${ev.instructionRef ? img(ev.instructionRef, 260) : (ev.instructionText ?? '')}
              <p><button id="mts-go" style="font-size:1.1rem;padding:.6rem 2rem">Continuar</button></p>
            </div>`
          await clickOn(stage.querySelector<HTMLElement>('#mts-go')!)
          continue
        }
        if (ev.kind !== 'trial') continue // blockStart/blockEnd: sem apresentação

        const p = ev.presentation
        const t0 = performance.now()
        const compsRow = (order: readonly StimulusRef[]): string =>
          order.map(c => `<img data-ref="${c}" src="${assetUrl(c)}" alt="" draggable="false" style="width:200px;height:200px;object-fit:contain;cursor:pointer;">`).join('')
        const selectFrom = (): Promise<string> => new Promise<string>(resolve => {
          for (const el of stage.querySelectorAll<HTMLImageElement>('#mts-comps img')) {
            el.addEventListener('click', () => resolve(el.dataset.ref!), { once: true })
          }
        })

        let rtSampleMs: number
        let rtComparisonMs: number
        let selected: string

        if (p.display.kind === 'NBACK') {
          // N-back: ritmo fixo — estímulo por stimulusMs, ISI até a janela
          // total. O toque (match) é aceito durante toda a janela e NÃO
          // encerra a tentativa (cadência preservada); TR = onset→toque;
          // sem toque → ação não-match com rtComparisonMs=0
          stage.innerHTML = `<div style="min-height:80vh;display:flex;align-items:center;justify-content:center;padding:24px">${p.trial.sample.map(s => img(s, 200)).join('')}</div>`
          const tap = { at: 0 }
          const controller = new AbortController()
          stage.addEventListener('click', () => { tap.at = performance.now() - t0; controller.abort() }, { once: true, signal: controller.signal })
          await wait(p.display.stimulusMs)
          stage.innerHTML = ''
          await wait(Math.max(0, p.display.responseWindowMs - p.display.stimulusMs))
          selected = tap.at > 0 ? p.comparisonOrder[0]! : p.comparisonOrder[1]!
          rtSampleMs = 0
          rtComparisonMs = tap.at
        } else if (p.display.kind === 'GNG') {
          // GNG: estímulo (simples ou composto) desde o onset; responder = toque
          // em qualquer lugar dentro da janela; inibir = deixar expirar. Ação
          // registrada = comparativos fixos [ação-go, ação-nogo]; TR = onset→toque
          // (inibição não tem TR — rtComparisonMs=0, como rtSampleMs no Stroop)
          stage.innerHTML = `<div style="min-height:80vh;display:flex;align-items:center;justify-content:center;gap:96px;padding:24px">${p.trial.sample.map(s => img(s, 200)).join('')}</div>`
          const emitted = await new Promise<boolean>(resolve => {
            const controller = new AbortController()
            const timer = setTimeout(() => { controller.abort(); resolve(false) }, p.display.responseWindowMs)
            stage.addEventListener('click', () => { clearTimeout(timer); resolve(true) }, { once: true, signal: controller.signal })
          })
          selected = emitted ? p.comparisonOrder[0]! : p.comparisonOrder[1]!
          rtSampleMs = 0
          rtComparisonMs = emitted ? performance.now() - t0 : 0
        } else if (p.display.kind === 'STROOP') {
          // Stroop: estímulo + comparativos desde o onset, resposta única —
          // TR = onset→resposta; sem observing response (rtSampleMs não se aplica)
          stage.innerHTML = `<div style="display:flex;gap:24px;padding:24px">${p.trial.sample.map(s => img(s, 240)).join('')}</div><div id="mts-comps" style="display:flex;gap:96px;padding:24px">${compsRow(p.comparisonOrder)}</div>`
          selected = await selectFrom()
          rtSampleMs = 0
          rtComparisonMs = performance.now() - t0
        } else {
          // fase 1: amostra(s) — observing response obrigatória (clique)
          stage.innerHTML = `<div id="mts-sample" style="display:flex;gap:24px;cursor:pointer;padding:24px">${p.trial.sample.map(s => img(s)).join('')}</div>`
          await clickOn(stage.querySelector<HTMLElement>('#mts-sample')!)
          rtSampleMs = performance.now() - t0

          // MTS auditivo-visual: som no clique da amostra; comparativos liberam após o fim
          let sampleAudioDone = Promise.resolve()
          if (p.trial.sampleSoundRef) {
            const a = audio(p.trial.sampleSoundRef)
            sampleAudioDone = new Promise<void>(r => {
              a.addEventListener('ended', () => r(), { once: true })
              a.play().catch(() => r())
            })
          }

          // fase 2: DMTS — amostra some, delay com tela vazia
          if (p.display.kind === 'DMTS') {
            stage.innerHTML = ''
            await Promise.all([wait(p.display.delaySeconds * 1000), sampleAudioDone])
          } else {
            await sampleAudioDone
          }

          // fase 3: comparativos (SMTS mantém a amostra em cima)
          const sampleHtml = p.display.kind === 'SMTS' ? `<div style="display:flex;gap:24px;padding:12px">${p.trial.sample.map(s => img(s, 120)).join('')}</div>` : ''
          stage.innerHTML = `${sampleHtml}<div id="mts-comps" style="display:flex;gap:96px;padding:24px">${compsRow(p.comparisonOrder)}</div>`
          const compsStart = performance.now()
          selected = await selectFrom()
          rtComparisonMs = performance.now() - compsStart
        }

        // fase 4: consequência diferencial + registro canônico (AD-3)
        const correct = engine.respond(selected)
        const consequence = correct ? p.trial.consequence.correct : p.trial.consequence.incorrect
        const consAudio = consequence.soundRef ? audio(consequence.soundRef) : null
        stage.innerHTML = consequence.imageRef
          ? `<div>${img(consequence.imageRef, 240)}</div>`
          : (consequence.text
              ? `<p style="font-size:1.5rem;max-width:640px;text-align:center">${consequence.text}</p>`
              : `<div style="height:240px"></div>`)
        consAudio?.play().catch(() => {})
        const result: TrialResult = {
          schemaVersion: 1,
          sessionId,
          respondentClass: 'human',
          trialSeq: p.trialSeq,
          blockName: p.blockName,
          stimulusHashes: { sample: [...p.trial.sample], comparisons: [...p.trial.comparisons] },
          response: { selectedRef: selected },
          correct,
          timing: { rtSampleMs, rtComparisonMs, trialMs: performance.now() - t0 },
        }
        batch.add(result)
        await wait(Math.max(0, consequence.durationSeconds * 1000))
        consAudio?.pause()

        // fase 5: ITI
        stage.innerHTML = ''
        await wait(doc.experiment.itiSeconds * 1000)
      }
    } catch (err) {
      // motor em estado inválido ou asset falho: encerra com resumo de erro
      onFinish?.(batch, `error:${String(err)}`)
      this.jsPsych.finishTrial({ session_summary: { reason: 'error', error: String(err), trials: batch.size } })
    }
  }
}
