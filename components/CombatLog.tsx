'use client'

import type { CombatLogEntry } from '@/game/types'
import { useEffect, useRef } from 'react'

interface CombatLogProps {
  logs: CombatLogEntry[]
}

const TYPE_COLORS: Record<string, string> = {
  attack: '#df6a6a',
  kill: '#ff4444',
  build: '#6adf6a',
  train: '#6a9adf',
  income: '#c8a45a',
  info: '#8a8a9a',
}

export default function CombatLog({ logs }: CombatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs.length])

  const recentLogs = logs.slice(-15)

  return (
    <div className="absolute top-20 right-4 z-10 w-64">
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 15, 30, 0.85)', border: '1px solid rgba(200, 164, 90, 0.15)' }}>
        <p className="text-[10px] font-mono text-[#8a8a9a] uppercase tracking-wider mb-2">Combat Log</p>
        <div ref={scrollRef} className="max-h-48 overflow-y-auto flex flex-col gap-1 scrollbar-thin">
          {recentLogs.map((log, i) => (
            <p key={i} className="text-[11px] font-mono leading-tight" style={{ color: TYPE_COLORS[log.type] || '#8a8a9a' }}>
              <span className="text-[#8a8a9a]/50">[{log.turn}] </span>
              {log.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
