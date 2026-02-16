// ── Hex coordinate system (cube coordinates) ──
export interface HexCoord {
  q: number
  r: number
  s: number
}

// ── Terrain ──
export type TerrainType = 'grass' | 'forest' | 'water' | 'special'

export interface Tile {
  hex: HexCoord
  terrain: TerrainType
  level: number // 1-4 visual variation
}

// ── Factions ──
export type Faction = 'beast' | 'demon'

// ── Unit tiers ──
export interface UnitStats {
  tier: number
  role: string
  hp: number
  maxHp: number
  atk: number
  def: number
  range: number
  move: number
  cost: number
  trainedAt: 'barracks' | 'magetower'
}

export interface Unit {
  id: string
  faction: Faction
  spriteIndex: number // 1-18
  stats: UnitStats
  hex: HexCoord
  hasMoved: boolean
  hasAttacked: boolean
}

// ── Buildings ──
export type BuildingType = 'townhall' | 'barracks' | 'magetower' | 'watchtower' | 'wall'

export interface BuildingInfo {
  type: BuildingType
  cost: number
  hp: number
  maxHp: number
  description: string
}

export interface Building {
  id: string
  type: BuildingType
  faction: Faction
  hex: HexCoord
  hp: number
  maxHp: number
}

// ── Player ──
export interface Player {
  faction: Faction
  gold: number
  isAI: boolean
}

// ── Combat log entry ──
export interface CombatLogEntry {
  turn: number
  message: string
  type: 'attack' | 'kill' | 'build' | 'train' | 'income' | 'info'
}

// ── Selection state machine ──
export type SelectionMode = 'idle' | 'unit-selected' | 'building-selected' | 'build-mode' | 'train-mode'

export interface SelectionState {
  mode: SelectionMode
  selectedUnitId: string | null
  selectedBuildingId: string | null
  buildingTypeToBuild: BuildingType | null
  validMoveHexes: HexCoord[]
  validAttackHexes: HexCoord[]
  validBuildHexes: HexCoord[]
}

// ── Camera ──
export interface Camera {
  x: number
  y: number
  zoom: number
}

// ── Full game state ──
export interface GameState {
  map: Map<string, Tile>
  mapWidth: number
  mapHeight: number
  units: Unit[]
  buildings: Building[]
  players: [Player, Player] // [beast, demon]
  currentPlayerIndex: number
  turn: number
  selection: SelectionState
  camera: Camera
  combatLog: CombatLogEntry[]
  gameOver: boolean
  winner: Faction | null
  animating: boolean
}

// ── Asset cache ──
export type AssetCache = Map<string, HTMLImageElement>

// ── UI overlay state (managed by React) ──
export interface UIState {
  showBuildMenu: boolean
  showTrainMenu: boolean
  showUnitDictionary: boolean
  showGameOver: boolean
  hoveredHex: HexCoord | null
  selectedUnitInfo: Unit | null
  selectedBuildingInfo: Building | null
  selectedTileInfo: Tile | null
}
