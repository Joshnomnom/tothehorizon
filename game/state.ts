import type { GameState, Unit, Building, SelectionState } from './types'
import { STARTING_GOLD, BUILDING_INFO, getUnitStats } from './constants'
import { generateMap } from './map-generator'
import { hexKey } from './hex-utils'

let nextId = 1
export function genId(prefix: string): string {
  return `${prefix}_${nextId++}`
}

function emptySelection(): SelectionState {
  return {
    mode: 'idle',
    selectedUnitId: null,
    selectedBuildingId: null,
    buildingTypeToBuild: null,
    validMoveHexes: [],
    validAttackHexes: [],
    validBuildHexes: [],
  }
}

export function createInitialState(): GameState {
  const { tiles, beastStart, demonStart } = generateMap(42)

  // Create starting buildings
  const buildings: Building[] = [
    {
      id: genId('bld'),
      type: 'townhall',
      faction: 'beast',
      hex: beastStart,
      hp: BUILDING_INFO.townhall.hp,
      maxHp: BUILDING_INFO.townhall.maxHp,
    },
    {
      id: genId('bld'),
      type: 'townhall',
      faction: 'demon',
      hex: demonStart,
      hp: BUILDING_INFO.townhall.hp,
      maxHp: BUILDING_INFO.townhall.maxHp,
    },
  ]

  // Create starting units (2 scouts per side near their town hall)
  const beastNeighbors = [
    { q: beastStart.q + 1, r: beastStart.r, s: -beastStart.q - 1 - beastStart.r },
    { q: beastStart.q, r: beastStart.r + 1, s: -beastStart.q - beastStart.r - 1 },
  ]
  const demonNeighbors = [
    { q: demonStart.q - 1, r: demonStart.r, s: -demonStart.q + 1 - demonStart.r },
    { q: demonStart.q, r: demonStart.r - 1, s: -demonStart.q - demonStart.r + 1 },
  ]

  const units: Unit[] = [
    {
      id: genId('unit'),
      faction: 'beast',
      spriteIndex: 1,
      stats: getUnitStats(1, 1),
      hex: beastNeighbors[0],
      hasMoved: false,
      hasAttacked: false,
    },
    {
      id: genId('unit'),
      faction: 'beast',
      spriteIndex: 2,
      stats: getUnitStats(1, 2),
      hex: beastNeighbors[1],
      hasMoved: false,
      hasAttacked: false,
    },
    {
      id: genId('unit'),
      faction: 'demon',
      spriteIndex: 1,
      stats: getUnitStats(1, 1),
      hex: demonNeighbors[0],
      hasMoved: false,
      hasAttacked: false,
    },
    {
      id: genId('unit'),
      faction: 'demon',
      spriteIndex: 2,
      stats: getUnitStats(1, 2),
      hex: demonNeighbors[1],
      hasMoved: false,
      hasAttacked: false,
    },
  ]

  // Center camera on beast start
  const state: GameState = {
    map: tiles,
    mapWidth: 20,
    mapHeight: 16,
    units,
    buildings,
    players: [
      { faction: 'beast', gold: STARTING_GOLD, isAI: false },
      { faction: 'demon', gold: STARTING_GOLD, isAI: true },
    ],
    currentPlayerIndex: 0,
    turn: 1,
    selection: emptySelection(),
    camera: { x: 0, y: 0, zoom: 1 },
    combatLog: [{ turn: 0, message: 'The battle begins! Beastfolk vs Demons.', type: 'info' }],
    gameOver: false,
    winner: null,
    animating: false,
  }

  // Verify starting tiles exist (mark them as grass if missing)
  for (const u of units) {
    const key = hexKey(u.hex)
    if (!tiles.has(key)) {
      tiles.set(key, { hex: u.hex, terrain: 'grass', level: 1 })
    }
  }

  return state
}
