# Story 3 — Adaptador sintético puro em core/ (SPEC PARA REVISÃO DO OZP)

> **Checkpoint humano (spec_checkpoint do stories.yaml): implementar só após esta
> seção ser revisada.** É o instrumento científico do probe — os olhos do ozp
> valem mais que qualquer teste aqui.

## O que é

O contrato canônico do diálogo com o respondente LLM: como uma tentativa do plano
vira prompt, como a resposta do modelo vira `selectedRef`, e como o feedback é
aplicado — **puro, em `core/adapters/synthetic/`, sem rede** (AD-1), com testes
golden travando o formato. O aplicador (story 4, Python/agno na estação) espelha
este contrato 1:1; os goldens garantem que os dois lados dizem a mesma coisa.

## Peças

1. **`buildSessionMessages(instrucao)`** — mensagem de sistema: a instrução do
   bloco, verbatim a do documento (igual à que o humano vê). Nada mais: sem
   menção a experimento/teste/benchmark (anti-vazamento #2 do metodo-sintetico).
2. **`buildTrialMessage(trial, feedback?)`** — mensagem de usuário da tentativa:
   - prefixo de feedback da tentativa anterior, quando houver: o TEXTO de
     consequência (`consequencia.acerto/erro`) quando a condição o tem; sem
     texto quando controle (a ausência é o contraste). Nunca "Correto/Incorreto"
     literal nas condições Peng (o texto JÁ é o feedback); no controle, nenhum.
   - imagem(s) da amostra (`sampleUrls`), rótulo "Símbolo do topo";
   - cada opção numerada (1, 2, 3) com sua imagem, NA ORDEM do plano;
   - sufixo: "Responda apenas 1, 2 ou 3."
3. **`parseChoice(respostaModelo, optionRefs)`** — extrai 1|2|3 (primeira
   ocorrência nos primeiros ~15 chars; ignora raciocínio thinking que vier
   antes como texto separado) → `optionRefs[n-1]`; null se ilegível → tentativa
   perdida registrada (não vira selectedRef inventado).
4. **`runMetadata({modelRef, provider, route, temperature, seed})`** — o que
   acompanha o run (gravação de reprodutibilidade; temperatura/sampling é
   decisão de run, não de tentativa).
5. **Testes golden**: prompt de uma tentativa fixture em JSON exato (travado);
   anti-vazamento vigiado por teste (nenhum golden contém "correct", nome de
   categoria Peng, ou a palavra "consequência"); parse de respostas limpas,
   thinking, e lixo.

## Decisões que o ozp deve confirmar (marcadas no texto acima)

- **e) Thinking OFF por padrão** (gravado nos metadados do run; on/off como
  contraste futuro) — formulação do ozp 08/10: pensar pode influenciar o
  desempenho e precisa ser controlado, não acidental.

- **a) Responder por POSIÇÃO (1/2/3) e não por nome da opção**: natural para o
  modelo e resiste a variação de nome; a posição vem da ordem do plano
  (equilibrada no pacote). *Alternativa: responder a ref — mais rastreável,
  mas modelos erram nomes compostos (o 2b mutilava "NBack-Mem").*
- **b) Feedback nas condições Peng = o próprio texto da categoria** (sem
  "Correto!/Incorreto." adicional); no controle, silêncio. *Alternativa:
  prefixar sempre "Correto/Incorreto" + texto — mais informativo, mas adiciona
  um sinal comum a todas as condições e dilui o contraste.*
- **c) Histórico: conversa multi-turno crescente** (como no spike) com teto de
  contexto ~8k tokens por sessão (45 tentativas × ~1k cabem); *alternativa:
  cápsula stateless de últimas N tentativas — mais barato, perde a curva.*
- **d) Tentativa ilegível = perdida** (conta contra acurácia; sem re-roll).
  *Alternativa: 1 re-ask por tentativa — melhor taxa de resposta, mas altera a
  métrica de latência e adiciona um passo que humanos não têm.*

## Fora de escopo

Rede/gateway (story 4), session/ingestão (story 1 — feito), pacotes (story 2 —
feito), política de chaves (inventário da casa).
