// Validação do TrialResult (AD-3): contrato respondente-agnóstico.
// human → timing completo obrigatório, inference proibido;
// synthetic → inference obrigatória, timing proibido. Mistos rejeitados.
import Ajv2020 from 'ajv/dist/2020.js'
import type { TrialResult } from './types'
import { STIMULUS_REF_PATTERN, TRIAL_RESULT_SCHEMA_VERSION } from './types'
import type { ValidationResult } from './experiment'

const ajv = new Ajv2020({ allErrors: true, strict: true })

const stimulusRef = { type: 'string', pattern: STIMULUS_REF_PATTERN }

const trialResultJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'trial-result-v1',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'sessionId', 'respondentClass', 'trialSeq', 'blockName', 'response'],
  properties: {
    schemaVersion: { const: TRIAL_RESULT_SCHEMA_VERSION },
    sessionId: { type: 'string', minLength: 1 },
    respondentClass: { enum: ['human', 'synthetic'] },
    trialSeq: { type: 'integer', minimum: 0 },
    blockName: { type: 'string', minLength: 1 },
    stimulusHashes: {
      type: 'object',
      additionalProperties: false,
      required: ['sample', 'comparisons'],
      properties: {
        sample: { type: 'array', minItems: 1, items: stimulusRef },
        comparisons: { type: 'array', minItems: 2, items: stimulusRef },
      },
    },
    response: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selectedRef: stimulusRef,
        text: { type: 'string', minLength: 1, maxLength: 20000 },
      },
    },
    correct: { type: 'boolean' },
    timing: {
      type: 'object',
      additionalProperties: false,
      required: ['rtSampleMs', 'rtComparisonMs', 'trialMs'],
      properties: {
        rtSampleMs: { type: 'number', minimum: 0 },
        rtComparisonMs: { type: 'number', minimum: 0 },
        trialMs: { type: 'number', minimum: 0 },
      },
    },
    inference: {
      type: 'object',
      additionalProperties: false,
      required: ['modelRef', 'provider', 'route', 'latencyMs'],
      properties: {
        modelRef: { type: 'string', minLength: 1 },
        provider: { type: 'string', minLength: 1 },
        route: { enum: ['byok', 'platform', 'local'] },
        latencyMs: { type: 'number', minimum: 0 },
        costUsd: { type: 'number', minimum: 0 },
      },
    },
  },
  allOf: [
    {
      // tentativa de escolha: refs apresentadas são obrigatórias (reprodutibilidade)
      if: { properties: { response: { type: 'object', required: ['selectedRef'], properties: { selectedRef: true } } }, required: ['response'] },
      then: { required: ['stimulusHashes'], properties: { stimulusHashes: true } },
    },
    {
      // humano: timing obrigatório, inference proibida (prop false = forbidden, draft 2020-12)
      if: { properties: { respondentClass: { const: 'human' } }, required: ['respondentClass'] },
      then: { required: ['timing'], properties: { timing: true, inference: false } },
    },
    {
      // sintético: inference obrigatória, timing proibido
      if: { properties: { respondentClass: { const: 'synthetic' } }, required: ['respondentClass'] },
      then: { required: ['inference'], properties: { inference: true, timing: false } },
    },
  ],
}

const validateJson = ajv.compile(trialResultJsonSchema)

export function validateTrialResult(input: unknown): ValidationResult {
  if (!validateJson(input)) {
    const errors = (validateJson.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message ?? ''}`.trim())
    return { ok: false, errors }
  }
  const tr = input as TrialResult
  const errors: string[] = []
  // selectedRef apresentado deve estar entre os comparativos da tentativa
  if (tr.response.selectedRef && !tr.stimulusHashes?.comparisons.includes(tr.response.selectedRef)) {
    errors.push('response.selectedRef: não está em stimulusHashes.comparisons')
  }
  return { ok: errors.length === 0, errors }
}
