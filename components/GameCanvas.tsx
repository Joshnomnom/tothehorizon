'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { GameState, AssetCache, HexCoord, UIState } from '@/game/types'
import { preloadAssets } from '@/game/assets'
import { createInitialState } from '@/game/state'
import { render } from '@/game/renderer'
import { canvasToHex, handleClick } from '@/game/input-handler'
import { endTurn, clearSelection, currentFaction, checkWinCondition } from '@/game/game-logic'
import { executeAITurn } from '@/game/ai'
import HUD from './HUD'
import ActionPanel from './ActionPanel'
import BuildMenu from './BuildMenu'
import TrainMenu from './TrainMenu'
import UnitDictionary from './UnitDictionary'
import UnitInfoCard from './UnitInfoCard'
import TileInfoCard from './TileInfoCard'
import CombatLog from './CombatLog'
import GameOverModal from './GameOverModal'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const assetsRef = useRef<AssetCache | null>(null)
  const animFrameRef = useRef<number>(0)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const camStart = useRef({ x: 0, y: 0 })
  const hoveredHex = useRef<HexCoord | null>(null)

  const [loading, setLoading] = useState(true)
  const [uiState, setUiState] = useState<UIState>({
    showBuildMenu: false,
    showTrainMenu: false,
    showUnitDictionary: false,
    showGameOver: false,
    hoveredHex: null,
    selectedUnitInfo: null,
    selectedBuildingInfo: null,
    selectedTileInfo: null,
  })
  const [, forceUpdate] = useState(0)

  // Force re-render to sync React overlay with canvas state
  const triggerUpdate = useCallback(() => forceUpdate(v => v + 1), [])

  // ── Initialize game ──
  useEffect(() => {
    async function init() {
      const assets = await preloadAssets()
      assetsRef.current = assets
      stateRef.current = createInitialState()
      setLoading(false)
    }
    init()
  }, [])

  // ── Game render loop ──
  useEffect(() => {
    if (loading) return

    function renderLoop() {
      const canvas = canvasRef.current
      const state = stateRef.current
      const assets = assetsRef.current
      if (!canvas || !state || !assets) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      render(ctx, state, assets, canvas.width, canvas.height, hoveredHex.current)
      animFrameRef.current = requestAnimationFrame(renderLoop)
    }

    animFrameRef.current = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [loading])

  // ── Keyboard input ──
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const state = stateRef.current
      if (!state) return

      const scrollSpeed = 20
      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          state.camera.y -= scrollSpeed
          break
        case 's':
        case 'ArrowDown':
          state.camera.y += scrollSpeed
          break
        case 'a':
        case 'ArrowLeft':
          state.camera.x -= scrollSpeed
          break
        case 'd':
        case 'ArrowRight':
          state.camera.x += scrollSpeed
          break
        case 'Escape':
          clearSelection(state)
          setUiState(prev => ({
            ...prev,
            showBuildMenu: false,
            showTrainMenu: false,
            showUnitDictionary: false,
            selectedUnitInfo: null,
            selectedBuildingInfo: null,
          }))
          triggerUpdate()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [triggerUpdate])

  // ── Mouse handlers ──
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    const state = stateRef.current
    if (state) {
      camStart.current = { x: state.camera.x, y: state.camera.y }
    }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current
    const canvas = canvasRef.current
    if (!state || !canvas) return

    // Check if dragging
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (e.buttons === 1 && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      isDragging.current = true
      state.camera.x = camStart.current.x - dx / state.camera.zoom
      state.camera.y = camStart.current.y - dy / state.camera.zoom
      return
    }

    // Update hovered hex
    const rect = canvas.getBoundingClientRect()
    hoveredHex.current = canvasToHex(
      e.clientX,
      e.clientY,
      rect,
      state,
      canvas.width,
      canvas.height
    )
  }, [])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current
    const canvas = canvasRef.current
    if (!state || !canvas) return
    if (state.gameOver) return

    // Ignore if was dragging
    if (isDragging.current) {
      isDragging.current = false
      return
    }

    // Don't handle clicks during AI turn
    if (state.players[state.currentPlayerIndex].isAI) return

    const rect = canvas.getBoundingClientRect()
    const clickedHex = canvasToHex(e.clientX, e.clientY, rect, state, canvas.width, canvas.height)

    const result = handleClick(state, clickedHex, uiState)
    if (result.stateChanged) {
      setUiState(prev => ({ ...prev, ...result.uiUpdates }))
      triggerUpdate()
    }
  }, [uiState, triggerUpdate])

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const state = stateRef.current
    if (!state) return

    const zoomSpeed = 0.1
    if (e.deltaY < 0) {
      state.camera.zoom = Math.min(2, state.camera.zoom + zoomSpeed)
    } else {
      state.camera.zoom = Math.max(0.4, state.camera.zoom - zoomSpeed)
    }
  }, [])

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const state = stateRef.current
    if (!state) return
    clearSelection(state)
    setUiState(prev => ({
      ...prev,
      showBuildMenu: false,
      showTrainMenu: false,
      selectedUnitInfo: null,
      selectedBuildingInfo: null,
    }))
    triggerUpdate()
  }, [triggerUpdate])

  // ── End turn handler ──
  const handleEndTurn = useCallback(() => {
    const state = stateRef.current
    if (!state || state.gameOver) return
    if (state.players[state.currentPlayerIndex].isAI) return

    endTurn(state)
    setUiState(prev => ({
      ...prev,
      showBuildMenu: false,
      showTrainMenu: false,
      selectedUnitInfo: null,
      selectedBuildingInfo: null,
    }))
    triggerUpdate()

    // AI turn
    if (state.players[state.currentPlayerIndex].isAI) {
      setTimeout(() => {
        const aiLogs = executeAITurn(state)
        state.combatLog.push(...aiLogs)

        const winner = checkWinCondition(state)
        if (winner) {
          state.gameOver = true
          state.winner = winner
          setUiState(prev => ({ ...prev, showGameOver: true }))
        }

        endTurn(state)
        triggerUpdate()
      }, 600)
    }
  }, [triggerUpdate])

  // ── Build menu handler ──
  const handleOpenBuildMenu = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      showBuildMenu: !prev.showBuildMenu,
      showTrainMenu: false,
      showUnitDictionary: false,
    }))
  }, [])

  const handleOpenDictionary = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      showUnitDictionary: !prev.showUnitDictionary,
      showBuildMenu: false,
      showTrainMenu: false,
    }))
  }, [])

  const handleRestart = useCallback(() => {
    stateRef.current = createInitialState()
    setUiState({
      showBuildMenu: false,
      showTrainMenu: false,
      showUnitDictionary: false,
      showGameOver: false,
      hoveredHex: null,
      selectedUnitInfo: null,
      selectedBuildingInfo: null,
      selectedTileInfo: null,
    })
    triggerUpdate()
  }, [triggerUpdate])

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a2e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#c8a45a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c8a45a] font-mono text-lg tracking-wider">Loading assets...</p>
        </div>
      </div>
    )
  }

  const state = stateRef.current!

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      />

      {/* HUD overlay */}
      <HUD state={state} />

      {/* Selected unit info */}
      {uiState.selectedUnitInfo && (
        <UnitInfoCard unit={uiState.selectedUnitInfo} />
      )}

      {/* Tile info */}
      {uiState.selectedTileInfo && !uiState.selectedUnitInfo && !uiState.selectedBuildingInfo && (
        <TileInfoCard tile={uiState.selectedTileInfo} />
      )}

      {/* Combat log */}
      <CombatLog logs={state.combatLog} />

      {/* Action panel */}
      <ActionPanel
        onBuild={handleOpenBuildMenu}
        onEndTurn={handleEndTurn}
        onDictionary={handleOpenDictionary}
        isPlayerTurn={!state.players[state.currentPlayerIndex].isAI}
      />

      {/* Build menu popup */}
      {uiState.showBuildMenu && (
        <BuildMenu
          state={state}
          onClose={() => setUiState(prev => ({ ...prev, showBuildMenu: false }))}
          onUpdate={() => {
            triggerUpdate()
            setUiState(prev => ({ ...prev, showBuildMenu: false }))
          }}
        />
      )}

      {/* Train menu popup */}
      {uiState.showTrainMenu && state.selection.selectedBuildingId && (
        <TrainMenu
          state={state}
          buildingId={state.selection.selectedBuildingId}
          onClose={() => setUiState(prev => ({ ...prev, showTrainMenu: false }))}
          onUpdate={() => {
            triggerUpdate()
            setUiState(prev => ({ ...prev, showTrainMenu: false }))
          }}
        />
      )}

      {/* Unit dictionary modal */}
      {uiState.showUnitDictionary && (
        <UnitDictionary
          onClose={() => setUiState(prev => ({ ...prev, showUnitDictionary: false }))}
        />
      )}

      {/* Game over modal */}
      {uiState.showGameOver && state.winner && (
        <GameOverModal
          winner={state.winner}
          turn={state.turn}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
