'use client'

import type { GameState, BuildingType } from '@/game/types'
import { BUILDING_INFO, MAX_TOWNHALLS } from '@/game/constants'
import { currentFaction, enterBuildMode } from '@/game/game-logic'
import { getBuildingAssetKey } from '@/game/assets'
import Image from 'next/image'

interface BuildMenuProps {
  state: GameState
  onClose: () => void
  onUpdate: () => void
}

const BUILDING_NAMES: Record<BuildingType, string> = {
  townhall: 'Town Hall',
  barracks: 'Barracks',
  magetower: 'Mage Tower',
  watchtower: 'Watchtower',
  wall: 'Wall',
}

const BUILDING_FILE_MAP: Record<BuildingType, string> = {
  townhall: 'townhall',
  barracks: 'barlack',
  magetower: 'magetower',
  watchtower: 'watchtower',
  wall: 'wall',
}

export default function BuildMenu({ state, onClose, onUpdate }: BuildMenuProps) {
  const faction = currentFaction(state)
  const player = state.players.find(p => p.faction === faction)!
  const suffix = faction === 'beast' ? 'bf' : 'dm'

  const buildingTypes: BuildingType[] = ['townhall', 'barracks', 'magetower', 'watchtower', 'wall']

  const handleBuild = (type: BuildingType) => {
    enterBuildMode(state, type)
    onUpdate()
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
      <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(15, 15, 30, 0.95)', border: '1px solid rgba(200, 164, 90, 0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-bold text-[#c8a45a] uppercase tracking-wider">Build</h3>
          <button onClick={onClose} className="text-[#8a8a9a] hover:text-[#c8a45a] font-mono text-sm" aria-label="Close build menu">X</button>
        </div>
        <div className="flex gap-3">
          {buildingTypes.map(type => {
            const info = BUILDING_INFO[type]
            const canAfford = player.gold >= info.cost
            const atMax = type === 'townhall' &&
              state.buildings.filter(b => b.type === 'townhall' && b.faction === faction).length >= MAX_TOWNHALLS
            const disabled = !canAfford || atMax
            const imgSrc = `/assets/buildings/${BUILDING_FILE_MAP[type]}_${suffix}.jpg`

            return (
              <button
                key={type}
                onClick={() => handleBuild(type)}
                disabled={disabled}
                className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="relative w-14 h-14 rounded overflow-hidden border border-[#c8a45a]/30">
                  <Image src={imgSrc} alt={BUILDING_NAMES[type]} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
                </div>
                <span className="text-[10px] font-mono text-[#e0d0b0] w-16 text-center leading-tight">{BUILDING_NAMES[type]}</span>
                <span className="text-[10px] font-mono text-[#c8a45a]">{info.cost}g</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
