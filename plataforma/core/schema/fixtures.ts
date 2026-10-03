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
            sample: ['a1.png'],
            sampleSoundRef: 'a1s.wav',
            comparisons: ['b1.png', 'b2.png'],
            correct: 'b1.png',
            consequence: {
              correct: { imageRef: 'right.png', durationSeconds: 1 },
              incorrect: { imageRef: 'wrong.png', durationSeconds: 1 },
            },
          },
          {
            sample: ['a2.png'],
            sampleSoundRef: 'a2s.wav',
            comparisons: ['b1.png', 'b2.png'],
            correct: 'b2.png',
            consequence: {
              correct: { imageRef: 'right.png', durationSeconds: 1 },
              incorrect: { imageRef: 'wrong.png', durationSeconds: 1 },
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
            sample: ['a1.png'],
            comparisons: ['c1.png', 'c2.png'],
            correct: 'c1.png',
            consequence: {
              correct: { soundRef: 'ding.wav', durationSeconds: 1 },
              incorrect: { durationSeconds: 1 },
            },
          },
          {
            sample: ['a2.png'],
            comparisons: ['c1.png', 'c2.png'],
            correct: 'c2.png',
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
            sample: ['ctx1.png', 'a1.png'],
            comparisons: ['b1.png', 'c1.png'],
            correct: 'b1.png',
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
