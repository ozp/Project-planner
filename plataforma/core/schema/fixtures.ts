// Fixture canônica: documento MTS mínimo porém real, espelhando a estrutura
// do PyMTS (ABtraining/ACtraining/testEq — ver mapeamento projects/02a).
import type { ExperimentDocument } from './types'

export const fixtureExperiment: ExperimentDocument = {
  schemaVersion: 1,
  docVersion: 'doc-0001',
  title: 'Equivalência de estímulos AB/AC (piloto)',
  description: 'Treino AB e AC com teste de equivalência — adaptado do exemplo PyMTS.',
  language: 'pt-BR',
  feedback: { text: 'Obrigado por participar: suas respostas foram registradas para pesquisa.' },
  experiment: {
    screenColor: [0, 0, 0],
    itiSeconds: 0,
    volume: 0.5,
    startBlock: 1,
    blocks: [
      {
        name: 'ABtraining',
        display: { kind: 'SMTS' },
        criterion: 2,
        maxRepetitions: 3,
        trials: [
          {
            sample: ['a1.svg'],
            sampleSoundRef: 'a1s.wav',
            comparisons: ['b1.svg', 'b2.svg'],
            correct: 'b1.svg',
            consequence: {
              correct: { imageRef: 'right.svg', durationSeconds: 1 },
              incorrect: { imageRef: 'wrong.svg', durationSeconds: 1 },
            },
          },
          {
            sample: ['a2.svg'],
            sampleSoundRef: 'a2s.wav',
            comparisons: ['b1.svg', 'b2.svg'],
            correct: 'b2.svg',
            consequence: {
              correct: { imageRef: 'right.svg', durationSeconds: 1 },
              incorrect: { imageRef: 'wrong.svg', durationSeconds: 1 },
            },
          },
        ],
      },
      {
        name: 'ACtraining',
        display: { kind: 'DMTS', delaySeconds: 2 },
        criterion: 2,
        maxRepetitions: 3,
        trials: [
          {
            sample: ['a1.svg'],
            comparisons: ['c1.svg', 'c2.svg'],
            correct: 'c1.svg',
            consequence: {
              correct: { soundRef: 'ding.wav', durationSeconds: 1 },
              incorrect: { durationSeconds: 1 },
            },
          },
          {
            sample: ['a2.svg'],
            comparisons: ['c1.svg', 'c2.svg'],
            correct: 'c2.svg',
            consequence: {
              correct: { soundRef: 'ding.wav', durationSeconds: 1 },
              incorrect: { durationSeconds: 1 },
            },
          },
        ],
      },
      {
        name: 'testEq',
        instructionText: 'A partir de agora, as respostas não terão consequências.',
        display: { kind: 'SMTS' },
        criterion: 1,
        maxRepetitions: 1,
        trials: [
          {
            // estímulo contextual: 2 amostras
            sample: ['ctx1.svg', 'a1.svg'],
            comparisons: ['b1.svg', 'c1.svg'],
            correct: 'b1.svg',
            consequence: {
              correct: { durationSeconds: 0 },
              incorrect: { durationSeconds: 0 },
            },
          },
        ],
      },
    ],
  },
}
