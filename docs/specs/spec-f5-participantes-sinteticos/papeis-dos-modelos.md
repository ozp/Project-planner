# Papéis dos modelos no projeto (mapa)

> Companion do SPEC-F5. Responde à pergunta do ozp (07/10): "os modelos poderiam gerenciar
> os experimentos, responder perguntas sobre resultados, explicar funcionamentos e
> eventualmente participar da experimentação como um gerente". **Sim — são três papéis
> distintos, cada um com fase própria.** Este mapa previne confusão de escopo downstream.

| Papel | O que faz | Fase | Estado (07/10) | Onde vive |
|---|---|---|---|---|
| **Gerente/operador** | Opera a plataforma por tools: cria experimentos, lista, lê resultados, re-emite com parâmetros — sob gate Jev que aprova/bloqueia cada ação | **Fase C** | ✅ entregue (OZP-414): 4 tools em `/api/service/*`, verificadas em produção | Harness agno (estação hoje; labs depois) FORA da plataforma; modelos: qwen3.5:2b (executor), spark:4b (parecer), Jev (gate) |
| **Assistente do pesquisador** | Conversa com o pesquisador: monta experimentos, responde perguntas sobre resultados, explica funcionamentos | **F3** | ⬜ não construído (decisão ozp 03/10 §7b do 03a; SSE + gateway) | Chat na plataforma, via gateway LiteLLM |
| **Participante sintético** | **É o respondente**: recebe as tentativas do experimento e responde, como um participante humano faria | **F5** | 🔵 este SPEC (runner não existe; contrato pronto) | **Modelos EXTERNOS ao ambiente** (alvo do benchmark), chamados pelos gerentes locais — decisão do ozp 07/10. Adapter puro em `core/adapters/synthetic`; orquestração no harness local |

## Fronteiras que importam

- **O dado científico nunca passa por LLM**: o gerente só opera metadados/CRUD; o
  participante responde (e sua resposta é dado de pesquisa, não infraestrutura); o
  assistente lê e explica, mas a pontuação de acerto é sempre identidade no core.
  Nada de LLM no caminho de validação/ingestão/export.
- **Gerente ≠ participante**: o mesmo modelo pode exercer os dois papéis em momentos
  distintos, mas são sessões e contratos diferentes (tool-call de serviço vs. TrialResult
  sintético). Nunca na mesma execução.
- **Jev governa agência, não dado**: o gate Jev aplica-se às ações do gerente (Fase C
  e, por extensão, às sessões F5 gerenciadas localmente). O caminho do dado dentro da
  plataforma permanece determinístico, sem gate no loop.
- **Quem responde ≠ quem gerencia (decisão do ozp 07/10)**: os que passam pelos
  experimentos são LLMs externos (com chaves suas, BYOK); os modelos locais
  (qwen/spark, sob gate Jev) aplicam os prompts e coletam as respostas, entregando o
  dado canônico à plataforma pela API de serviço.
- **Linguagem de mercado da pesquisa**: no benchmark F5, o participante sintético é o
  "modelo-sujeito" (machine psychology); o gerente é orquestração; o assistente é copiloto.
