'use client'

import { useState } from 'react'
import { useGame } from '@/lib/game/use-game'
import { game } from '@/lib/game/engine'
import { ChatBox } from './chat-box'
import { GameCanvas } from './game-canvas'
import { Hud } from './hud'
import { Panels } from './panels/panels'
import { TitleScreen } from './title-screen'
import { PresenceSync } from './presence-sync'
import { WorldBanner } from './world-banner'
import { TouchControls } from './touch-controls'
import { PlayerActionMenu } from './player-action-menu'
import { SocialNotifications } from './social-notifications'
import { SocialPopover } from './social-popover'
import { ITEMS } from '@/lib/game/data'
import { CheckinModal } from './checkin-modal'

function LootToast() {
  const loot = game.lootToast
  const item = loot ? ITEMS[loot.itemId] : null
  if (!loot || !item || loot.until <= game.time) return null
  return (
    <div className="pointer-events-auto absolute left-1/2 top-16 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-yellow-300/60 bg-background/95 px-3 py-2 shadow-2xl backdrop-blur" role="status">
      {item.asset ? <img src={item.asset} alt={item.name} width={44} height={44} className="pixelated rounded-md object-contain" /> : <span className="grid size-11 place-items-center rounded-md bg-yellow-400/10 text-lg text-yellow-300">★</span>}
      <span><strong className="block text-xs text-yellow-300">บอสทำไอเทมตก!</strong><span className="text-xs text-foreground">{item.name}</span><span className="block text-[10px] text-muted-foreground">โอกาสดรอป 1%</span></span>
    </div>
  )
}

export function Game() {
  const g = useGame()
  const [showCheckin, setShowCheckin] = useState(false)
  if (!g.p) return <TitleScreen />
  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <GameCanvas />
      <div className="game-ui pointer-events-none absolute inset-0">
        <TouchControls />
        <Hud onOpenCheckin={() => setShowCheckin(true)} />
        <WorldBanner />
        <PlayerActionMenu />
        <SocialNotifications />
        <SocialPopover />
        <LootToast />
        <ChatBox />
        <PresenceSync />
        <Panels />
        {showCheckin && <CheckinModal onClose={() => setShowCheckin(false)} />}
      </div>
    </div>
  )
}
