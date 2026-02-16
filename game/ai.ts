import type { GameState, Faction, CombatLogEntry } from './types'
import {
  BUILDING_INFO,
  UNIT_TIERS,
} from './constants'
import {
  hexDistance,
  hexEquals,
  getReachableHexes,
  getAttackableHexes,
  getClosestReachableToward,
} from './hex-utils'
import {
  buildBuilding,
  trainUnit,
  moveUnit,
  attackUnit,
  getValidBuildHexes,
} from './game-logic'

// ── Execute full AI turn ──
export function executeAITurn(state: GameState): CombatLogEntry[] {
  const faction: Faction = 'demon'
  const player = state.players.find(p => p.faction === faction)!
  const logs: CombatLogEntry[] = []

  // 1. Build buildings
  aiBuildings(state, faction, player, logs)

  // 2. Train units
  aiTrain(state, faction, player, logs)

  // 3. Move and attack with each unit
  aiCombat(state, faction, logs)

  return logs
}

function aiBuildings(
  state: GameState,
  faction: Faction,
  player: { gold: number },
  logs: CombatLogEntry[]
) {
  const ownBuildings = state.buildings.filter(b => b.faction === faction)
  const barracks = ownBuildings.filter(b => b.type === 'barracks')
  const mageTowers = ownBuildings.filter(b => b.type === 'magetower')
  const townhalls = ownBuildings.filter(b => b.type === 'townhall')

  // Priority: barracks first, then mage tower, then watchtower, then second townhall
  const buildOrder: Array<{ type: 'barracks' | 'magetower' | 'watchtower' | 'townhall'; condition: boolean }> = [
    { type: 'barracks', condition: barracks.length === 0 && player.gold >= BUILDING_INFO.barracks.cost },
    { type: 'magetower', condition: mageTowers.length === 0 && barracks.length > 0 && player.gold >= BUILDING_INFO.magetower.cost },
    { type: 'watchtower', condition: ownBuildings.length >= 3 && player.gold >= BUILDING_INFO.watchtower.cost + 30 },
    { type: 'townhall', condition: townhalls.length < 2 && player.gold >= BUILDING_INFO.townhall.cost + 40 },
  ]

  for (const order of buildOrder) {
    if (!order.condition) continue
    const validHexes = getValidBuildHexes(state, faction)
    if (validHexes.length === 0) break

    // Pick hex closest to center of map
    const bestHex = validHexes.sort((a, b) => {
      const distA = hexDistance(a, { q: 8, r: 8, s: -16 })
      const distB = hexDistance(b, { q: 8, r: 8, s: -16 })
      return distA - distB
    })[0]

    const log = buildBuilding(state, order.type, bestHex, faction)
    if (log) logs.push(log)
    break // Only build one building per turn
  }
}

function aiTrain(
  state: GameState,
  faction: Faction,
  player: { gold: number },
  logs: CombatLogEntry[]
) {
  const ownBuildings = state.buildings.filter(b => b.faction === faction)
  const trainingBuildings = ownBuildings.filter(b => b.type === 'barracks' || b.type === 'magetower')

  // Train up to 2 units per turn
  let trained = 0
  for (const building of trainingBuildings) {
    if (trained >= 2) break

    // Decide which tier to train
    const availableTiers = UNIT_TIERS.filter(t => {
      if (building.type === 'barracks') return t.trainedAt === 'barracks'
      return t.trainedAt === 'magetower'
    })

    // Pick random affordable tier
    const affordableTiers = availableTiers.filter(t => player.gold >= t.cost)
    if (affordableTiers.length === 0) continue

    const tier = affordableTiers[Math.floor(Math.random() * affordableTiers.length)]
    const tierIndex = UNIT_TIERS.indexOf(tier)
    const variant = Math.floor(Math.random() * 3)

    const log = trainUnit(state, tierIndex, variant, building.id)
    if (log) {
      logs.push(log)
      trained++
    }
  }
}

function aiCombat(
  state: GameState,
  faction: Faction,
  logs: CombatLogEntry[]
) {
  const aiUnits = state.units.filter(u => u.faction === faction && !u.hasMoved)

  for (const unit of aiUnits) {
    // Check if unit was removed during combat
    if (!state.units.includes(unit)) continue

    // Try to attack first
    const attackHexes = getAttackableHexes(unit.hex, unit.stats.range, state, faction)
    if (attackHexes.length > 0 && !unit.hasAttacked) {
      // Attack weakest target
      let bestTarget = attackHexes[0]
      let lowestHp = Infinity
      for (const h of attackHexes) {
        const target = state.units.find(u => hexEquals(u.hex, h) && u.faction !== faction)
        if (target && target.stats.hp < lowestHp) {
          lowestHp = target.stats.hp
          bestTarget = h
        }
        const targetBuilding = state.buildings.find(b => hexEquals(b.hex, h) && b.faction !== faction)
        if (targetBuilding && targetBuilding.type === 'townhall' && targetBuilding.hp < lowestHp) {
          lowestHp = targetBuilding.hp
          bestTarget = h
        }
      }

      const attackLogs = attackUnit(state, unit, bestTarget)
      logs.push(...attackLogs)
      continue
    }

    // Find nearest enemy to move toward
    const enemies = state.units.filter(u => u.faction !== faction)
    const enemyBuildings = state.buildings.filter(b => b.faction !== faction)
    const allTargets = [
      ...enemies.map(e => e.hex),
      ...enemyBuildings.map(b => b.hex),
    ]

    if (allTargets.length === 0) continue

    // Find closest target
    let nearestTarget = allTargets[0]
    let nearestDist = hexDistance(unit.hex, allTargets[0])
    for (const t of allTargets) {
      const d = hexDistance(unit.hex, t)
      if (d < nearestDist) {
        nearestDist = d
        nearestTarget = t
      }
    }

    // Move toward target
    const moveTarget = getClosestReachableToward(unit.hex, nearestTarget, unit.stats.move, state, faction)
    if (moveTarget && !hexEquals(moveTarget, unit.hex)) {
      moveUnit(state, unit, moveTarget)

      // Try to attack after moving
      if (!unit.hasAttacked) {
        const postMoveAttack = getAttackableHexes(unit.hex, unit.stats.range, state, faction)
        if (postMoveAttack.length > 0) {
          const attackLogs = attackUnit(state, unit, postMoveAttack[0])
          logs.push(...attackLogs)
        }
      }
    }
  }
}
