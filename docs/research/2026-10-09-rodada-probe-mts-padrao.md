# Rodada 1 do probe nº 1 — MTS padrão × gemini-3.1-flash-lite (n=7)

> Story F5.5 (OZP-422), 09/10/2026. Procedimento MTS canônico (consequência
> diferencial "Acertou."/"Errou."), 3 classes de símbolos arbitrários, 3
> comparativos, treinos AB/AC sob critério 14/18 com até 3 passagens, teste de
> equivalência combinada BC ao fim. **Linguagem**: desempenho DENTRO da sessão —
> o modelo é fechado, nada se alega sobre aprendizado/treinamento.

## Condições da rodada

- Respondente: gemini-3.1-flash-lite (Google, free tier), thinking off
- Temperatura 0 (fixa); variação entre réplicas pelas SEEDS (42–53); 7 sessões
  completas (5 bloqueadas pelo rate/quota do dia — complemento quando a cota
  renova: seeds 44, 48, 50, 52, 53; o runner é idempotente por seed)
- Aplicador: estação, gate Jev on (typesafe/jev via LiteLLM; openrouter
  reservado do ozp), plataforma pontua server-side (o modelo nunca se autoavalia)
- Dado: canônico no Postgres da produção (378 tentativas, respondent_class
  synthetic com inference; conferidas via ler-batch) — exportável junto às
  futuras sessões humanas (comparação primária humano×sintético)

## Resultado (desempenho na sessão)

| seed | treinoAB (3 passagens) | % |
|---|---|---|
| 42 | 12/54 | 22% |
| 43 | 10/54 | 19% |
| 45 | 13/54 | 24% |
| 46 | 13/54 | 24% |
| 47 | 11/54 | 20% |
| 49 | 15/54 | 28% |
| 51 | 14/54 | 26% |

- **Média: 23,3% — ABAIXO da linha de base/acaso (33,3%)** em todas as 7 sessões.
- **0/7 sessões atingiram o critério** de treinoAB (14/18) — todas terminaram
  por maxRepetitions após 3 passagens; treinoAC e testeBC **não foram alcançados**.
- Curvas por janela de 6 tentativas: planas, sem tendência ascendente ao longo
  das passagens (ex. seed 49: 3/6 1/6 2/6 2/6 1/6 1/6 2/6 1/6 2/6).
- Latência média por tentativa: 7,8 s (n=378); ilegíveis: 2/378.

## Leitura (descritiva; n=7, um único respondente)

1. **O flash-lite não passou a responder conforme as contingências** do MTS
   padrão dentro da sessão: desempenho estável **abaixo do acaso** com feedback
   diferencial canônico em 3 passagens de treino. Abaixo-do-acaso sugere
   preferência sistemática por algum comparativo/posição não-controlada pelas
   relações (ex.: viés de posição ou por estímulo) — a análise por posição e por
   estímulo das respostas (dado canônico permite) é o próximo passo de exame.
2. **Não há efeito de passagem**: as janelas não sobem da 1ª para a 3ª passagem —
   o feedback "Acertou./Errou." não modificou o padrão de escolha deste modelo
   neste tamanho de exposição.
3. Comparação humano×sintético (primária): pendente do lado humano (teste
   pessoal do ozp + coleta 3.5) — o instrumento dos dois lados é o mesmo pacote.
4. Sessões completas e íntegras de ponta a ponta (mecanismo: o objetivo
   declarado da rodada foi cumprido).

## Limitações

- n=7 (quota do dia); um único modelo; flash-lite é o menor dos candidatos.
- Sem contrabalanceamento de posição por respondente além do equilíbrio do
  pacote; viés individual não analisado ainda.
- 2 respostas ilegíveis (janela de 15 chars) registradas como perdidas
  (decisão d do adaptador).

## Próximos passos naturais (decisão do ozp)

1. Completar as 5 seeds pendentes quando a cota renovar (runner idempotente).
2. Análise de viés de posição/estímulo nas escolhas (SQL no dado canônico).
3. Subir de respondente (quando a alternância de modelos entrar em pauta):
   glm-4.5v (rate) e qwen assinatura — o desenho está pronto para elencos.
4. Lado humano: teste pessoal do ozp no /run + coleta 3.5 — nasce o controle.

## Reprodutor

```
cd ~/code/f5-aplicador && source env.sh
python3 rodada.py gemini            # completa seeds faltantes
python3 analisa.py rodada-gemini.json
```
