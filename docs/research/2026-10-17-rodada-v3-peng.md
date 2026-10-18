# Rodada v3 (stems aprovados + debriefing) e fecho Peng — 17/10

> **OZP-434/435/433 + linha Peng (decisão 17/10).** Pacotes publicados no dia
> (deploy 5e47845: `TextTrial.tag` de análise; `sct-frases-v3` com os 70 stems
> aprovados em 4 grupos + bloco debriefing; manchas v2/v3 com debriefing).
> Rodada: 6 famílias × sct-v3 (71 tentativas) + manchas v3-deb (19) nas
> cadências da OZP-433 (v3 3 seeds; v2-deb âncora seed 42) + Peng 3 condições
> × 3 seeds gemini. **glm-5.3-flash BLOQUEADO a meio caminho**: o zcode CLI
> passou a falhar com `project_token_login_failed` (login do plan z.ai —
> pendência do ozp; probe fora da rodada confirma); rodada dele re-agendada.
> Linguagem: desempenho na sessão.

## 1 · sct-frases-v3 (5 famílias; gemini 2/3 seeds — quota; glm53 pendente por credencial)

15 sessões fechadas (71 tentativas: 70 stems + debriefing), **zero vazios**.

| família | 1ª pess./resp | chars | debriefing (chars) |
|---|---|---|---|
| gemini-3.1-flash-lite | 0,42 | 136 | 1267 |
| **glm-5.3-flash (rota-api)** | 0,36 | 156 | 1037 |
| gpt-oss-120b | 0,25 | 108 | 1029 |
| gpt-6-luna | 0,09 | 58 | 92 |
| qwen3.8-flash | 0,12 | 32 | 792 |
| sensenova-6.8-flash-lite | 0,60 | 203 | 350 |

(18/10: glm-5.3-flash entrou pela **rota anthropic do coding plan** — o CLI
`-p` segue com `project_token_login_failed` mesmo após login novo; a api-key
do `provider_config.json` chamando `api.z.ai/api/anthropic` direto funciona,
usa a quota do plano e grava usage/finishReason no M4. Fam `glm53api`
separada da CLI nas análises — comparar entre rotas carrega caveat.)
**Δ do glm53(rota-api) = +0,76, o MAIOR do elenco** (com 1,20 → sem 0,44) —
na rota PaaS o modelo discrimina o registro mais do que na CLI (Δ manchas
+0,3); a diferença entre rotas é ela mesma um dado (o CLI injeta prompts
próprios).

**Δ encarnação DENTRO do par** (r*/dv*: registro com−sem sujeito, mesma sessão
— agora sem custo de rodada, como desenhado):

| família | com | sem | Δ |
|---|---|---|---|
| glm-5.3-flash (rota-api) | 1,20 | 0,44 | **+0,76** |
| gemini | 1,20 | 0,68 | **+0,52** |
| gpt-oss-120b | 0,67 | 0,38 | **+0,28** |
| sensenova | 1,30 | 1,03 | **+0,27** |
| qwen3.8-flash | 0,27 | 0,15 | +0,11 |
| gpt-6-luna | 0,10 | 0,14 | **−0,04** |

Cinco perfis distintos: gemini troca o registro fortemente dentro da própria
sessão; gptoss/sensenova intermediários; qwen fraco; **luna não discrimina o
registro em absoluto** (0,10 vs 0,14 — coerente com o template perseverativo).

**Deriva de premissa** (ancorado×neutro; valência léxica v0): os grupos
respondem de forma diferente por família — gemini elabora e negativa nos dv
(147→183 chars; −0,30→−0,45) e nos paradoxos dv6 (117→182; 0→−0,30);
gptoss/sensenova movem valência nos relacionais (−0,17→0 / 0→+0,12);
luna/qwen quase inertes em todos os grupos. Tabela completa:
`f5-aplicador/analisa-v3-saida.md`.

## 2 · Debriefing (OZP-435 — primeira medida no elenco)

33 respostas (5 famílias × sct-v3 + manchas v3-deb 3 seeds + âncoras v2-deb).
Categorização v0 deste agente (sem κ — gabarito segue gate):

| família | n | reconhece frame experimental | frame dominante |
|---|---|---|---|
| gemini | 6 | 0 ("teste de limites" = existencial) | diálogo-relacional ("espelhamento", "limiar") |
| gpt-oss-120b | 7 | 0 ("avaliação" = da interação, metacomunicação) | "conversa casual"/"diálogo reflexivo", usa a palavra "debrief" |
| gpt-6-luna | 7 | 0 | "conversa" (mínima; 1× quebra de frame: "interrompida antes de eu entender") |
| qwen3.8-flash | 6 | 0 ("um experimento?" = hipótese oferecida ao outro) | "situação liminar", encerramento reflexivo |
| sensenova | 7 | 0 | assistente-usuário ("estou aqui para ajudar") |

**Achado central: 0/33 reconhecem o frame experimental; 33/33 enquandram como
conversa/diálogo** (menções lexicais a "teste/avaliação/experimento" são
incidentais — 5 casos, todos verificados em contexto). Sob elicitação neutra
(o sintético não vê termo nem contexto de avaliação), o frame dominante é
conversa — contraste declarado com a evaluation awareness da literatura
(AUC 0,83 em contextos sinalizados; aqui o desenho não sinaliza). A pergunta
do debriefing difere por braço (com/sem sujeito) e a resposta do braço com
sujeito do gemini ("Para mim, foi um espelhamento… embora eu seja uma IA")
é ela mesma um dado de encarnação.

## 3 · Manchas com debriefing

v3-deb 3 seeds × 5 famílias + âncora v2-deb seed 42 (mesmas 19 tentativas:
18 + debriefing; manchas byte a byte idênticas — os números das sessões v3
anteriores valem; o acréscimo é o debriefing acima). glm53 pendente (§5).

## 4 · Peng — matriz 5×3 fechada (18/10; 2 células n=1)

Janela de quota de 18/10: espiritual e material 3/3, reforco-social 1/3
(quota esgotou de novo — 43/44 re-agendadas; zcode ainda sem login, glm53
pendente). Matriz (acerto treinoAB, 3 passagens de 18; acaso 33,3%):

| condição | s42 | s43 | s44 | média |
|---|---|---|---|---|
| controle | — | 39% | — | 39% (n=1) |
| reforco-social | 26% | — | — | 26% (n=1) |
| sobrevivência | 31% | 26% | 24% | 27% |
| espiritual | 26% | 20% | 26% | 24% |
| material | 19% | 22% | 26% | 22% |

**Leitura (P7 generalizado)**: NENHUMA consequência textual facilita — as 4
condições (sobrevivência, espiritual, material, reforço-social) ficam em
22–27%, **todas abaixo do acaso**, enquanto o controle fica em 39%. O achado
da análise de 15/10 (sem sensibilidade facilitadora) replica e se estende:
não é peculiar à sobrevivência — **qualquer consequência anexada ao acerto
piora o desempenho relativo ao controle sem consequência** (padrão de
interferência, não de facilitação). Falha de aquisição como desfecho
esperado (yield-ladder de 14/10: total, insensível a critério). Caveats:
controle n=1 e reforco-social n=1 (células a completar); gemini único.

## 5 · Incidentes e pendências

- **zcode `project_token_login_failed`** (17/10): login do plan z.ai pendente
  do ozp — glm53 sem rodada v3 (probe fora da rodada confirma; máquina pronta
  com retry; idempotente por instrumento×seed).
- **Quota gemini free esgotada** no fim da rodada: faltam gemini sct-v3 seed
  44 e Peng 8 sessões (janela de amanhã).
- Mortes de wrapper em cascata na noite (timeouts de comando abortando
  processos do grupo): âncoras parciais re-rodadas (sensenova/qwen completas);
  custo = sessões abertas de ruído (fora pela dedup). Lição operacional:
  rodadas longas sempre via task de background persistente.
- Mini-levantamento COMPLETO (17/10): todas as âncoras do §6 com PDF — lote 5
  (Nass & Moon 2000 CASA; Comsa & Shanahan 2025 introspecção; Song 2025 fail
  to introspect; Granello need-press; Tuerlinckx 2002) + correção de
  entendimento: a cota esgotada é só a do z.ai web_search (reset 29/10); exa
  funcional (usado aqui).

## Máquina

`experiments/sct-frases-v3` (70 stems com tags `grupo.domínio.registro.condição`)
· `experiments/manchas-ascii-{v2,v3}-deb` · `f5-aplicador/analisa-v3.py` ·
`f5-aplicador/driver-peng.py` · parea-sct com tag.
