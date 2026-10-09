-- 008_asset_bytes.sql — durabilidade dos estímulos (achado do F5 story 4):
-- cada deploy recria o container e apaga data/assets — os binários agora
-- vivem TAMBÉM no Postgres (serviço persistente); o arquivo em disco é cache
-- de leitura. Sem isso, qualquer deploy quebra as imagens de todos os
-- experimentos publicados.
ALTER TABLE stimulus_assets
  ADD COLUMN IF NOT EXISTS bytes bytea;
