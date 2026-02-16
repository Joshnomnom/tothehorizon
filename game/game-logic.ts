import type { GameState, Unit, Building, HexCoord, Faction, BuildingType, CombatLogEntry } from './types'
import {
  BUILDING_INFO,
  TERRAIN_DEF_BONUS,
  TOWNHALL_INCOME,
  CRYSTAL_INCOME,
  WATCHTOWER_INCOME,
  MAX_TOWNHALLS,
  UNIT_TIERS,
  getUnitStats,
} from './constants'
import { hexEquals, hexNeighbors, hexDistance, hexKey, getReachableHexes, getAttackableHexes } from './hex-utils'
import { genId } from './state'

// ── Get current player ──
export function currentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex]
}

export function currentFaction(state: GameState): Faction {
  return currentPlayer(state).faction
}

// ── Calculate income for a player ──
export function calculateIncome(state: GameState, faction: Faction): number {
  let income = 0

  // Town halls
  const townhalls = state.buildings.filter(b => b.type === 'townhall' && b.faction === faction)
  income += townhalls.length * TOWNHALL_INCOME

  // Watchtowers
  const watchtowers = state.buildings.filter(b => b.type === 'watchtower' && b.faction === faction)
  income += watchtowers.length * WATCHTOWER_INCOME

  // Crystal nodes (special tiles controlled by having a unit on them)
  for (const [, tile] of state.map) {
    if (tile.terrain === 'special') {
      const unitOnTile = state.units.find(u => hexEquals(u.hex, tile.hex) && u.faction === faction)
      const buildingOnTile = state.buildings.find(b => hexEquals(b.hex, tile.hex) && b.faction === faction)
      if (unitOnTile || buildingOnTile) {
        income += CRYSTAL_INCOME
      }
    }
  }

  return income
}

// ── Collect income at start of turn ──
export function collectIncome(state: GameState): CombatLogEntry {
  const faction = currentFaction(state)
  const income = calculateIncome(state, faction)
  currentPlayer(state).gold += income
  return {
    turn: state.turn,
    message: `${faction === 'beast' ? 'Beastfolk' : 'Demons'} collected ${income} gold.`,
    type: 'income',
  }
}

// ── Move unit ──
export function moveUnit(state: GameState, unit: Unit, target: HexCoord): CombatLogEntry | null {
  const reachable = getReachableHexes(unit.hex, unit.stats.move, state, unit.faction)
  if (!reachable.some(h => hexEquals(h, target))) return null

  unit.hex = { ...target }
  unit.hasMoved = true
  return null
}

// ── Attack ──
export function attackUnit(
  state: GameState,
  attacker: Unit,
  targetHex: HexCoord
): CombatLogEntry[] {
  const logs: CombatLogEntry[] = []

  // Check if target is an enemy unit
  const targetUnit = state.units.find(u => hexEquals(u.hex, targetHex) && u.faction !== attacker.faction)
  if (targetUnit) {
    const tile = state.map.get(hexKey(targetHex))
    const defBonus = tile ? TERRAIN_DEF_BONUS[tile.terrain] : 0

    // Watchtower adjacent bonus
    let watchtowerBonus = 0
    const adjacentBuildings = hexNeighbors(targetHex)
      .map(n => state.buildings.find(b => hexEquals(b.hex, n) && b.type === 'watchtower' && b.faction === targetUnit.faction))
      .filter(Boolean)
    if (adjacentBuildings.length > 0) watchtowerBonus = 2

    const totalDef = targetUnit.stats.def + defBonus + watchtowerBonus
    const damage = Math.max(1, attacker.stats.atk - totalDef)
    targetUnit.stats.hp -= damage

    const attackerName = `${attacker.faction === 'beast' ? 'Beast' : 'Demon'} ${attacker.stats.role}`
    const defenderName = `${targetUnit.faction === 'beast' ? 'Beast' : 'Demon'} ${targetUnit.stats.role}`

    logs.push({
      turn: state.turn,
      message: `${attackerName} attacks ${defenderName} for ${damage} damage!`,
      type: 'attack',
    })

    if (targetUnit.stats.hp <= 0) {
      state.units = state.units.filter(u => u.id !== targetUnit.id)
      logs.push({
        turn: state.turn,
        message: `${defenderName} has been slain!`,
        type: 'kill',
      })
    }

    attacker.hasAttacked = true
    attacker.hasMoved = true // attacking ends turn for the unit
    return logs
  }

  // Check if target is an enemy building
  const targetBuilding = state.buildings.find(b => hexEquals(b.hex, targetHex) && b.faction !== attacker.faction)
  if (targetBuilding) {
    const damage = Math.max(1, attacker.stats.atk - 2) // buildings have base 2 armor
    targetBuilding.hp -= damage

    const attackerName = `${attacker.faction === 'beast' ? 'Beast' : 'Demon'} ${attacker.stats.role}`
    const buildingName = targetBuilding.type.charAt(0).toUpperCase() + targetBuilding.type.slice(1)

    logs.push({
      turn: state.turn,
      message: `${attackerName} attacks ${buildingName} for ${damage} damage!`,
      type: 'attack',
    })

    if (targetBuilding.hp <= 0) {
      state.buildings = state.buildings.filter(b => b.id !== targetBuilding.id)
      logs.push({
        turn: state.turn,
        message: `${buildingName} has been destroyed!`,
        type: 'kill',
      })
    }

    attacker.hasAttacked = true
    attacker.hasMoved = true
    return logs
  }

  return logs
}

// ── Build a building ──
export function buildBuilding(
  state: GameState,
  type: BuildingType,
  hex: HexCoord,
  faction: Faction
): CombatLogEntry | null {
  const info = BUILDING_INFO[type]
  const player = state.players.find(p => p.faction === faction)!

  if (player.gold < info.cost) return null

  // Max townhall check
  if (type === 'townhall') {
    const existing = state.buildings.filter(b => b.type === 'townhall' && b.faction === faction)
    if (existing.length >= MAX_TOWNHALLS) return null
  }

  player.gold -= info.cost
  const building: Building = {
    id: genId('bld'),
    type,
    faction,
    hex: { ...hex },
    hp: info.hp,
    maxHp: info.maxHp,
  }
  state.buildings.push(building)

  return {
    turn: state.turn,
    message: `${faction === 'beast' ? 'Beastfolk' : 'Demons'} built ${type} (-${info.cost} gold).`,
    type: 'build',
  }
}

// ── Train a unit ──
export function trainUnit(
  state: GameState,
  tierIndex: number,
  spriteVariant: number,
  buildingId: string
): CombatLogEntry | null {
  const building = state.buildings.find(b => b.id === buildingId)
  if (!building) return null

  const tierDef = UNIT_TIERS[tierIndex]
  if (!tierDef) return null

  const player = state.players.find(p => p.faction === building.faction)!
  if (player.gold < tierDef.cost) return null

  // Find empty adjacent hex for the new unit
  const neighbors = hexNeighbors(building.hex)
  const emptyHex = neighbors.find(n => {
    const tile = state.map.get(hexKey(n))
    if (!tile || tile.terrain === 'water') return false
    const occupied = state.units.some(u => hexEquals(u.hex, n)) || state.buildings.some(b => hexEquals(b.hex, n))
    return !occupied
  })

  if (!emptyHex) return null

  player.gold -= tierDef.cost
  const spriteIndex = tierDef.spriteIndices[spriteVariant] || tierDef.spriteIndices[0]
  const unit: Unit = {
    id: genId('unit'),
    faction: building.faction,
    spriteIndex,
    stats: { ...getUnitStats(tierDef.tier, spriteIndex) },
    hex: { ...emptyHex },
    hasMoved: true, // newly trained units can't act this turn
    hasAttacked: true,
  }
  state.units.push(unit)

  return {
    turn: state.turn,
    message: `${building.faction === 'beast' ? 'Beastfolk' : 'Demons'} trained ${tierDef.role} (-${tierDef.cost} gold).`,
    type: 'train',
  }
}

// ── Get valid build hexes ──
export function getValidBuildHexes(state: GameState, faction: Faction): HexCoord[] {
  const ownedBuildings = state.buildings.filter(b => b.faction === faction)
  const validHexes: HexCoord[] = []
  const seen = new Set<string>()

  for (const building of ownedBuildings) {
    for (const neighbor of hexNeighbors(building.hex)) {
      const key = hexKey(neighbor)
      if (seen.has(key)) continue
      seen.add(key)

      const tile = state.map.get(key)
      if (!tile || tile.terrain === 'water') continue

      const occupied = state.buildings.some(b => hexEquals(b.hex, neighbor))
      if (occupied) continue

      // Don't build on tiles with units
      const hasUnit = state.units.some(u => hexEquals(u.hex, neighbor))
      if (hasUnit) continue

      validHexes.push(neighbor)
    }
  }

  return validHexes
}

// ── End turn ──
export function endTurn(state: GameState): void {
  // Reset all units for current player
  const faction = currentFaction(state)
  for (const unit of state.units) {
    if (unit.faction === faction) {
      unit.hasMoved = false
      unit.hasAttacked = false
    }
  }

  // Switch player
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0
  if (state.currentPlayerIndex === 0) {
    state.turn++
  }

  // Clear selection
  state.selection = {
    mode: 'idle',
    selectedUnitId: null,
    selectedBuildingId: null,
    buildingTypeToBuild: null,
    validMoveHexes: [],
    validAttackHexes: [],
    validBuildHexes: [],
  }

  // Collect income for new current player
  const incomeLog = collectIncome(state)
  state.combatLog.push(incomeLog)
}

// ── Check win condition ──
export function checkWinCondition(state: GameState): Faction | null {
  const beastTownhalls = state.buildings.filter(b => b.type === 'townhall' && b.faction === 'beast')
  const demonTownhalls = state.buildings.filter(b => b.type === 'townhall' && b.faction === 'demon')

  if (beastTownhalls.length === 0) return 'demon'
  if (demonTownhalls.length === 0) return 'beast'
  return null
}

// ── Select a unit ──
export function selectUnit(state: GameState, unitId: string): void {
  const unit = state.units.find(u => u.id === unitId)
  if (!unit || unit.faction !== currentFaction(state)) return

  const moveHexes = !unit.hasMoved ? getReachableHexes(unit.hex, unit.stats.move, state, unit.faction) : []
  const attackHexes = !unit.hasAttacked ? getAttackableHexes(unit.hex, unit.stats.range, state, unit.faction) : []

  state.selection = {
    mode: 'unit-selected',
    selectedUnitId: unitId,
    selectedBuildingId: null,
    buildingTypeToBuild: null,
    validMoveHexes: moveHexes,
    validAttackHexes: attackHexes,
    validBuildHexes: [],
  }
}

// ── Select a building ──
export function selectBuilding(state: GameState, buildingId: string): void {
  state.selection = {
    mode: 'building-selected',
    selectedUnitId: null,
    selectedBuildingId: buildingId,
    buildingTypeToBuild: null,
    validMoveHexes: [],
    validAttackHexes: [],
    validBuildHexes: [],
  }
}

// ── Clear selection ──
export function clearSelection(state: GameState): void {
  state.selection = {
    mode: 'idle',
    selectedUnitId: null,
    selectedBuildingId: null,
    buildingTypeToBuild: null,
    validMoveHexes: [],
    validAttackHexes: [],
    validBuildHexes: [],
  }
}

// ── Enter build mode ──
export function enterBuildMode(state: GameState, buildingType: BuildingType): void {
  const faction = currentFaction(state)
  const validHexes = getValidBuildHexes(state, faction)

  state.selection = {
    mode: 'build-mode',
    selectedUnitId: null,
    selectedBuildingId: null,
    buildingTypeToBuild: buildingType,
    validMoveHexes: [],
    validAttackHexes: [],
    validBuildHexes: validHexes,
  }
}
