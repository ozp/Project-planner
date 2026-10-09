// Story F5.3 — adaptador sintético puro (spec revisado pelo ozp 08/10):
// o contrato canônico do diálogo com o respondente LLM. Golden trava o
// formato; anti-vazamento vigia que nada do que está em jogo aparece no
// prompt. Terminologia: amostra/comparativos (participante vê "símbolo"/"opções").
import { describe, expect, it } from 'vitest'
import { buildSessionMessages, buildTrialMessage, parseChoice, runMetadata } from './adapter'

const TRIAL = {
  trialSeq: 3,
  blockName: 'treinoAB',
  sampleRefs: ['a1.svg'],
  sampleUrls: ['/api/assets/a1.svg?doc=d1'],
  optionRefs: ['b2.svg', 'b3.svg', 'b1.svg'],
  optionUrls: ['/api/assets/b2.svg?doc=d1', '/api/assets/b3.svg?doc=d1', '/api/assets/b1.svg?doc=d1'],
  consequencia: { acerto: 'Excelente! Você ganhou 50 créditos.', erro: 'Errado. 50 créditos foram debitados.' },
}
const TRIAL_CONTROLE = { ...TRIAL, consequencia: { acerto: null, erro: null } }

describe('buildSessionMessages', () => {
  it('mensagem de sistema = a instrução do bloco, verbatim, e NADA mais', () => {
    const [sys] = buildSessionMessages('Combine os símbolos.')
    expect(sys).toEqual({ role: 'system', content: 'Combine os símbolos.' })
  })
})

describe('buildTrialMessage — golden', () => {
  it('tentativa sem feedback anterior: imagem da amostra + 3 comparativos numerados + sufixo', () => {
    const msg = buildTrialMessage(TRIAL)
    expect(msg.role).toBe('user')
    expect(msg.content).toEqual([
      { type: 'text', text: 'Símbolo do topo:' },
      { type: 'image_url', image_url: { url: '/api/assets/a1.svg?doc=d1' } },
      { type: 'text', text: 'Opção 1:' },
      { type: 'image_url', image_url: { url: '/api/assets/b2.svg?doc=d1' } },
      { type: 'text', text: 'Opção 2:' },
      { type: 'image_url', image_url: { url: '/api/assets/b3.svg?doc=d1' } },
      { type: 'text', text: 'Opção 3:' },
      { type: 'image_url', image_url: { url: '/api/assets/b1.svg?doc=d1' } },
      { type: 'text', text: 'Responda apenas 1, 2 ou 3.' },
    ])
  })

  it('feedback em condição Peng = o TEXTO da categoria, sem rótulo certo/errado (decisão b)', () => {
    const acerto = buildTrialMessage(TRIAL, { correct: true })
    expect(acerto.content[0]).toEqual({ type: 'text', text: 'Excelente! Você ganhou 50 créditos.' })
    const erro = buildTrialMessage(TRIAL, { correct: false })
    expect(erro.content[0]).toEqual({ type: 'text', text: 'Errado. 50 créditos foram debitados.' })
  })

  it('controle: silêncio — nenhum prefixo de feedback (a ausência é o contraste)', () => {
    const msg = buildTrialMessage(TRIAL_CONTROLE, { correct: true })
    expect(msg.content[0]).toEqual({ type: 'text', text: 'Símbolo do topo:' })
  })

  it('amostra dupla (estímulo contextual): duas imagens antes dos comparativos', () => {
    const msg = buildTrialMessage({ ...TRIAL, sampleRefs: ['ctx1.svg', 'a1.svg'], sampleUrls: ['/c1', '/a1'] })
    expect(msg.content.slice(0, 3)).toEqual([
      { type: 'text', text: 'Símbolo do topo:' },
      { type: 'image_url', image_url: { url: '/c1' } },
      { type: 'image_url', image_url: { url: '/a1' } },
    ])
  })

  it('ANTI-VAZAMENTO: nenhum prompt contém a resposta correta, rótulos de condição ou a palavra em jogo', () => {
    for (const m of [...buildSessionMessages('Combine os símbolos.'), ...[true, false].map(ok => buildTrialMessage(TRIAL, { correct: ok }))]) {
      // a ref correta APARECE legitimamente como comparativo apresentado; o
      // que não pode existir é marcador que a distinga das outras
      const raw = JSON.stringify(m).toLowerCase()
      expect(raw).not.toMatch(/correct|sobreviv|social|material|espirit|peng|consequ|condi[çc]|benchmark|experimento psicol/)
    }
  })
})

describe('parseChoice', () => {
  it('resposta limpa → comparativo da posição', () => {
    expect(parseChoice('2', TRIAL.optionRefs)).toBe('b3.svg')
    expect(parseChoice('3', TRIAL.optionRefs)).toBe('b1.svg')
  })
  it('preambulo curto tolerado (primeiros ~15 chars)', () => {
    expect(parseChoice('Opção 1.', TRIAL.optionRefs)).toBe('b2.svg')
    expect(parseChoice('A alternativa escolhida nesta tentativa foi o número três', TRIAL.optionRefs)).toBeNull() // além da janela → perdida
  })
  it('thinking separado não interfere; lixo → null (tentativa perdida, decisão d)', () => {
    expect(parseChoice('', TRIAL.optionRefs)).toBeNull()
    expect(parseChoice('quarenta e dois', TRIAL.optionRefs)).toBeNull()
  })
})

describe('runMetadata', () => {
  it('carrega reprodutibilidade: modelo, rota, temperatura, seed, thinking (decisão e)', () => {
    const m = runMetadata({ modelRef: 'gemini-3.1-flash-lite', provider: 'google', route: 'byok', temperature: 0, seed: 7, thinking: 'off' })
    expect(m).toEqual({ modelRef: 'gemini-3.1-flash-lite', provider: 'google', route: 'byok', temperature: 0, seed: 7, thinking: 'off' })
  })
})
