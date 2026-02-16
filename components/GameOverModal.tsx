'use client'

import type { Faction } from '@/game/types'
import Image from 'next/image'

interface GameOverModalProps {
  winner: Faction
  turn: number
  onRestart: () => void
}

export default function GameOverModal({ winner, turn, onRestart }: GameOverModalProps) {
  const isBeast = winner === 'beast'
  const factionName = isBeast ? 'Beastfolk Tribe' : 'Demon Clan'
  const logoSrc = isBeast ? '/assets/beastClan/beastClan.png' : '/assets/demonClan/demonClan.png'
  const accentColor = isBeast ? '#4a9e5c' : '#b03a3a'
  const isPlayerWin = isBeast

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-xl p-8 max-w-md w-full mx-4 text-center"
        style={{ backgroundColor: 'rgba(15, 15, 30, 0.97)', border: `2px solid ${accentColor}` }}
      >
        <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4" style={{ borderColor: accentColor }}>
          <Image src={logoSrc} alt={factionName} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
        </div>

        <h2 className="text-2xl font-mono font-bold mb-2"
          style={{ color: accentColor }}
        >
          {isPlayerWin ? 'Victory!' : 'Defeat!'}
        </h2>

        <p className="text-sm font-mono text-[#e0d0b0] mb-1">
          {factionName} {isPlayerWin ? 'conquers' : 'has conquered'} the land!
        </p>
        <p className="text-xs font-mono text-[#8a8a9a] mb-6">
          Battle concluded on turn {turn}
        </p>

        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-lg font-mono font-bold text-sm uppercase tracking-wider transition-colors"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
            border: `1px solid ${accentColor}60`,
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
