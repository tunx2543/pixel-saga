'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { game, notify, subscribe } from '@/lib/game/engine'

export function PresenceSync() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false
    let syncing = false
    let lastSync = 0
    const sync = async (force = false) => {
      if (syncing || (!force && Date.now() - lastSync < 1000)) return
      syncing = true
      try {
        const { data } = await supabase.auth.getUser()
        const player = game.p
        if (stopped || !data.user || !player) return
        const now = new Date().toISOString()
        await supabase.from('game_players').upsert({
          user_id: data.user.id,
          display_name: player.name,
          class_id: player.jobId,
          save_data: player,
          x: player.x,
          y: player.y,
          level: player.level,
          last_seen: now,
        })
        lastSync = Date.now()
        const { data: rows } = await supabase
          .from('game_players')
          .select('user_id, display_name, class_id, x, y, level, last_seen')
          .gt('last_seen', new Date(Date.now() - 30000).toISOString())
        game.remotePlayers = (rows ?? [])
          .filter((row) => row.user_id !== data.user.id)
          .map((row) => ({
            userId: row.user_id,
            displayName: row.display_name,
            classId: row.class_id,
            x: Number(row.x),
            y: Number(row.y),
            level: row.level,
            lastSeen: Date.parse(row.last_seen),
          }))
        notify()
      } finally {
        syncing = false
      }
    }
    void sync()
    const unsubscribe = subscribe(sync)
    const timer = window.setInterval(() => void sync(true), 5000)
    return () => {
      stopped = true
      unsubscribe()
      window.clearInterval(timer)
      game.remotePlayers = []
    }
  }, [])

  return null
}
