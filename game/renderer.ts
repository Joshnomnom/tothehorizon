import type { GameState, AssetCache, HexCoord, Camera } from './types'
import { HEX_SIZE, COLORS } from './constants'
import { hexToPixel, hexKey, hexEquals } from './hex-utils'
import { getBuildingAssetKey } from './assets'

const SQRT3 = Math.sqrt(3)

// ── Draw a flat-top hexagon path ──
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// ── Get screen position from hex (with camera transform) ──
function hexToScreen(h: HexCoord, cam: Camera): { x: number; y: number } {
  const { x, y } = hexToPixel(h)
  return {
    x: (x - cam.x) * cam.zoom,
    y: (y - cam.y) * cam.zoom,
  }
}

// ── Main render function ──
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: AssetCache,
  canvasWidth: number,
  canvasHeight: number,
  hoveredHex: HexCoord | null
) {
  const cam = state.camera

  // Clear
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.save()

  // Offset to center the map a bit
  ctx.translate(canvasWidth / 2, canvasHeight / 2)

  const size = HEX_SIZE * cam.zoom

  // ── Render tiles ──
  for (const [, tile] of state.map) {
    const { x, y } = hexToScreen(tile.hex, cam)

    // Frustum cull
    if (x < -size * 2 || x > canvasWidth + size * 2 || y < -size * 2 || y > canvasHeight + size * 2) continue

    const assetKey = `tile_${tile.terrain}_${tile.level}`
    const img = assets.get(assetKey)

    if (img) {
      // Draw tile image fitted to hex
      const imgSize = size * 2.1
      ctx.drawImage(img, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize)
    } else {
      // Fallback color
      hexPath(ctx, x, y, size)
      const colors: Record<string, string> = {
        grass: '#4a7c4f',
        forest: '#2d5a2d',
        water: '#2a5a8c',
        special: '#6b3fa0',
      }
      ctx.fillStyle = colors[tile.terrain] || '#555'
      ctx.fill()
    }

    // Hex border
    hexPath(ctx, x, y, size)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // ── Render highlights ──
  // Move highlights
  for (const h of state.selection.validMoveHexes) {
    const { x, y } = hexToScreen(h, cam)
    hexPath(ctx, x, y, size)
    ctx.fillStyle = COLORS.moveTint
    ctx.fill()
  }

  // Attack highlights
  for (const h of state.selection.validAttackHexes) {
    const { x, y } = hexToScreen(h, cam)
    hexPath(ctx, x, y, size)
    ctx.fillStyle = COLORS.attackTint
    ctx.fill()
  }

  // Build highlights
  for (const h of state.selection.validBuildHexes) {
    const { x, y } = hexToScreen(h, cam)
    hexPath(ctx, x, y, size)
    ctx.fillStyle = COLORS.buildTint
    ctx.fill()
  }

  // Hover highlight
  if (hoveredHex && state.map.has(hexKey(hoveredHex))) {
    const { x, y } = hexToScreen(hoveredHex, cam)
    hexPath(ctx, x, y, size)
    ctx.strokeStyle = COLORS.hoverOutline
    ctx.lineWidth = 2 * cam.zoom
    ctx.stroke()
  }

  // ── Render buildings ──
  for (const building of state.buildings) {
    const { x, y } = hexToScreen(building.hex, cam)
    const assetKey = getBuildingAssetKey(building.type, building.faction)
    const img = assets.get(assetKey)

    const bSize = size * 1.4
    if (img) {
      ctx.drawImage(img, x - bSize / 2, y - bSize / 2, bSize, bSize)
    } else {
      // Fallback
      ctx.fillStyle = building.faction === 'beast' ? COLORS.beastAccent : COLORS.demonAccent
      ctx.fillRect(x - bSize / 3, y - bSize / 3, bSize * 0.66, bSize * 0.66)
    }

    // Building HP bar
    if (building.hp < building.maxHp) {
      drawHpBar(ctx, x, y - bSize / 2 - 4 * cam.zoom, bSize * 0.7, 4 * cam.zoom, building.hp, building.maxHp, cam.zoom)
    }

    // Selection outline for buildings
    if (state.selection.selectedBuildingId === building.id) {
      hexPath(ctx, x, y, size)
      ctx.strokeStyle = COLORS.selectionOutline
      ctx.lineWidth = 3 * cam.zoom
      ctx.stroke()
    }
  }

  // ── Render units ──
  for (const unit of state.units) {
    const { x, y } = hexToScreen(unit.hex, cam)
    const prefix = unit.faction === 'beast' ? 'beast_unit' : 'demon_unit'
    const assetKey = `${prefix}_${unit.spriteIndex}`
    const img = assets.get(assetKey)

    const uSize = size * 1.5

    if (img) {
      ctx.drawImage(img, x - uSize / 2, y - uSize / 2, uSize, uSize)
    } else {
      // Fallback circle
      ctx.beginPath()
      ctx.arc(x, y, size * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = unit.faction === 'beast' ? COLORS.beastAccent : COLORS.demonAccent
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // HP bar
    drawHpBar(ctx, x, y - uSize / 2 - 6 * cam.zoom, uSize * 0.6, 4 * cam.zoom, unit.stats.hp, unit.stats.maxHp, cam.zoom)

    // Action indicators (dimmed if already acted)
    if (unit.hasMoved && unit.hasAttacked) {
      ctx.globalAlpha = 0.4
      hexPath(ctx, x, y, size * 0.9)
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Selection outline for units
    if (state.selection.selectedUnitId === unit.id) {
      hexPath(ctx, x, y, size)
      ctx.strokeStyle = COLORS.selectionOutline
      ctx.lineWidth = 3 * cam.zoom
      ctx.stroke()
    }

    // Faction indicator dot
    ctx.beginPath()
    ctx.arc(x + uSize / 3, y - uSize / 3, 4 * cam.zoom, 0, Math.PI * 2)
    ctx.fillStyle = unit.faction === 'beast' ? '#6adf6a' : '#df6a6a'
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.restore()
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  hp: number,
  maxHp: number,
  _zoom: number
) {
  const ratio = hp / maxHp
  ctx.fillStyle = COLORS.hpBarBg
  ctx.fillRect(x - width / 2, y, width, height)
  ctx.fillStyle = ratio > 0.5 ? COLORS.hpBarFill : COLORS.hpBarLow
  ctx.fillRect(x - width / 2, y, width * ratio, height)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 0.5
  ctx.strokeRect(x - width / 2, y, width, height)
}
