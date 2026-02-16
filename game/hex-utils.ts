import type { HexCoord } from './types'
import { HEX_SIZE, TERRAIN_MOVE_COST } from './constants'
import type { GameState } from './types'

// ── Hex key for Map lookups ──
export function hexKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number)
  return { q, r, s: -q - r }
}

// ── Create hex coord ──
export function hex(q: number, r: number): HexCoord {
  return { q, r, s: -q - r }
}

// ── Hex equality ──
export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r
}

// ── Six neighbors of a hex (cube coords) ──
const DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0, s: -1 },
  { q: 1, r: -1, s: 0 },
  { q: 0, r: -1, s: 1 },
  { q: -1, r: 0, s: 1 },
  { q: -1, r: 1, s: 0 },
  { q: 0, r: 1, s: -1 },
]

export function hexNeighbors(h: HexCoord): HexCoord[] {
  return DIRECTIONS.map(d => ({ q: h.q + d.q, r: h.r + d.r, s: h.s + d.s }))
}

// ── Hex distance (cube) ──
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s))
}

// ── Hex to pixel (flat-top hex) ──
export function hexToPixel(h: HexCoord): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * h.q + (Math.sqrt(3) / 2) * h.r)
  const y = HEX_SIZE * ((3 / 2) * h.r)
  return { x, y }
}

// ── Pixel to hex (flat-top hex) ──
export function pixelToHex(px: number, py: number): HexCoord {
  const q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / HEX_SIZE
  const r = ((2 / 3) * py) / HEX_SIZE
  return hexRound({ q, r, s: -q - r })
}

function hexRound(h: { q: number; r: number; s: number }): HexCoord {
  let rq = Math.round(h.q)
  let rr = Math.round(h.r)
  let rs = Math.round(h.s)

  const dq = Math.abs(rq - h.q)
  const dr = Math.abs(rr - h.r)
  const ds = Math.abs(rs - h.s)

  if (dq > dr && dq > ds) {
    rq = -rr - rs
  } else if (dr > ds) {
    rr = -rq - rs
  } else {
    rs = -rq - rr
  }

  return { q: rq, r: rr, s: rs }
}

// ── Get all hexes within a given range ──
export function hexesInRange(center: HexCoord, range: number): HexCoord[] {
  const results: HexCoord[] = []
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      const s = -q - r
      results.push({ q: center.q + q, r: center.r + r, s: center.s + s })
    }
  }
  return results
}

// ── BFS for reachable hexes (movement) ──
export function getReachableHexes(
  start: HexCoord,
  movePoints: number,
  state: GameState,
  faction: 'beast' | 'demon'
): HexCoord[] {
  const visited = new Map<string, number>()
  const queue: { hex: HexCoord; cost: number }[] = [{ hex: start, cost: 0 }]
  visited.set(hexKey(start), 0)
  const reachable: HexCoord[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const neighbor of hexNeighbors(current.hex)) {
      const key = hexKey(neighbor)
      const tile = state.map.get(key)
      if (!tile) continue // out of bounds

      const moveCost = TERRAIN_MOVE_COST[tile.terrain]
      if (moveCost === Infinity) continue // impassable

      // Check for blocking buildings (walls, enemy buildings)
      const buildingOnTile = state.buildings.find(b => hexEquals(b.hex, neighbor))
      if (buildingOnTile) continue // can't move through buildings

      // Check for units (can't move through enemies)
      const unitOnTile = state.units.find(u => hexEquals(u.hex, neighbor))
      if (unitOnTile && unitOnTile.faction !== faction) continue
      if (unitOnTile && unitOnTile.faction === faction) continue // can't stack friendly either

      const newCost = current.cost + moveCost
      if (newCost > movePoints) continue

      const existingCost = visited.get(key)
      if (existingCost !== undefined && existingCost <= newCost) continue

      visited.set(key, newCost)
      queue.push({ hex: neighbor, cost: newCost })
      reachable.push(neighbor)
    }
  }

  return reachable
}

// ── Get attackable hexes from a position ──
export function getAttackableHexes(
  from: HexCoord,
  range: number,
  state: GameState,
  faction: 'beast' | 'demon'
): HexCoord[] {
  const inRange = hexesInRange(from, range).filter(h => !hexEquals(h, from))
  return inRange.filter(h => {
    // Check for enemy units
    const enemyUnit = state.units.find(u => hexEquals(u.hex, h) && u.faction !== faction)
    if (enemyUnit) return true
    // Check for enemy buildings
    const enemyBuilding = state.buildings.find(b => hexEquals(b.hex, h) && b.faction !== faction)
    if (enemyBuilding) return true
    return false
  })
}

// ── Simple A* pathfinding (for AI) ──
export function findPath(
  start: HexCoord,
  goal: HexCoord,
  state: GameState,
  faction: 'beast' | 'demon'
): HexCoord[] | null {
  const openSet = new Map<string, { hex: HexCoord; g: number; f: number; parent: string | null }>()
  const closedSet = new Set<string>()

  const startKey = hexKey(start)
  openSet.set(startKey, { hex: start, g: 0, f: hexDistance(start, goal), parent: null })

  while (openSet.size > 0) {
    // Find lowest f
    let bestKey = ''
    let bestF = Infinity
    for (const [k, v] of openSet) {
      if (v.f < bestF) {
        bestF = v.f
        bestKey = k
      }
    }

    const current = openSet.get(bestKey)!
    if (hexEquals(current.hex, goal)) {
      // Reconstruct path
      const path: HexCoord[] = []
      let key: string | null = bestKey
      while (key && key !== startKey) {
        path.unshift(openSet.get(key)?.hex || closedSet.has(key) ? parseHexKey(key) : current.hex)
        // Need to track parents differently
        break
      }
      return path.length > 0 ? path : [goal]
    }

    openSet.delete(bestKey)
    closedSet.add(bestKey)

    for (const neighbor of hexNeighbors(current.hex)) {
      const nKey = hexKey(neighbor)
      if (closedSet.has(nKey)) continue

      const tile = state.map.get(nKey)
      if (!tile) continue
      const cost = TERRAIN_MOVE_COST[tile.terrain]
      if (cost === Infinity) continue

      const buildingOnTile = state.buildings.find(b => hexEquals(b.hex, neighbor))
      if (buildingOnTile && buildingOnTile.faction !== faction) continue

      const unitOnTile = state.units.find(u => hexEquals(u.hex, neighbor))
      if (unitOnTile) continue

      const g = current.g + cost
      const existing = openSet.get(nKey)
      if (existing && existing.g <= g) continue

      openSet.set(nKey, { hex: neighbor, g, f: g + hexDistance(neighbor, goal), parent: bestKey })
    }
  }

  return null
}

// ── Get closest reachable hex toward a goal ──
export function getClosestReachableToward(
  start: HexCoord,
  goal: HexCoord,
  movePoints: number,
  state: GameState,
  faction: 'beast' | 'demon'
): HexCoord | null {
  const reachable = getReachableHexes(start, movePoints, state, faction)
  if (reachable.length === 0) return null

  let best = reachable[0]
  let bestDist = hexDistance(best, goal)
  for (const h of reachable) {
    const d = hexDistance(h, goal)
    if (d < bestDist) {
      bestDist = d
      best = h
    }
  }
  return bestDist < hexDistance(start, goal) ? best : reachable[0]
}
