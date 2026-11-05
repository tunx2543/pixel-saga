'use client'

import { currentMap } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'

export function WorldBanner() {
  useGame()
  const map = currentMap()
  if (map.id !== 'abyss' && map.id !== 'volcano') return null

  const isAbyss = map.id === 'abyss'
  return (
    <aside className="pointer-events-none absolute right-2 top-2 z-10 hidden w-44 overflow-hidden rounded-md border border-white/15 bg-black/35 shadow-xl sm:block">
      <img
        src={isAbyss ? '/images/art/dungeon-banner.png' : '/images/art/demon-lord.png'}
        alt={isAbyss ? 'ภาพดันเจี้ยน Abyss' : 'ภาพราชาปีศาจ'}
        className="asset-no-bg h-16 w-full object-cover opacity-80"
      />
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-white/90">
        {isAbyss ? 'ABYSS DUNGEON' : 'DEMON LORD CITADEL'}
      </div>
    </aside>
  )
}
