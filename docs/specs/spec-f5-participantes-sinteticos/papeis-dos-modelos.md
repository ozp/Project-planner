# Papéis dos modelos no projeto (mapa)

> Companion do SPEC-F5. Responde à pergunta do ozp (07/10): "os modelos poderiam gerenciar
> os experimentos, responder perguntas sobre resultados, explicar funcionamentos e
> eventualmente participar da experimentação como um gerente". **Sim — são três papéis
> distintos, cada um com fase própria.** Este mapa previne confusão de escopo downstream.

| Papel | O que faz | Fase | Estado (07/10) | Onde vive |
|---|---|---|---|---|
| **Gerente/operador** | Opera a plataforma por tools: cria experimentos, lista, lê resultados, re-emite com parâmetros — sob gate Jev que aprova/bloqueia cada ação | **Fase C** | ✅ entregue (OZP-414): 4 tools em `/api/service/*`, verificadas em produção | Harness agno (estação hoje; labs depois) FORA da plataforma; modelos: qwen3.5:2b (executor), spark:4b (parecer), Jev (gate) |
| **Assistente do pesquisador** | Conversa com o pesquisador: monta experimentos, responde perguntas sobre resultados, explica funcionamentos | **F3** | ⬜ não construído (decisão ozp 03/10 §7b do 03a; SSE + gateway) | Chat na plataforma, via gateway LiteLLM |
| **Participante sintético** | **É o respondente**: recebe as tentativas do experimento e responde, como um participante humano faria | **F5** | 🔵 este SPEC (runner não existe; contrato pronto) | Runner determinístico (`server/jobs` + `core/adapters/synthetic`) DENTRO da plataforma |

## Fronteiras que importam

- **O dado científico nunca passa por LLM**: o gerente só opera metadados/CRUD; o
  participante responde (e sua resposta é dado de pesquisa, não infraestrutura); o
  assistente lê e explica, mas a pontuação de acerto é sempre identidade no core.
  Nada de LLM no caminho de validação/ingestão/export.
- **Gerente ≠ participante**: o mesmo modelo pode exercer os dois papéis em momentos
  distintos, mas são sessões e contratos diferentes (tool-call de serviço vs. TrialResult
  sintético). Nunca na mesma execução.
- **Jev governa agência, não dado**: o gate Jev aplica-se às ações do gerente (Fase C).
  O runner do F5 é pipeline determinístico — sem gate cognitivo no loop.
- **Linguagem de mercado da pesquisa**: no benchmark F5, o participante sintético é o
  "modelo-sujeito" (machine psychology); o gerente é orquestração; o assistente é copiloto.
