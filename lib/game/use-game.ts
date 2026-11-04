'use client'

import { useSyncExternalStore } from 'react'
import { game, getVersion, subscribe } from './engine'

export function useGame() {
  useSyncExternalStore(subscribe, getVersion, () => 0)
  return game
}
