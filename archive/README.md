# Arquivo de projetos descomissionados

Projetos removidos da fila ativa em **2026-10-03**. As especificações são preservadas
aqui para referência histórica; nenhum deles está em desenvolvimento.

| Projeto | Motivo do descomissionamento |
|---------|------------------------------|
| [01-desktop-mcp.md](01-desktop-mcp.md) | Planejamento de correções (CSP e spell-check) para aplicação de terceiros (`groq/groq-desktop-beta`). Nunca foi priorizado; as issues são de UX do app original e não fazem parte da linha de pesquisa experimental deste repositório. |
| [04-autogroq.md](04-autogroq.md) | Análise/derivação de terceiros (`jgravelle/AutoGroq`) para orquestração de agentes. O caso de uso passou a ser coberto pela stack agêntica própria do ambiente (OpenClaw + Lobster + LiteLLM), e as dependências legadas do plano (SDK `openai` 0.x, AutoGen/CrewAI como alvos principais) envelheceram sem uso. |

A partir de 2026-10-03 este repositório é a casa dos dois projetos ativos de
pesquisa experimental: [PyMTS Plugins](../projects/02-pymts-plugins.md) e
[Plataforma de Experimentos Psicológicos](../projects/03-plataforma-experimentos.md).
