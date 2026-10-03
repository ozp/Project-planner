# Journeys — MVP F0–F2 (spec-authored companion)

Jornadas de referência para UX e aceitação. Detalhe visual/layout é tarefa de UX futura;
aqui é o contrato de fluxo.

## Participante (público F2; convite F1)

```
1. Chega em experimentos.psico.net (celular)
2. Escolhe experimento no catálogo (CAP-3)
3. Registro leve: e-mail + senha → cookie httpOnly (CAP-1)
4. TERMO DE CONSENTIMENTO da versão vigente — aceite registrado (CAP-2, AD-9)
5. Demografia mínima declarada pelo experimento (classe protegida — AD-6)
6. Experimento roda no navegador; uma carga, sem chamadas entre trials (CAP-4, AD-7)
7. Fim: batch assinado por token efêmero (AD-11) → feedback descritivo/educativo
   (nunca diagnóstico — Constraint)
8. Depois, quando quiser: acesso aos próprios dados / eliminação da conta (CAP-10, AD-13)
```

## Pesquisador

```
1. Registra-se e é aprovado pelo admin (CAP-6) — MFA quando admin
2. Autora o experimento FORA da plataforma (documento JSON no schema versionado)
3. Submete documento + estímulos (assets internos, AD-10) → validação com erro
   acionável → aceito vira docVersion imutável (CAP-5, AD-4)
4. Define o termo de consentimento (versão) e o conteúdo do feedback descritivo
5. Abre o experimento (F1: só convidados; F2: público)
6. Acompanha sessões (contagem/status — sem analytics além do básico no MVP)
7. Exporta CSV/JSON pseudonimizado, zero PII (CAP-8, AD-6)
```

## Admin (ozp)

```
1. Login com MFA (AD-12)
2. Aprova/rejeita pesquisadores; suspende contas (CAP-6)
3. Trilha de auditoria de ações (admin_actions)
4. Opera: deploy, backup cifrado, restore testado (CAP-9); revisa LGPD (retenção F1)
```
