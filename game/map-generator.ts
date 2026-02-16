import type { Tile, HexCoord, TerrainType } from './types'
import { MAP_COLS, MAP_ROWS } from './constants'
import { hex, hexKey, hexDistance } from './hex-utils'

// ── Simple seeded random ──
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Simple 2D noise approximation ──
function simpleNoise(q: number, r: number, rand: () => number, scale: number): number {
  const x = (q * 0.7 + r * 0.3) / scale
  const y = (r * 0.7 + q * 0.3) / scale
  return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
}

export function generateMap(seed?: number): {
  tiles: Map<string, Tile>
  beastStart: HexCoord
  demonStart: HexCoord
  crystalNodes: HexCoord[]
} {
  const rand = mulberry32(seed ?? Date.now())
  const tiles = new Map<string, Tile>()
  const allHexes: HexCoord[] = []

  // Generate offset-based hex grid
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const q = col - Math.floor(row / 2)
      const r = row
      const h = hex(q, r)
      allHexes.push(h)
    }
  }

  // Determine starting positions
  const beastStart = hex(2, MAP_ROWS - 3)
  const demonStart = hex(MAP_COLS - 4, 2)

  // Place crystal nodes (special tiles) - spread around the map center
  const centerQ = Math.floor(MAP_COLS / 2) - Math.floor(MAP_ROWS / 4)
  const centerR = Math.floor(MAP_ROWS / 2)
  const center = hex(centerQ, centerR)

  const crystalNodes: HexCoord[] = []
  const shuffledHexes = [...allHexes].sort(() => rand() - 0.5)
  for (const h of shuffledHexes) {
    if (crystalNodes.length >= 6) break
    const distToCenter = hexDistance(h, center)
    const distToBeast = hexDistance(h, beastStart)
    const distToDemon = hexDistance(h, demonStart)
    if (
      distToCenter <= 6 &&
      distToBeast >= 4 &&
      distToDemon >= 4 &&
      crystalNodes.every(c => hexDistance(c, h) >= 2)
    ) {
      crystalNodes.push(h)
    }
  }

  // Generate water features (river/lakes)
  const waterCenters: HexCoord[] = []
  for (let i = 0; i < 3; i++) {
    const wh = shuffledHexes.find(
      h =>
        hexDistance(h, beastStart) > 3 &&
        hexDistance(h, demonStart) > 3 &&
        waterCenters.every(w => hexDistance(w, h) >= 4) &&
        crystalNodes.every(c => hexDistance(c, h) >= 2)
    )
    if (wh) waterCenters.push(wh)
  }

  // Assign terrain to each hex
  for (const h of allHexes) {
    const key = hexKey(h)
    let terrain: TerrainType = 'grass'
    let level = Math.floor(rand() * 4) + 1

    // Check if crystal node
    if (crystalNodes.some(c => c.q === h.q && c.r === h.r)) {
      terrain = 'special'
      level = Math.floor(rand() * 4) + 1
    }
    // Check if water
    else if (waterCenters.some(w => hexDistance(w, h) <= 1 + (rand() > 0.5 ? 1 : 0))) {
      terrain = 'water'
    }
    // Forest clusters
    else {
      const noise = simpleNoise(h.q, h.r, rand, 3)
      const absNoise = Math.abs(noise)
      if (absNoise > 0.55 && hexDistance(h, beastStart) > 2 && hexDistance(h, demonStart) > 2) {
        terrain = 'forest'
      }
    }

    // Ensure starting areas are grass
    if (hexDistance(h, beastStart) <= 2) terrain = 'grass'
    if (hexDistance(h, demonStart) <= 2) terrain = 'grass'

    tiles.set(key, { hex: h, terrain, level })
  }

  return { tiles, beastStart, demonStart, crystalNodes }
}
