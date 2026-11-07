'use client'

import { currentMap, game } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'

export function WorldBanner() {
  useGame()
  const map = currentMap()
  const announcement = game.announcement && game.announcement.until > Date.now() ? game.announcement : null
  if (map.id !== 'abyss' && map.id !== 'volcano' && !announcement) return null

  const isAbyss = map.id === 'abyss'
  return (
    <>
      {announcement && (
        <aside className="pointer-events-none absolute left-1/2 top-2 z-30 w-[min(92vw,34rem)] -translate-x-1/2 rounded-md border border-yellow-300/50 bg-black/80 px-3 py-2 text-center shadow-xl">
          <div className="text-[9px] font-bold tracking-[0.18em] text-yellow-300">ประกาศจาก GM</div>
          <div className="mt-0.5 truncate text-xs font-semibold text-white">{announcement.body}</div>
        </aside>
      )}
      {(map.id === 'abyss' || map.id === 'volcano') && <aside className="pointer-events-none absolute right-2 top-2 z-10 hidden w-44 overflow-hidden rounded-md border border-white/15 bg-black/35 shadow-xl sm:block">
      <img
        src={isAbyss ? '/images/art/dungeon-banner.png' : '/images/art/demon-lord.png'}
        alt={isAbyss ? 'ภาพดันเจี้ยน Abyss' : 'ภาพราชาปีศาจ'}
        className="asset-no-bg h-16 w-full object-cover opacity-80"
      />
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-white/90">
        {isAbyss ? 'ABYSS DUNGEON' : 'DEMON LORD CITADEL'}
      </div>
    </aside>}
    </>
  )
}
