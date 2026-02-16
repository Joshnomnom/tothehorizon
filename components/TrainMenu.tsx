'use client'

import type { GameState } from '@/game/types'
import { UNIT_TIERS } from '@/game/constants'
import { currentFaction } from '@/game/game-logic'
import { trainUnit } from '@/game/game-logic'
import Image from 'next/image'

interface TrainMenuProps {
  state: GameState
  buildingId: string
  onClose: () => void
  onUpdate: () => void
}

export default function TrainMenu({ state, buildingId, onClose, onUpdate }: TrainMenuProps) {
  const building = state.buildings.find(b => b.id === buildingId)
  if (!building) return null

  const faction = currentFaction(state)
  const player = state.players.find(p => p.faction === faction)!
  const prefix = faction === 'beast' ? 'beast' : 'demon'

  const availableTiers = UNIT_TIERS.filter(t => {
    if (building.type === 'barracks') return t.trainedAt === 'barracks'
    if (building.type === 'magetower') return t.trainedAt === 'magetower'
    return false
  })

  const handleTrain = (tierIndex: number) => {
    const variant = Math.floor(Math.random() * 3)
    const log = trainUnit(state, tierIndex, variant, buildingId)
    if (log) {
      state.combatLog.push(log)
    }
    onUpdate()
  }

  const buildingName = building.type === 'barracks' ? 'Barracks' : 'Mage Tower'

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
      <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(15, 15, 30, 0.95)', border: '1px solid rgba(200, 164, 90, 0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-bold text-[#c8a45a] uppercase tracking-wider">Train - {buildingName}</h3>
          <button onClick={onClose} className="text-[#8a8a9a] hover:text-[#c8a45a] font-mono text-sm" aria-label="Close train menu">X</button>
        </div>
        <div className="flex gap-3">
          {availableTiers.map((tier, i) => {
            const globalIndex = UNIT_TIERS.indexOf(tier)
            const canAfford = player.gold >= tier.cost
            const spriteIdx = tier.spriteIndices[0].toString().padStart(2, '0')
            const imgSrc = `/assets/${prefix}Clan/units/${prefix}_${spriteIdx}.png`

            return (
              <button
                key={tier.tier}
                onClick={() => handleTrain(globalIndex)}
                disabled={!canAfford}
                className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="relative w-14 h-14 rounded overflow-hidden border border-[#c8a45a]/30">
                  <Image src={imgSrc} alt={tier.role} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
                </div>
                <span className="text-[10px] font-mono text-[#e0d0b0]">{tier.role}</span>
                <div className="flex gap-2 text-[9px] font-mono text-[#8a8a9a]">
                  <span>ATK:{tier.atk}</span>
                  <span>DEF:{tier.def}</span>
                </div>
                <div className="flex gap-2 text-[9px] font-mono text-[#8a8a9a]">
                  <span>HP:{tier.hp}</span>
                  <span>RNG:{tier.range}</span>
                </div>
                <span className="text-[10px] font-mono text-[#c8a45a]">{tier.cost}g</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
