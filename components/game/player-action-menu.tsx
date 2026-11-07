'use client'

import { createTrade, sendFriendRequest, sendWhisper } from '@/lib/game/social'
import { game, notify, openPanel } from '@/lib/game/engine'

export function PlayerActionMenu() {
  const target = game.remotePlayers.find((player) => player.userId === game.socialTargetId)
  if (!target) return null

  const run = (task: Promise<{ message: string }>) => {
    void task.then((result) => {
      game.chat.push({ id: Date.now(), type: 'system', text: result.message })
      game.socialTargetId = null
      notify()
    })
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 z-40 w-52 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary/50 bg-background/95 p-2 shadow-2xl backdrop-blur" role="dialog" aria-label={`เมนูผู้เล่น ${target.displayName}`} onClick={(event) => event.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">{target.displayName}</p>
          <p className="text-[10px] text-primary">UID {String(target.uid).padStart(5, '0')}</p>
        </div>
        <button type="button" className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-secondary" aria-label="ปิดเมนู" onClick={() => { game.socialTargetId = null; notify() }}>×</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button type="button" className="pixel-button secondary px-1 py-2 text-[10px]" onClick={() => run(sendFriendRequest(target.userId))}>เพิ่มเพื่อน</button>
        <button type="button" className="pixel-button secondary px-1 py-2 text-[10px]" onClick={() => void createTrade(target.userId).then((result) => { if (result.ok && result.tradeId) { game.tradeTargetId = target.userId; game.tradeId = result.tradeId; game.socialTargetId = null; openPanel('trade') } else { game.chat.push({ id: Date.now(), type: 'error', text: result.message }); notify() } })}>แลกเปลี่ยน</button>
        <button type="button" className="pixel-button secondary px-1 py-2 text-[10px]" onClick={() => run(sendWhisper(target.userId, 'สวัสดี'))}>กระซิบ</button>
      </div>
    </div>
  )
}
