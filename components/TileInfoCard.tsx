'use client'

import type { Tile } from '@/game/types'
import { TERRAIN_DEF_BONUS, TERRAIN_MOVE_COST } from '@/game/constants'

interface TileInfoCardProps {
  tile: Tile
}

const TERRAIN_LABELS: Record<string, string> = {
  grass: 'Grassland',
  forest: 'Forest',
  water: 'Water',
  special: 'Crystal Node',
}

const TERRAIN_COLORS: Record<string, string> = {
  grass: '#6aad6a',
  forest: '#3a7a3a',
  water: '#4a8abf',
  special: '#9a6adf',
}

export default function TileInfoCard({ tile }: TileInfoCardProps) {
  const moveCost = TERRAIN_MOVE_COST[tile.terrain]
  const defBonus = TERRAIN_DEF_BONUS[tile.terrain]

  return (
    <div className="absolute top-20 left-4 z-10 w-44">
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 15, 30, 0.93)', border: '1px solid rgba(200, 164, 90, 0.2)' }}>
        <p className="text-sm font-mono font-bold mb-1" style={{ color: TERRAIN_COLORS[tile.terrain] }}>
          {TERRAIN_LABELS[tile.terrain]}
        </p>
        <div className="flex flex-col gap-0.5 text-xs font-mono text-[#8a8a9a]">
          <span>Move Cost: {moveCost === Infinity ? 'Impassable' : moveCost}</span>
          {defBonus > 0 && <span>DEF Bonus: +{defBonus}</span>}
          {tile.terrain === 'special' && <span className="text-[#c8a45a]">+5 Gold/turn (control)</span>}
        </div>
      </div>
    </div>
  )
}
