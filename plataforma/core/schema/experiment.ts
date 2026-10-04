// Validação do ExperimentDocument (AD-4): JSON Schema (estrutura) +
// regras semânticas cross-field + guarda de conteúdo ativo (AD-10).
import Ajv2020 from 'ajv/dist/2020.js'
import type { ExperimentDocument } from './types'
import { EXPERIMENT_SCHEMA_VERSION, STIMULUS_REF_PATTERN } from './types'

const ajv = new Ajv2020({ allErrors: true, strict: true })

const stimulusRef = { type: 'string', pattern: STIMULUS_REF_PATTERN }

const consequenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['durationSeconds'],
  properties: {
    imageRef: stimulusRef,
    soundRef: stimulusRef,
    durationSeconds: { type: 'number', minimum: 0 },
  },
}

const experimentJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'experiment-document-v1',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'docVersion', 'title', 'description', 'language', 'experiment'],
  properties: {
    schemaVersion: { const: EXPERIMENT_SCHEMA_VERSION },
    docVersion: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 2000 },
    language: { type: 'string', minLength: 2, maxLength: 10 },
    feedback: {
      type: 'object',
      additionalProperties: false,
      required: ['text'],
      properties: { text: { type: 'string', minLength: 1, maxLength: 5000 } },
    },
    experiment: {
      type: 'object',
      additionalProperties: false,
      required: ['itiSeconds', 'startBlock', 'blocks'],
      properties: {
        screenColor: { type: 'array', items: { type: 'integer', minimum: 0, maximum: 255 }, minItems: 3, maxItems: 3 },
        itiSeconds: { type: 'number', minimum: 0 },
        volume: { type: 'number', minimum: 0, maximum: 1 },
        startBlock: { type: 'integer', minimum: 1 },
        endTextRef: stimulusRef,
        blocks: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'display', 'criterion', 'maxRepetitions', 'trials'],
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              instructionText: { type: 'string', maxLength: 5000 },
              instructionRef: stimulusRef,
                  display: {
                    oneOf: [
                      { type: 'object', additionalProperties: false, required: ['kind'], properties: { kind: { const: 'SMTS' } } },
                      {
                        type: 'object',
                        additionalProperties: false,
                        required: ['kind', 'delaySeconds'],
                        properties: { kind: { const: 'DMTS' }, delaySeconds: { type: 'number', minimum: 0 } },
                      },
                      { type: 'object', additionalProperties: false, required: ['kind'], properties: { kind: { const: 'STROOP' } } },
                    ],
                  },
              criterion: { type: 'integer', minimum: 1 },
              maxRepetitions: { type: 'integer', minimum: 1 },
              trials: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['sample', 'comparisons', 'correct', 'consequence'],
                  properties: {
                    sample: { type: 'array', minItems: 1, items: stimulusRef },
                    sampleSoundRef: stimulusRef,
                    comparisons: { type: 'array', minItems: 2, items: stimulusRef },
                    correct: stimulusRef,
                    consequence: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['correct', 'incorrect'],
                      properties: {
                        correct: consequenceSchema,
                        incorrect: consequenceSchema,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

const validateJson = ajv.compile(experimentJsonSchema)

/** AD-10 (defesa em profundidade): nenhum conteúdo ativo nem URL externa em campo textual. */
const ACTIVE_CONTENT = [/<\s*script/i, /<\s*iframe/i, /javascript\s*:/i, /\son\w+\s*=/i, /https?:\/\//i]

function assertNoActiveContent(path: string, text: string, errors: string[]): void {
  for (const re of ACTIVE_CONTENT) {
    if (re.test(text)) {
      errors.push(`${path}: conteúdo ativo/URL externa proibido (AD-10) — casou /${re.source}/`)
    }
  }
}

export interface ValidationResult {
  ok: boolean
  /** Erros acionáveis com caminho do campo (Story 1.6). */
  errors: string[]
}

/** Regras semânticas que o JSON Schema não expressa (cross-field).
 *  Só roda pós-ajv: o input já tem o shape de ExperimentDocument. */
function semanticRules(doc: ExperimentDocument, errors: string[]): void {
  const { blocks, startBlock } = doc.experiment
  if (startBlock > blocks.length) {
    errors.push(`experiment.startBlock: ${startBlock} > número de blocos (${blocks.length})`)
  }
  blocks.forEach((block, bi) => {
    const at = `experiment.blocks[${bi}]`
    if (block.criterion > block.trials.length) {
      errors.push(`${at}.criterion: ${block.criterion} > tentativas do bloco (${block.trials.length})`)
    }
    block.trials.forEach((trial, ti) => {
      const t = `${at}.trials[${ti}]`
      if (!trial.comparisons.includes(trial.correct)) {
        errors.push(`${t}.correct: "${trial.correct}" não está em comparisons`)
      }
      if (new Set(trial.comparisons).size !== trial.comparisons.length) {
        errors.push(`${t}.comparisons: refs duplicadas`)
      }
    })
  })
}

export function validateExperimentDocument(input: unknown): ValidationResult {
  const errors: string[] = []
  if (!validateJson(input)) {
    errors.push(...(validateJson.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message ?? ''}`.trim()))
    return { ok: false, errors }
  }

  const doc = input as ExperimentDocument
  assertNoActiveContent('title', doc.title, errors)
  assertNoActiveContent('description', doc.description, errors)
  if (doc.feedback) assertNoActiveContent('feedback.text', doc.feedback.text, errors)
  doc.experiment.blocks.forEach((block, bi) => {
    if (block.instructionText) assertNoActiveContent(`experiment.blocks[${bi}].instructionText`, block.instructionText, errors)
  })
  semanticRules(doc, errors)

  return { ok: errors.length === 0, errors }
}
