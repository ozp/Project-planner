#!/usr/bin/env node
// Rascunho do gerador da S3 (D5): mancha ASCII simétrica e determinística —
// mesma seed = mesmos bytes (padrão Mask in the Inkblot; AD-10 text-native).
// Uso: node scripts/gen-mancha.mjs <seed> [largura altura]
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seed = Number(process.argv[2] ?? 1)
const W = Number(process.argv[3] ?? 25) | 1 // ímpar: coluna central espelhada
const H = Number(process.argv[4] ?? 11)
const rand = mulberry32(seed)
const RAMP = ' .:-=+*#%@'
const half = (W - 1) / 2
const cx = half, cy = (H - 1) / 2
const maxD = Math.hypot(cx, cy)

const lines = []
for (let y = 0; y < H; y++) {
  let left = ''
  for (let x = 0; x <= half; x++) {
    const d = Math.hypot(x - cx, y - cy) / maxD          // 0 no centro → 1 na borda
    const p = 0.92 * Math.exp(-(d * d) / 0.34)           // densidade radial
    const v = rand() < p ? 0.25 + 0.75 * rand() * (1 - d * 0.55) : 0
    left += RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))]
  }
  lines.push(left + [...left.slice(0, half)].reverse().join('')) // espelho bilateral
}
console.log(lines.join('\n'))
