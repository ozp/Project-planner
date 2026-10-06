# Backup cifrado client-side e restore — Story 3.2 (AD-15/NFR2/LGPD)

> Testado ponta a ponta em 2026-10-06. Dump diário às **03:45** (cron do dash)
> → gzip → **age** (chave pública) → Cloudflare R2 `backup/plataforma-crypt/`.
> **O provedor só possui ciphertext** (cabeçalho `age-encryption.org/v1`); a
> chave privada NUNCA sai da estação (`~/.secrets/plataforma-backup.age`).

## Custódia de chaves

- Par de chaves `age` gerado na estação em 06/10; privada em
  `~/.secrets/plataforma-backup.age` (perm 600) — não existe no dash nem no provedor.
- Pública embutida em `/opt/plataforma-backup/backup.sh` (dash).
- Rotação futura: gerar novo par, adicionar o novo recipient no script (período de
  transição com 2 recipients), depois remover o antigo e re-testar o restore.

## Pipeline (dash, `/opt/plataforma-backup/backup.sh`)

pg_dump do container `plataforma-db` | gzip | `age -r <pub>` → upload via rclone
(credenciais R2 por env, sem config persistida) → retenção de 7 no provedor.
Cron: `45 3 * * * root` (`/etc/cron.d/plataforma-backup`, log em cron.log).
O backup nativo em claro do Dokploy foi DESATIVADO e todo plaintext antigo do
bucket foi purgado (06/10) — o bucket contém exclusivamente ciphertext.

## Restore (receita verificada)

```bash
# 1. baixar o ciphertext do provedor (rclone com env R2 — ver ~/.secrets/plataforma-prod.json)
rclone copy BK:backup/plataforma-crypt/plataforma-<data>.sql.gz.age .
# 2. decriptar NA ESTAÇÃO (único lugar com a chave privada) e conferir checksum
age -d -i ~/.secrets/plataforma-backup.age plataforma-<data>.sql.gz.age | gunzip > dump.sql
sha256sum dump.sql
# 3. ambiente limpo + role (o dump referencia OWNER TO plataforma)
docker run -d --name restore -e POSTGRES_PASSWORD=x -e POSTGRES_USER=restore -p 5599:5432 postgres:18-alpine
docker exec -i restore psql -U restore -c 'CREATE DATABASE experimentos' -c 'CREATE ROLE plataforma LOGIN'
docker exec -i restore psql -U restore -d experimentos -v ON_ERROR_STOP=1 < dump.sql
```

## Teste de 2026-10-06 (resultado)

- Backup: `plataforma-2026-10-06T133940.sql.gz.age` (12,6 KB) no R2; magic bytes
  `age-encryption.org/v1` confirmados direto do provedor.
- Restore em `postgres:18-alpine` limpo: **completo, zero erros**.
- Integridade: sha256 do SQL decriptado
  `c6d25202405afc6fede00bd00debadcb938878ab103a1d0d0070d9c2f000c16b`;
  contagens tabela a tabela **idênticas à produção no instante do backup**
  (sessions 8 · trial_results 5 · user_accounts 6 · experiment_docs 4 ·
  experiment_invites 4 · consent_acceptances 5).
- PII (AD-6/NFR8): dados de classe protegida (demografia) existem só dentro do
  ciphertext; sem a chave privada não há leitura possível no provedor.
