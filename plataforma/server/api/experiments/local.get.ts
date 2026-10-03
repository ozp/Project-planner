// F0 (AD-7): carga única — documento pinado + manifest de assets.
// Em F1 isto vem do banco (docVersion imutável, Story 1.6).
import { fixtureExperiment } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

export interface RunPackage {
  document: ExperimentDocument
  /** Todos os assets referenciados, para o preload (carga única — AD-7). */
  manifest: string[]
}

function collectManifest(doc: ExperimentDocument): string[] {
  const refs = new Set<string>()
  if (doc.experiment.endTextRef) refs.add(doc.experiment.endTextRef)
  for (const block of doc.experiment.blocks) {
    if (block.instructionRef) refs.add(block.instructionRef)
    for (const trial of block.trials) {
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

export default defineEventHandler(() => {
  const pkg: RunPackage = {
    document: fixtureExperiment,
    manifest: collectManifest(fixtureExperiment).map(r => `/stimuli/${r}`),
  }
  return pkg
})
