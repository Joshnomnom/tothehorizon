'use client'

import Image from 'next/image'

interface ActionPanelProps {
  onBuild: () => void
  onEndTurn: () => void
  onDictionary: () => void
  isPlayerTurn: boolean
}

export default function ActionPanel({ onBuild, onEndTurn, onDictionary, isPlayerTurn }: ActionPanelProps) {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 mb-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ backgroundColor: 'rgba(15, 15, 30, 0.9)', border: '1px solid rgba(200, 164, 90, 0.3)' }}
      >
        <ActionButton
          src="/assets/ui/build.jpg"
          label="Build"
          onClick={onBuild}
          disabled={!isPlayerTurn}
        />
        <ActionButton
          src="/assets/ui/endturn.jpg"
          label="End Turn"
          onClick={onEndTurn}
          disabled={!isPlayerTurn}
        />
        <ActionButton
          src="/assets/ui/units_dictionary.jpg"
          label="Units"
          onClick={onDictionary}
          disabled={false}
        />
      </div>
    </div>
  )
}

function ActionButton({
  src,
  label,
  onClick,
  disabled,
}: {
  src: string
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 group disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-[#c8a45a]/40 group-hover:border-[#c8a45a] transition-colors"
        style={{ imageRendering: 'pixelated' }}
      >
        <Image src={src} alt={label} fill className="object-cover" style={{ imageRendering: 'pixelated' }} />
      </div>
      <span className="text-[10px] font-mono text-[#c8a45a]/80 group-hover:text-[#c8a45a] uppercase tracking-wider transition-colors">
        {label}
      </span>
    </button>
  )
}
