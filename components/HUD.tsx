'use client'

import type { GameState } from '@/game/types'
import Image from 'next/image'

interface HUDProps {
  state: GameState
}

export default function HUD({ state }: HUDProps) {
  const currentPlayer = state.players[state.currentPlayerIndex]
  const isBeast = currentPlayer.faction === 'beast'
  const factionName = isBeast ? 'Beastfolk Tribe' : 'Demon Clan'
  const logoSrc = isBeast ? '/assets/beastClan/beastClan.png' : '/assets/demonClan/demonClan.png'
  const accentColor = isBeast ? '#4a9e5c' : '#b03a3a'

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-2 mx-4 mt-3 rounded-lg pointer-events-auto"
        style={{ backgroundColor: 'rgba(15, 15, 30, 0.9)', borderBottom: `2px solid ${accentColor}` }}
      >
        {/* Left: Faction logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: accentColor }}>
            <Image src={logoSrc} alt={factionName} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div>
            <p className="text-sm font-mono font-bold" style={{ color: accentColor }}>{factionName}</p>
            <p className="text-xs font-mono text-[#8a8a9a]">
              {currentPlayer.isAI ? 'AI Turn...' : 'Your Turn'}
            </p>
          </div>
        </div>

        {/* Center: Turn counter */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-mono text-[#8a8a9a] uppercase tracking-widest">Turn</p>
          <p className="text-2xl font-mono font-bold text-[#c8a45a]">{state.turn}</p>
        </div>

        {/* Right: Gold */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <p className="text-xs font-mono text-[#8a8a9a] uppercase tracking-wider">Gold</p>
            <p className="text-xl font-mono font-bold text-[#c8a45a]">{currentPlayer.gold}</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#c8a45a] flex items-center justify-center">
            <span className="text-xs font-bold text-[#1a1a2e]">G</span>
          </div>
        </div>
      </div>
    </div>
  )
}
