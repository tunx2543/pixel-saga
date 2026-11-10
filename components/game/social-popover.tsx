'use client'

import { X } from 'lucide-react'
import { game, notify } from '@/lib/game/engine'
import { FriendsPanel } from './panels/friends-panel'

export function SocialPopover() {
  if (!game.socialMenuOpen) return null
  return (
    <div className="pointer-events-auto absolute right-3 top-14 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-accent/50 bg-background/95 p-2 shadow-2xl backdrop-blur-md" role="dialog" aria-label="รายชื่อเพื่อน">
      <div className="flex items-center justify-between border-b border-border px-2 pb-2">
        <div>
          <p className="text-sm font-bold text-accent">รายชื่อเพื่อน</p>
          <p className="text-[10px] text-muted-foreground">เพื่อนและคำขอของคุณ</p>
        </div>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="ปิดรายชื่อเพื่อน" onClick={() => { game.socialMenuOpen = false; notify() }}>
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="max-h-[min(26rem,65vh)] overflow-y-auto px-1 pt-1">
        <FriendsPanel game={game} />
      </div>
    </div>
  )
}
