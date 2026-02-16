import type { UnitStats, BuildingInfo, BuildingType } from './types'

// ── Map dimensions ──
export const MAP_COLS = 20
export const MAP_ROWS = 16

// ── Hex rendering ──
export const HEX_SIZE = 40 // radius of hex (center to vertex)
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE
export const HEX_HEIGHT = 2 * HEX_SIZE

// ── Starting resources ──
export const STARTING_GOLD = 100

// ── Income rates ──
export const TOWNHALL_INCOME = 10
export const CRYSTAL_INCOME = 5
export const WATCHTOWER_INCOME = 2

// ── Building stats ──
export const BUILDING_INFO: Record<BuildingType, BuildingInfo> = {
  townhall: { type: 'townhall', cost: 80, hp: 300, maxHp: 300, description: '+10 gold/turn. Max 2.' },
  barracks: { type: 'barracks', cost: 40, hp: 200, maxHp: 200, description: 'Train Scouts, Warriors, Berserkers.' },
  magetower: { type: 'magetower', cost: 50, hp: 200, maxHp: 200, description: 'Train Rangers, Elites, Mages.' },
  watchtower: { type: 'watchtower', cost: 30, hp: 150, maxHp: 150, description: '+2 gold/turn, +2 DEF to adjacent allies.' },
  wall: { type: 'wall', cost: 15, hp: 200, maxHp: 200, description: 'Impassable blocker.' },
}

export const MAX_TOWNHALLS = 2

// ── Unit tier definitions ──
// Each tier has 3 sprite variants (visual variety, same stats)
export interface TierDef {
  tier: number
  role: string
  spriteIndices: [number, number, number]
  hp: number
  atk: number
  def: number
  range: number
  move: number
  cost: number
  trainedAt: 'barracks' | 'magetower'
}

export const UNIT_TIERS: TierDef[] = [
  { tier: 1, role: 'Scout',     spriteIndices: [1, 2, 3],    hp: 30, atk: 8,  def: 2, range: 1, move: 4, cost: 15, trainedAt: 'barracks' },
  { tier: 2, role: 'Warrior',   spriteIndices: [4, 5, 6],    hp: 50, atk: 12, def: 5, range: 1, move: 3, cost: 25, trainedAt: 'barracks' },
  { tier: 3, role: 'Berserker', spriteIndices: [7, 8, 9],    hp: 40, atk: 18, def: 3, range: 1, move: 3, cost: 30, trainedAt: 'barracks' },
  { tier: 4, role: 'Ranger',    spriteIndices: [10, 11, 12], hp: 35, atk: 10, def: 3, range: 3, move: 3, cost: 30, trainedAt: 'magetower' },
  { tier: 5, role: 'Elite',     spriteIndices: [13, 14, 15], hp: 70, atk: 14, def: 8, range: 1, move: 2, cost: 45, trainedAt: 'magetower' },
  { tier: 6, role: 'Mage',      spriteIndices: [16, 17, 18], hp: 30, atk: 16, def: 2, range: 3, move: 2, cost: 40, trainedAt: 'magetower' },
]

export function getUnitStats(tier: number, spriteIndex: number): UnitStats {
  const def = UNIT_TIERS.find(t => t.tier === tier)!
  return {
    tier: def.tier,
    role: def.role,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    def: def.def,
    range: def.range,
    move: def.move,
    cost: def.cost,
    trainedAt: def.trainedAt,
  }
}

export function getTierForSprite(spriteIndex: number): TierDef {
  return UNIT_TIERS.find(t => t.spriteIndices.includes(spriteIndex))!
}

// ── Terrain properties ──
export const TERRAIN_MOVE_COST: Record<string, number> = {
  grass: 1,
  forest: 2,
  water: Infinity,
  special: 1,
}

export const TERRAIN_DEF_BONUS: Record<string, number> = {
  grass: 0,
  forest: 2,
  water: 0,
  special: 0,
}

// ── Colors ──
export const COLORS = {
  moveTint: 'rgba(70, 130, 255, 0.35)',
  attackTint: 'rgba(255, 70, 70, 0.35)',
  buildTint: 'rgba(70, 255, 130, 0.35)',
  selectionOutline: '#ffd700',
  hoverOutline: 'rgba(255, 255, 255, 0.5)',
  beastAccent: '#4a9e5c',
  demonAccent: '#b03a3a',
  hpBarBg: '#333333',
  hpBarFill: '#44cc44',
  hpBarLow: '#cc4444',
  fogOfWar: 'rgba(0, 0, 0, 0.6)',
}
