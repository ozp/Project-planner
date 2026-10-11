#!/usr/bin/env node
// Mancha ASCII determinística (rascunho S3/D5): mesma seed = mesmos bytes.
// v2 (feedback do ozp 11/10): variabilidade de FORMA por arquétipos (blob,
// anel, lobos, coluna, diagonal, ilhas, raios, faixas) com dispersão própria —
// canvas e rampa de caracteres FIXOS (mesmo tamanho/orçamento de tinta).
// Uso: node scripts/gen-mancha.mjs <seed> [largura altura] [--info]
// --info: meta (arquétipo, tinta) no stderr; stdout sempre só a mancha.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const args = process.argv.slice(2).filter(a => !a.startsWith('-'))
const info = process.argv.slice(2).includes('--info')
const seed = Number(args[0] ?? 1)
const W = Number(args[1] ?? 25) | 1
const H = Number(args[2] ?? 11)
const RAMP = ' .:-=+*#%@'
const half = (W - 1) / 2
const cx = half, cy = (H - 1) / 2

const gauss = (d, sigma) => Math.exp(-(d * d) / (2 * sigma * sigma))

/** Campo de intensidade por arquétipo — sempre na metade esquerda (espelho). */
function field(archetype, p) {
  return (x, y) => {
    switch (archetype) {
      case 'blob': return gauss(Math.hypot(x - cx, y - cy), p.sigma)
      case 'anel': { const d = Math.abs(Math.hypot(x - cx, y - cy) - p.r0); return gauss(d, p.sigma * 0.6) }
      case 'lobos': return Math.max(
        gauss(Math.hypot(x - cx * p.off, y - (cy - p.spread)), p.sigma),
        gauss(Math.hypot(x - cx * p.off, y - (cy + p.spread)), p.sigma))
      case 'coluna': return gauss(Math.abs(x - cx), p.sigma) * (0.35 + 0.65 * gauss(Math.abs(y - cy), H * 0.8))
      case 'diagonal': { const d = Math.abs((x - cx) + (y - cy) * 0.8); return gauss(d, p.sigma) }
      case 'ilhas': { let v = 0; for (const [ix, iy] of p.isles) v = Math.max(v, gauss(Math.hypot(x - ix, y - iy), p.sigma * 0.55)); return v }
      case 'raios': { let v = 0; for (const ang of p.angles) { const dx = x - cx, dy = y - cy; const da = Math.abs(Math.atan2(dy, dx) - ang); const along = Math.hypot(dx, dy); v = Math.max(v, gauss(Math.min(da, 2 * Math.PI - da) * along, p.sigma * 0.35) * gauss(Math.abs(along - p.r0 * 0.9), p.sigma)) } return v }
      case 'faixas': { let v = 0; for (const by of p.bands) v = Math.max(v, gauss(Math.abs(y - by), 0.8) * gauss(Math.abs(x - cx), half * p.width)); return v }
    }
  }
}

function render(seed) {
  const rand = mulberry32(seed * 2654435761 >>> 0)
  const ARCH = ['blob', 'anel', 'lobos', 'coluna', 'diagonal', 'ilhas', 'raios', 'faixas']
  for (let attempt = 0; attempt < 6; attempt++) {
    const archetype = ARCH[Math.floor(rand() * ARCH.length)]
    const sigma = 1.6 + rand() * 3.4 // dispersão: compacta (1.6) a espalhada (5.0)
    const p = {
      sigma,
      r0: 1.2 + rand() * (half * 0.55),
      off: 0.25 + rand() * 0.5, spread: 1.0 + rand() * 2.4,
      width: 0.5 + rand() * 0.8,
      isles: Array.from({ length: 3 + Math.floor(rand() * 3) }, () => [rand() * half, rand() * H]),
      angles: Array.from({ length: 3 + Math.floor(rand() * 3) }, () => rand() * 2 * Math.PI),
      bands: Array.from({ length: 2 + Math.floor(rand() * 2) }, () => rand() * H),
    }
    const I = field(archetype, p)
    const amp = 0.85 + rand() * 0.15
    let ink = 0
    const lines = []
    for (let y = 0; y < H; y++) {
      let left = ''
      for (let x = 0; x <= half; x++) {
        const prob = Math.min(1, I(x, y) * amp)
        const v = rand() < prob ? 0.3 + 0.7 * rand() * (0.45 + 0.55 * prob) : 0
        if (v > 0.12) ink++
        left += RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))]
      }
      lines.push(left + [...left.slice(0, half)].reverse().join(''))
    }
    const ratio = ink / (W * H)
    if (ratio >= 0.14 && ratio <= 0.55) {
      if (info) console.error(`seed=${seed} arquétipo=${archetype} sigma=${sigma.toFixed(1)} tinta=${(ratio * 100).toFixed(0)}%`)
      return lines.join('\n')
    }
  }
  return null // seed exaustiva de tentativas não rendeu tinta dentro da faixa
}

const out = render(seed)
if (out === null) { console.error(`seed ${seed}: nenhuma tentativa com tinta na faixa`); process.exit(1) }
console.log(out)
