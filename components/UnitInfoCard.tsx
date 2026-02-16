'use client'

import type { Unit } from '@/game/types'
import Image from 'next/image'

interface UnitInfoCardProps {
  unit: Unit
}

export default function UnitInfoCard({ unit }: UnitInfoCardProps) {
  const prefix = unit.faction === 'beast' ? 'beast' : 'demon'
  const spriteIdx = unit.spriteIndex.toString().padStart(2, '0')
  const imgSrc = `/assets/${prefix}Clan/units/${prefix}_${spriteIdx}.png`
  const factionName = unit.faction === 'beast' ? 'Beastfolk' : 'Demon'
  const accentColor = unit.faction === 'beast' ? '#4a9e5c' : '#b03a3a'
  const hpRatio = unit.stats.hp / unit.stats.maxHp

  return (
    <div className="absolute top-20 left-4 z-10 w-52">
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 15, 30, 0.93)', border: `1px solid ${accentColor}40` }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-10 h-10 rounded overflow-hidden border" style={{ borderColor: accentColor }}>
            <Image src={imgSrc} alt={unit.stats.role} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div>
            <p className="text-xs font-mono font-bold" style={{ color: accentColor }}>{factionName}</p>
            <p className="text-sm font-mono font-bold text-[#e0d0b0]">{unit.stats.role}</p>
          </div>
        </div>

        {/* HP bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono text-[#8a8a9a] mb-0.5">
            <span>HP</span>
            <span>{unit.stats.hp}/{unit.stats.maxHp}</span>
          </div>
          <div className="h-2 rounded-full bg-[#333] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${hpRatio * 100}%`,
                backgroundColor: hpRatio > 0.5 ? '#44cc44' : '#cc4444',
              }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
          <StatRow label="ATK" value={unit.stats.atk} color="#df6a6a" />
          <StatRow label="DEF" value={unit.stats.def} color="#6a9adf" />
          <StatRow label="RNG" value={unit.stats.range} color="#dfdf6a" />
          <StatRow label="MOV" value={unit.stats.move} color="#e0d0b0" />
        </div>

        {/* Status */}
        <div className="mt-2 flex gap-2">
          {unit.hasMoved && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8a8a9a]">Moved</span>
          )}
          {unit.hasAttacked && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8a8a9a]">Attacked</span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8a8a9a]">{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  )
}
