import type { GameState, HexCoord, UIState } from './types'
import { pixelToHex, hexKey, hexEquals } from './hex-utils'
import {
  currentFaction,
  selectUnit,
  selectBuilding,
  clearSelection,
  moveUnit,
  attackUnit,
  buildBuilding,
  checkWinCondition,
} from './game-logic'

export interface ClickResult {
  uiUpdates: Partial<UIState>
  stateChanged: boolean
}

// ── Convert canvas mouse position to hex coord ──
export function canvasToHex(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number
): HexCoord {
  // Reverse the camera transform
  const px = (clientX - canvasRect.left - canvasWidth / 2) / state.camera.zoom + state.camera.x
  const py = (clientY - canvasRect.top - canvasHeight / 2) / state.camera.zoom + state.camera.y
  return pixelToHex(px, py)
}

// ── Handle left click on canvas ──
export function handleClick(
  state: GameState,
  clickedHex: HexCoord,
  uiState: UIState
): ClickResult {
  const faction = currentFaction(state)
  const key = hexKey(clickedHex)
  const tile = state.map.get(key)
  if (!tile) return { uiUpdates: {}, stateChanged: false }

  const uiUpdates: Partial<UIState> = {}

  // ── BUILD MODE ──
  if (state.selection.mode === 'build-mode' && state.selection.buildingTypeToBuild) {
    if (state.selection.validBuildHexes.some(h => hexEquals(h, clickedHex))) {
      const log = buildBuilding(state, state.selection.buildingTypeToBuild, clickedHex, faction)
      if (log) {
        state.combatLog.push(log)
      }
      clearSelection(state)
      uiUpdates.showBuildMenu = false

      // Check win
      const winner = checkWinCondition(state)
      if (winner) {
        state.gameOver = true
        state.winner = winner
        uiUpdates.showGameOver = true
      }

      return { uiUpdates, stateChanged: true }
    } else {
      clearSelection(state)
      uiUpdates.showBuildMenu = false
      return { uiUpdates, stateChanged: true }
    }
  }

  // ── UNIT SELECTED - check if clicking move or attack target ──
  if (state.selection.mode === 'unit-selected' && state.selection.selectedUnitId) {
    const unit = state.units.find(u => u.id === state.selection.selectedUnitId)
    if (unit) {
      // Move?
      if (state.selection.validMoveHexes.some(h => hexEquals(h, clickedHex))) {
        moveUnit(state, unit, clickedHex)

        // Re-select to update attack range from new position
        selectUnit(state, unit.id)
        uiUpdates.selectedUnitInfo = unit
        return { uiUpdates, stateChanged: true }
      }

      // Attack?
      if (state.selection.validAttackHexes.some(h => hexEquals(h, clickedHex))) {
        const logs = attackUnit(state, unit, clickedHex)
        state.combatLog.push(...logs)
        clearSelection(state)
        uiUpdates.selectedUnitInfo = null

        // Check win
        const winner = checkWinCondition(state)
        if (winner) {
          state.gameOver = true
          state.winner = winner
          uiUpdates.showGameOver = true
        }

        return { uiUpdates, stateChanged: true }
      }
    }
  }

  // ── CHECK what was clicked ──
  // Own unit?
  const clickedUnit = state.units.find(u => hexEquals(u.hex, clickedHex) && u.faction === faction)
  if (clickedUnit) {
    selectUnit(state, clickedUnit.id)
    uiUpdates.selectedUnitInfo = clickedUnit
    uiUpdates.selectedBuildingInfo = null
    uiUpdates.selectedTileInfo = tile
    return { uiUpdates, stateChanged: true }
  }

  // Own building?
  const clickedBuilding = state.buildings.find(b => hexEquals(b.hex, clickedHex) && b.faction === faction)
  if (clickedBuilding) {
    selectBuilding(state, clickedBuilding.id)
    uiUpdates.selectedBuildingInfo = clickedBuilding
    uiUpdates.selectedUnitInfo = null
    uiUpdates.selectedTileInfo = tile

    // Open train menu for barracks/magetower
    if (clickedBuilding.type === 'barracks' || clickedBuilding.type === 'magetower') {
      uiUpdates.showTrainMenu = true
    }
    return { uiUpdates, stateChanged: true }
  }

  // Enemy unit or building (show info)
  const enemyUnit = state.units.find(u => hexEquals(u.hex, clickedHex))
  if (enemyUnit) {
    uiUpdates.selectedUnitInfo = enemyUnit
    uiUpdates.selectedBuildingInfo = null
    uiUpdates.selectedTileInfo = tile
    clearSelection(state)
    return { uiUpdates, stateChanged: true }
  }

  const enemyBuilding = state.buildings.find(b => hexEquals(b.hex, clickedHex))
  if (enemyBuilding) {
    uiUpdates.selectedBuildingInfo = enemyBuilding
    uiUpdates.selectedUnitInfo = null
    uiUpdates.selectedTileInfo = tile
    clearSelection(state)
    return { uiUpdates, stateChanged: true }
  }

  // Empty tile
  clearSelection(state)
  uiUpdates.selectedUnitInfo = null
  uiUpdates.selectedBuildingInfo = null
  uiUpdates.selectedTileInfo = tile
  uiUpdates.showTrainMenu = false
  return { uiUpdates, stateChanged: true }
}
