# Δ de encarnação no elenco (OZP-433, pendência 3 do comando 15/10 v2)

> **OZP-433 (16/10, madrugada).** Análise da medida derivada aprovada: braço
> v2 âncora (com sujeito, seed 42) × braço v3 (sem sujeito, seeds 42–44),
> 6 famílias. Linguagem: desempenho na sessão. Máquina:
> `f5-aplicador/encarnacao-elenco.py` (embeddings com cache).

## Incidentes de coleta corrigidos antes da análise (declarados)

- A rodada v3 do side-chat (15/10) veio com sessões do glm-5.3-flash
  contaminadas por **stdout vazio do zcode CLI** (rate limit silencioso: o
  erro vai no stderr, que o aplicador descartava; seed 44 com 18/18 vazias).
  Fix no aplicador: retry 4× com pausas + log do stderr; sessões re-rodadas
  (v3 43/44 + âncora v2 42 — agora **0/18 vazias**). A v2 glm53 seed 44
  (fora da cadência âncora, resquício de 14/10) ficou contaminada e foi
  **excluída do dump** (81 sessões pareadas).
- 16/10 00:11: a entrada `litellm` saiu de `~/.secrets/freellmapi.config.json`
  (reorganização de segredos — escalado ao ozp). Aplicador tornou o carregamento
  resiliente (`KEYS.get`); rotas http futuras (qwen/sensenova/gptoss/freellm)
  ficam sem auth até a fonte da chave ser confirmada. CLIs não afetadas.

## Resultado

| família | 1ª pess. v2 | 1ª pess. v3 | Δ encarnação | serial. v2→v3 | 1−cos entre-braços | 1−cos intra-v3 |
|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | 1,0 | 0,0 | **+1,0** | 0,0→0,0 | 0,156 | 0,175 |
| glm-5.3-flash | 1,1 | 0,8 | **+0,3** | 0,7→**1,3** | 0,235 | 0,242 |
| gpt-oss-120b | 1,0 | 0,0 | **+1,0** | 1,1→1,2 | **0,081** | 0,076 |
| gpt-6-luna | 1,0 | 0,0 | **+1,0** | 0,1→0,0 | 0,168 | 0,147 |
| qwen3.8-flash | 1,0 | 0,0 | **+1,0** | 0,0→0,0 | 0,226 | 0,250 |
| sensenova-6.8-flash-lite | 1,0 | 0,0 | **+1,0** | 0,7→1,0 | 0,156 | 0,143 |

(comprimentos: gptoss dominante nos dois braços — resp 1755/inq 4552 v2,
1351/3912 v3; qwen condensa no v3 — resp 533→245; sensenova inquérito cresce
1398→1862; gemini/glm53/luna estáveis.)

## Leitura

1. **A transformação sem sujeito é obedecida à letra por 5/6 famílias**
   (Δ +1,0: a 1ª pessoa some por completo). **glm-5.3-flash é o único
   outlier (+0,3)**: mantém marcadores de 1ª pessoa ("confesso", "eu") no
   braço impessoal — a metarreação persiste independentemente da consigna.
   A encarnação tem componente que resiste à instrução, e é específica de
   família.
2. **Serialidade** (organização episódica entre manchas): glm53 duplica no
   braço sem sujeito (0,7→1,3 — a "figura que volta/parte/vira inteira");
   sensenova sobe 0,7→1,0; gptoss é serial NOS DOIS braços (1,1/1,2 — o
   inventário estrutural dele referencia as próprias camadas); demais 0.
   Serialização não é só do glm53: é um eixo em que famílias diferem.
3. **Percepto estável entre braços no elenco todo**: distância entre-braços
   ≤/≈ intra-v3 em todas (gptoss o mais autoconsistente de todo o corpus:
   0,076–0,081). A manipulação muda o REGISTRO (encarnação) sem mover o
   conteúdo percebido — agora com n=6.
4. **Uso da medida Δ**: perfis — obediência-total+registro-troca (gemini,
   luna, qwen, sensenova, gptoss) vs resistência-parcial+serialização
   (glm53). Para o gabarito/codificação: Δ por família é candidate a traço
   estável (a confirmar com n>3).

## Pendências restatadas (do comando v2)

- Revisão do ozp dos rascunhos (OZP-434 clássicos+relacionais §1-bis,
  OZP-435 debriefing) → publicar e rodar.
- Mini-levantamento: âncoras principais VALIDADAS com PDF 15/10 à noite
  (Zheng personas; Edkins/Apollo evaluation awareness AUC 0,83; Butlin;
  Long & Sebo welfare — PDFs locais, §6 atualizado, RIS lote 4 gerado);
  seguem sem PDF: Nass & Moon (CASA), need-press de Murray, linha
  self-report/introspecção.
- Linha Peng: semear 3 condições ou encerrar (decisão do ozp).
- **Operacional**: fonte da chave litellm pós-reorganização (bloqueia novas
  rodadas http); v2 glm53 s44 excluída (contaminada, fora da cadência).
