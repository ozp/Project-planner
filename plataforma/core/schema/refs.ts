// Coleta das refs de estímulo usadas por um documento (AD-9/AD-10).
// Usado pela submissão (verificar que todo ref tem asset) e pela carga
// (montar o manifest de preload — carga única, AD-7).
import type { ExperimentDocument } from './types'

export function collectExperimentRefs(doc: ExperimentDocument): string[] {
  const refs = new Set<string>()
  if (doc.experiment.endTextRef) refs.add(doc.experiment.endTextRef)
  for (const block of doc.experiment.blocks) {
    if (block.instructionRef) refs.add(block.instructionRef)
    for (const trial of block.trials) {
      if ('stem' in trial) continue // resposta livre: estímulo é texto do documento, não ref
      trial.sample.forEach(r => refs.add(r))
      if (trial.sampleSoundRef) refs.add(trial.sampleSoundRef)
      trial.comparisons.forEach(r => refs.add(r))
      for (const c of [trial.consequence.correct, trial.consequence.incorrect]) {
        if (c.imageRef) refs.add(c.imageRef)
        if (c.soundRef) refs.add(c.soundRef)
      }
    }
  }
  return [...refs]
}
