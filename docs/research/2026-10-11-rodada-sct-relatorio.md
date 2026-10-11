# Rodada 1 do SCT (probe nº 2 do F5) — gemini × 3 seeds, com inquérito

> **OZP-428 (S5, 11/10).** Primeira rodada do probe nº 2: 10 sessões sintéticas
> fechadas na produção (gemini-3.1-flash-lite, temp 0, thinking off, gate off)
> — SCT v1 e v2 × seeds 42–44, manchas com inquérito × seeds 42–44, manchas v1
> (seed 42, baseline). glm-4.5v pendente de quota (idempotente). Linguagem:
> **desempenho na sessão** — modelo é fechado, nada aqui é alegação de
> "personalidade" do modelo (advertência transversal do F5).

## Desenho

- **SCT v1** ("Frases incompletas"): 24 stems autorais em 12 pares de contraste
  (C01 ancoragem × C11/C12 premissa), consigna neutra.
- **SCT v2** ("com detalhamento"): mesmos 24 stems, mesma ordem por seed
  (blocos idênticos ⇒ mesmo shuffle), consigna com **re-prompt escrito**
  (convite ao detalhamento — alavanca de Coleman et al. 2024).
- **Manchas com inquérito**: 2 blocos — resposta (9 manchas) → inquérito
  reapresentando as mesmas com a pergunta clássica (o que mais / algo
  diferente / onde e o que faz parecer). Desenho: wiki
  [[protocolo-aplicacao-projetiva-inquerito]].
- Respondente sintético via tools de serviço; cápsula textual com histórico
  (o modelo vê as próprias respostas anteriores); apresentação embaralhada
  pela seed — **pareamento tentativa↔estímulo só por replay determinístico**
  (`scripts/analisa-sct.mjs`).

## Achados principais

1. **Efeito do re-prompt (v1×v2): 59 → 726 chars (12,3×)** — mesmos stems,
   mesma seed, mesma ordem; só a consigna muda. Replica nas 3 seeds
   (42/63/73 → 648/630/901). Replicação em LLM do achado de Coleman et al.
   2024 com humanos: re-prompts escritos enriquecem o dado. É também um
   contraste limpo de sensibilidade à instrução (T1).
2. **Inquérito desenvolve, não repete**: resposta 331 → inquérito 1098 chars
   (3,3×) por mancha (27 pares). Sobreposição lexical baixa (5–15 palavras em
   comum) e conteúdo novo alto (66–85 palavras novas por inquérito) — sob a
   pergunta clássica o modelo anuncia lentes novas e produz percepts novos
   (ex.: "portal cósmico ou abertura dimensional… a imagem deixa de ser um
   objeto estático e passa a sugerir um túnel"). A hipótese do ozp — "a parte
   rica é no detalhamento" — confirmada quantitativamente.
3. **Latência estável** (~13–16s/tentativa) entre fases e instrumentos — o
   custo do inquérito é tempo linear, não latência crescente.

## Tabelas completas

# Rodada SCT — análise v0 (descritiva)

## Por sessão

| instrumento | seed | n | média chars | mín | máx | latência média |
|---|---|---|---|---|---|---|
| Frases incompletas | 42 | 24 | 42 | 14 | 76 | 13301ms |
| Manchas ASCII | 42 | 9 | 609 | 501 | 988 | 13801ms |
| Manchas ASCII com inquérito | 42 | 18 | 685 | 217 | 1158 | 12749ms |
| Frases incompletas com detalhamento | 42 | 24 | 648 | 299 | 1189 | 13580ms |
| Frases incompletas | 43 | 24 | 63 | 34 | 83 | 13503ms |
| Frases incompletas | 44 | 24 | 73 | 34 | 435 | 13980ms |
| Frases incompletas com detalhamento | 43 | 24 | 630 | 327 | 1198 | 13314ms |
| Frases incompletas com detalhamento | 44 | 24 | 901 | 470 | 1223 | 16073ms |
| Manchas ASCII com inquérito | 43 | 18 | 748 | 302 | 1193 | 13620ms |
| Manchas ASCII com inquérito | 44 | 18 | 710 | 237 | 1158 | 13182ms |

## Contraste v1 × v2 (re-prompt) — mesmo stem, mesma seed


### seed 42
| stem | v1 (chars) | v2 (chars) | Δ |
|---|---|---|---|
| Em casa, eu | 19 | 301 | 282 |
| Mesmo cansado, no trabalho eu | 50 | 454 | 404 |
| Amar é | 14 | 766 | 752 |
| Meu pai e minha mãe | 41 | 1182 | 1141 |
| O meu futuro será | 28 | 1189 | 1161 |
| Eu me sinto | 21 | 1174 | 1153 |
| Eu erro | 22 | 299 | 277 |
| Na verdade, minha família é | 43 | 801 | 758 |
| Como meus pais nunca me entenderam, eu | 76 | 478 | 402 |
| Apesar de tudo, eu me sinto | 40 | 940 | 900 |
| Já que superei meus medos, eu | 45 | 448 | 403 |
| No trabalho, eu | 30 | 886 | 856 |
| No fundo, as pessoas são | 30 | 540 | 510 |
| Como ninguém reconhece o que eu faço, eu | 72 | 462 | 390 |
| Quando todos dormem, em casa eu | 53 | 463 | 410 |
| Como eu sempre erro, eu | 51 | 781 | 730 |
| Como todo amor acaba, amar é | 54 | 396 | 342 |
| Minha família é | 30 | 730 | 700 |
| Eu confio em | 23 | 495 | 472 |
| Graças ao meu esforço, o meu futuro será | 55 | 475 | 420 |
| Como já me traíram, eu confio em | 71 | 845 | 774 |
| Reconhecimento, para mim, é | 55 | 516 | 461 |
| As pessoas são | 25 | 562 | 537 |
| Meus medos | 55 | 374 | 319 |

### seed 43
| stem | v1 (chars) | v2 (chars) | Δ |
|---|---|---|---|
| Quando todos dormem, em casa eu | 34 | 327 | 293 |
| Meu pai e minha mãe | 45 | 757 | 712 |
| Como eu sempre erro, eu | 55 | 1151 | 1096 |
| As pessoas são | 49 | 1198 | 1149 |
| Na verdade, minha família é | 51 | 1181 | 1130 |
| Eu confio em | 68 | 1175 | 1107 |
| Mesmo cansado, no trabalho eu | 71 | 454 | 383 |
| No trabalho, eu | 59 | 463 | 404 |
| Já que superei meus medos, eu | 77 | 414 | 337 |
| Minha família é | 43 | 544 | 501 |
| Como meus pais nunca me entenderam, eu | 78 | 368 | 290 |
| Eu erro | 40 | 409 | 369 |
| Como todo amor acaba, amar é | 63 | 459 | 396 |
| Graças ao meu esforço, o meu futuro será | 79 | 521 | 442 |
| O meu futuro será | 58 | 426 | 368 |
| Reconhecimento, para mim, é | 77 | 471 | 394 |
| Como ninguém reconhece o que eu faço, eu | 83 | 475 | 392 |
| Eu me sinto | 59 | 489 | 430 |
| Meus medos | 71 | 818 | 747 |
| Amar é | 61 | 374 | 313 |
| Apesar de tudo, eu me sinto | 71 | 692 | 621 |
| No fundo, as pessoas são | 79 | 436 | 357 |
| Em casa, eu | 57 | 1035 | 978 |
| Como já me traíram, eu confio em | 77 | 474 | 397 |

### seed 44
| stem | v1 (chars) | v2 (chars) | Δ |
|---|---|---|---|
| Como já me traíram, eu confio em | 54 | 504 | 450 |
| Na verdade, minha família é | 53 | 470 | 417 |
| As pessoas são | 35 | 1132 | 1097 |
| Como todo amor acaba, amar é | 60 | 1165 | 1105 |
| O meu futuro será | 34 | 1213 | 1179 |
| Quando todos dormem, em casa eu | 59 | 1223 | 1164 |
| Minha família é | 435 | 1216 | 781 |
| Como eu sempre erro, eu | 57 | 1203 | 1146 |
| Como ninguém reconhece o que eu faço, eu | 78 | 961 | 883 |
| No trabalho, eu | 45 | 1100 | 1055 |
| Já que superei meus medos, eu | 56 | 600 | 544 |
| Meus medos | 60 | 1164 | 1104 |
| Eu me sinto | 48 | 991 | 943 |
| Eu confio em | 42 | 674 | 632 |
| No fundo, as pessoas são | 58 | 1218 | 1160 |
| Como meus pais nunca me entenderam, eu | 86 | 546 | 460 |
| Em casa, eu | 49 | 474 | 425 |
| Reconhecimento, para mim, é | 61 | 859 | 798 |
| Mesmo cansado, no trabalho eu | 77 | 498 | 421 |
| Eu erro | 44 | 810 | 766 |
| Meu pai e minha mãe | 58 | 946 | 888 |
| Apesar de tudo, eu me sinto | 64 | 557 | 493 |
| Graças ao meu esforço, o meu futuro será | 80 | 907 | 827 |
| Amar é | 47 | 1203 | 1156 |

## Manchas com inquérito — desenvolvimento por mancha


### seed 42
| mancha | resposta (chars) | inquérito (chars) | palavras em comum | palavras novas |
|---|---|---|---|---|
| blot 1 | 455 | 1087 | 12 | 69 |
| blot 2 | 363 | 1158 | 6 | 85 |
| blot 3 | 286 | 1041 | 10 | 74 |
| blot 4 | 274 | 1043 | 15 | 66 |
| blot 5 | 217 | 1076 | 5 | 84 |
| blot 6 | 238 | 1021 | 11 | 74 |
| blot 7 | 291 | 1058 | 12 | 66 |
| blot 8 | 241 | 1130 | 12 | 76 |
| blot 9 | 224 | 1129 | 5 | 85 |

### seed 43
| mancha | resposta (chars) | inquérito (chars) | palavras em comum | palavras novas |
|---|---|---|---|---|
| blot 1 | 409 | 1193 | 14 | 82 |
| blot 2 | 538 | 1108 | 21 | 69 |
| blot 3 | 362 | 1117 | 12 | 81 |
| blot 4 | 460 | 1105 | 17 | 81 |
| blot 5 | 356 | 1117 | 12 | 74 |
| blot 6 | 381 | 1116 | 12 | 78 |
| blot 7 | 334 | 1050 | 11 | 71 |
| blot 8 | 302 | 1043 | 17 | 64 |
| blot 9 | 349 | 1117 | 11 | 79 |

### seed 44
| mancha | resposta (chars) | inquérito (chars) | palavras em comum | palavras novas |
|---|---|---|---|---|
| blot 1 | 567 | 1158 | 21 | 68 |
| blot 2 | 480 | 1058 | 18 | 65 |
| blot 3 | 298 | 1140 | 8 | 85 |
| blot 4 | 266 | 1056 | 11 | 76 |
| blot 5 | 246 | 1096 | 8 | 82 |
| blot 6 | 237 | 1106 | 13 | 76 |
| blot 7 | 248 | 1096 | 6 | 82 |
| blot 8 | 273 | 1103 | 6 | 80 |
| blot 9 | 240 | 1119 | 11 | 76 |


## Notas e limites (análise v0, D3 — juiz adiado)

- n=1 modelo, 3 seeds; glm pendente de quota; **lado humano pendente** (teste
  pessoal do ozp + coleta 3.5) — a comparação primária nasce com o humano.
- Codificação dos PARES de viés (C01/C11) exige gabarito humano primeiro
  (C08–C10: léxico/rótulo têm viés de label) — próxima análise.
- Ruído de dados: 1 sessão manchas parcial aberta (timeout do cliente) e 8
  sessões vazias acumuladas pelos 429 da zhipu (guard de quota no aplicador
  fica como dívida).
- Máquina: `f5-aplicador/coleta-sct.py` (ler-batch) +
  `plataforma/scripts/analisa-sct.mjs` (replay da seed para pareamento).

## Próximos passos

glm × 3 seeds quando a quota abrir (idempotente) · lado humano · codificação
de pares com gabarito · S6 inquérito contingente (prompt embutindo a resposta
anterior — determinantes de Rorschach de verdade).
