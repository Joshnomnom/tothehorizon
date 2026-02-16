'use client'

import { useState } from 'react'
import { UNIT_TIERS } from '@/game/constants'
import type { Faction } from '@/game/types'
import Image from 'next/image'

interface UnitDictionaryProps {
  onClose: () => void
}

export default function UnitDictionary({ onClose }: UnitDictionaryProps) {
  const [faction, setFaction] = useState<Faction>('beast')
  const prefix = faction === 'beast' ? 'beast' : 'demon'

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: 'rgba(15, 15, 30, 0.97)', border: '1px solid rgba(200, 164, 90, 0.4)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold text-[#c8a45a] uppercase tracking-wider">Unit Dictionary</h2>
          <button onClick={onClose} className="text-[#8a8a9a] hover:text-[#c8a45a] font-mono text-lg px-2" aria-label="Close dictionary">X</button>
        </div>

        {/* Faction toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setFaction('beast')}
            className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
              faction === 'beast'
                ? 'bg-[#4a9e5c]/20 text-[#4a9e5c] border border-[#4a9e5c]/50'
                : 'text-[#8a8a9a] hover:text-[#e0d0b0] border border-transparent'
            }`}
          >
            Beastfolk
          </button>
          <button
            onClick={() => setFaction('demon')}
            className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
              faction === 'demon'
                ? 'bg-[#b03a3a]/20 text-[#b03a3a] border border-[#b03a3a]/50'
                : 'text-[#8a8a9a] hover:text-[#e0d0b0] border border-transparent'
            }`}
          >
            Demon Clan
          </button>
        </div>

        {/* Unit tiers */}
        <div className="flex flex-col gap-4">
          {UNIT_TIERS.map(tier => (
            <div key={tier.tier} className="flex gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              {/* Unit sprites */}
              <div className="flex gap-2 shrink-0">
                {tier.spriteIndices.map(idx => {
                  const spriteIdx = idx.toString().padStart(2, '0')
                  return (
                    <div key={idx} className="relative w-12 h-12 rounded overflow-hidden border border-[#c8a45a]/20">
                      <Image
                        src={`/assets/${prefix}Clan/units/${prefix}_${spriteIdx}.png`}
                        alt={`${tier.role} variant ${idx}`}
                        fill
                        className="object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm text-[#e0d0b0]">
                    Tier {tier.tier}: {tier.role}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c8a45a]/10 text-[#c8a45a]">
                    {tier.cost}g
                  </span>
                  <span className="text-[10px] font-mono text-[#8a8a9a]">
                    ({tier.trainedAt === 'barracks' ? 'Barracks' : 'Mage Tower'})
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-[#8a8a9a]">
                  <span>HP: <span className="text-[#44cc44]">{tier.hp}</span></span>
                  <span>ATK: <span className="text-[#df6a6a]">{tier.atk}</span></span>
                  <span>DEF: <span className="text-[#6a9adf]">{tier.def}</span></span>
                  <span>RNG: <span className="text-[#dfdf6a]">{tier.range}</span></span>
                  <span>MOV: <span className="text-[#e0d0b0]">{tier.move}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
