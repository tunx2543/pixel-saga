'use client'

import { useGame } from '@/lib/game/use-game'
import { ChatBox } from './chat-box'
import { GameCanvas } from './game-canvas'
import { Hud } from './hud'
import { Panels } from './panels/panels'
import { TitleScreen } from './title-screen'
import { TouchControls } from './touch-controls'
import { PresenceSync } from './presence-sync'
import { WorldBanner } from './world-banner'

export function Game() {
  const g = useGame()
  if (!g.p) return <TitleScreen />
  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      <GameCanvas />
      <WorldBanner />
      <Hud />
      <ChatBox />
      <TouchControls />
      <PresenceSync />
      <Panels />
    </div>
  )
}
