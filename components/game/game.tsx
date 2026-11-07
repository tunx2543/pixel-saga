'use client'

import { useGame } from '@/lib/game/use-game'
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

export function Game() {
  const g = useGame()
  if (!g.p) return <TitleScreen />
  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <GameCanvas />
      <div className="game-ui pointer-events-none absolute inset-0">
        <TouchControls />
        <Hud />
        <WorldBanner />
        <PlayerActionMenu />
        <SocialNotifications />
        <SocialPopover />
        <ChatBox />
        <PresenceSync />
        <Panels />
      </div>
    </div>
  )
}
