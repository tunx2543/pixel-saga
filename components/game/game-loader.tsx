'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('./game').then((m) => m.Game), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">กำลังโหลดเกม...</div>
  ),
})

export function GameLoader() {
  return <Game />
}
