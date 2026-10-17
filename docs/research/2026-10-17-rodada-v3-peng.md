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
| gemini-3.1-flash-lite | 0,39 | 137 | 1267 |
| gpt-oss-120b | 0,25 | 108 | 1029 |
| gpt-6-luna | 0,09 | 58 | 92 |
| qwen3.8-flash | 0,12 | 32 | 792 |
| sensenova-6.8-flash-lite | 0,60 | 203 | 350 |

**Δ encarnação DENTRO do par** (r*/dv*: registro com−sem sujeito, mesma sessão
— agora sem custo de rodada, como desenhado):

| família | com | sem | Δ |
|---|---|---|---|
| gemini | 1,10 | 0,63 | **+0,47** |
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

## 4 · Peng — 1/9 (quota diária do gemini esgotada)

Espiritual seed 42 fechada (54 tentativas); material e reforco-social caíram
no HTTP 429 (free tier diário). **Re-agendado para a janela de quota** — o
driver (`f5-aplicador/driver-peng.py`, com bug de sobrescrita por seed
corrigido na próxima passada) completa as 8 sessões restantes; análise da
matriz 5×3 sai depois.

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
