// Fixture canônica: documento MTS mínimo porém real, espelhando a estrutura
// do PyMTS (ABtraining/ACtraining/testEq — ver mapeamento projects/02a).
// fixtureStroop: 2º instrumento (Story 3.6) — compacta para testes; o pacote
// real (3 blocos × 24) vive em plataforma/experiments/stroop-victoria/.
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

export const fixtureStroop: ExperimentDocument = {
  schemaVersion: 1,
  docVersion: 'doc-0002',
  title: 'Stroop Victoria digital (fixture)',
  description: 'Neutro/congruente/incongruente — resposta única desde o onset (TR por tentativa).',
  language: 'pt-BR',
  feedback: { text: 'Obrigado! Seus tempos de resposta foram registrados para pesquisa.' },
  experiment: {
    screenColor: [255, 255, 255],
    itiSeconds: 0.5,
    volume: 0.5,
    startBlock: 1,
    blocks: [
      {
        name: 'neutro',
        instructionText: 'Toque na cor da tinta dos círculos, o mais rápido que puder.',
        display: { kind: 'STROOP' },
        criterion: 1,
        maxRepetitions: 1,
        trials: [
          { sample: ['st-pontos-vermelho.svg'], comparisons: ['st-cor-vermelho.svg', 'st-cor-azul.svg', 'st-cor-verde.svg'], correct: 'st-cor-vermelho.svg', consequence: { correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } } },
          { sample: ['st-pontos-azul.svg'], comparisons: ['st-cor-vermelho.svg', 'st-cor-azul.svg', 'st-cor-verde.svg'], correct: 'st-cor-azul.svg', consequence: { correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } } },
        ],
      },
      {
        name: 'incongruente',
        instructionText: 'Toque na cor em que a palavra está escrita, ignorando o que ela diz.',
        display: { kind: 'STROOP' },
        criterion: 1,
        maxRepetitions: 1,
        trials: [
          { sample: ['st-vermelho-azul.svg'], comparisons: ['st-cor-vermelho.svg', 'st-cor-azul.svg', 'st-cor-verde.svg'], correct: 'st-cor-azul.svg', consequence: { correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } } },
          { sample: ['st-azul-verde.svg'], comparisons: ['st-cor-vermelho.svg', 'st-cor-azul.svg', 'st-cor-verde.svg'], correct: 'st-cor-verde.svg', consequence: { correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } } },
        ],
      },
    ],
  },
}
