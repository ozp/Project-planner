// Pseudonimização (AD-6): HMAC keyed + salt por experimento, emitido
// exclusivamente aqui (identity). Classe protegida nunca vira o identificador
// de análise: exports/prompts/analytics só veem o pseudônimo.
import { createHmac } from 'node:crypto'

/** Deriva o pseudônimo de (usuário, experimento). Determinístico: mesmo par
 *  → mesmo pseudônimo; experimentos diferentes → pseudônimos não correlacionáveis. */
export function derivePseudonym(userId: string, docVersion: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`pseudonym:v1:${docVersion}`)
    .update(userId)
    .digest('hex')
    .slice(0, 24)
}
