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
  /** Coletor de checkpoints — recebe o builder a cada trial (AD-5 checkpoint explícito). */
  onTrial?: (result: TrialResult, batch: BatchBuilder) => void
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
      onTrial: { type: ParameterType.FUNCTION, default: undefined },
      onFinish: { type: ParameterType.FUNCTION, default: undefined },
    },
    data: {
      session_summary: { type: ParameterType.OBJECT },
    },
  } as const

  constructor(public jsPsych: JsPsych) {}

  async trial(display: HTMLElement, trial: TrialType<typeof this>) {
    const { engine, document: doc, sessionId, assetBase, onTrial, onFinish } = trial
    const batch = new BatchBuilder(sessionId)
    const bg = doc.experiment.screenColor?.join(', ') ?? '0, 0, 0'
    display.innerHTML = `<div id="mts-stage" style="background: rgb(${bg}); color: #eee; min-height: 90vh; display: flex; align-items: center; justify-content: center; flex-direction: column; user-select: none;"></div>`
    const stage = display.querySelector<HTMLElement>('#mts-stage')!

    const img = (ref: StimulusRef, size = 160): string =>
      `<img src="${assetBase}${ref}" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;">`
    const audio = (ref: StimulusRef): HTMLAudioElement => {
      const a = new window.Audio(`${assetBase}${ref}`)
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
        let sampleAudioDone = Promise.resolve()

        // fase 1: amostra(s) — observing response obrigatória (clique)
        stage.innerHTML = `<div id="mts-sample" style="display:flex;gap:24px;cursor:pointer;padding:24px">${p.trial.sample.map(s => img(s)).join('')}</div>`
        await clickOn(stage.querySelector<HTMLElement>('#mts-sample')!)
        const rtSampleMs = performance.now() - t0

        // MTS auditivo-visual: som no clique da amostra; comparativos liberam após o fim
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
        const compsRow = p.comparisonOrder.map(c => `<img data-ref="${c}" src="${assetBase}${c}" alt="" draggable="false" style="width:200px;height:200px;object-fit:contain;cursor:pointer;">`).join('')
        const sampleHtml = p.display.kind === 'SMTS' ? `<div style="display:flex;gap:24px;padding:12px">${p.trial.sample.map(s => img(s, 120)).join('')}</div>` : ''
        stage.innerHTML = `${sampleHtml}<div id="mts-comps" style="display:flex;gap:96px;padding:24px">${compsRow}</div>`
        const compsStart = performance.now()
        const selected: string = await new Promise<string>(resolve => {
          for (const el of stage.querySelectorAll<HTMLImageElement>('#mts-comps img')) {
            el.addEventListener('click', () => resolve(el.dataset.ref!), { once: true })
          }
        })
        const rtComparisonMs = performance.now() - compsStart

        // fase 4: consequência diferencial + registro canônico (AD-3)
        const { correct } = engine.respond(selected)
        const consequence = correct ? p.trial.consequence.correct : p.trial.consequence.incorrect
        const consAudio = consequence.soundRef ? audio(consequence.soundRef) : null
        stage.innerHTML = consequence.imageRef
          ? `<div>${img(consequence.imageRef, 240)}</div>`
          : `<div style="height:240px"></div>`
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
        onTrial?.(result, batch)
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
