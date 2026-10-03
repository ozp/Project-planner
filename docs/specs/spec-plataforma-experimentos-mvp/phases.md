# Phases — MVP F0–F2 (spec-authored companion)

Fases do quadro 03a §7 reduzidas ao escopo do MVP. Cada fase tem escopo fechado e gate
de saída; F3–F5 estão no SPEC.md como non-goals (ver 03a para o roteiro completo).

| Fase | Ambiente | Escopo (CAPs) | Gate de saída |
|---|---|---|---|
| **F0 — Dev** | Local (docker compose espelhando prod — AD-15) | Skeleton Nuxt 4 + Nitro; `core/schema` v1 (schemaVersion do experimento + TrialResult); migrations PG18; CAP-1 (auth participante/pesquisador), CAP-2, CAP-4 com 1 experimento MTS de exemplo; CAP-5 mínima (upload de documento validado); testes de contrato da ingestão (CAP-7) | Suíte de testes verde no CI; experimento de exemplo executável local de ponta-a-ponta; schema validando/rejeitando documentos |
| **F1 — Piloto fechado** | VPS próprio (dash — assumption; Traefik + HTTPS) | Registro por convite (mecânica: open question); CAP-3 (catálogo só com convite/logado); CAP-6 (aprovação de pesquisador); CAP-8 (export); CAP-9 (deploy + backup cifrado + restore testado); 1–2 experimentos reais do ozp | ≥10 participantes convidados completando coleta real; export íntegro; restore verificado; LGPD revisada (retenção!) |
| **F2 — Público** | Idem F1 | Registro aberto (CAP-1 self-service); CAP-3 público (SEO/landing); CAP-10 (direitos do titular self-service); rate limiting; MFA admin se não entrou na F1 | Participante desconhecido completa fluxo sozinho no celular; eliminação LGPD end-to-end; operação estável |

**Regra de ouro herdada do plano consolidado:** entrega datada nunca depende de infra
nova — cada fase declara seu caminho com a infra da fase anterior (fallback).

**Não pertencem ao MVP:** F3 (agentes assistidos — AD-8 já reserva gateway/local_only),
F4 (pgvector), F5 (sintéticos — AD-2/AD-3 já garantem comparabilidade futura).
