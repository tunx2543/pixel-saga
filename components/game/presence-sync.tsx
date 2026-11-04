'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { game, notify, subscribe } from '@/lib/game/engine'

export function PresenceSync() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false
    const sync = async () => {
      const { data } = await supabase.auth.getUser()
      const player = game.p
      if (stopped || !data.user || !player) return
      const now = new Date().toISOString()
      await supabase.from('game_presence').upsert({
        user_id: data.user.id,
        display_name: player.name,
        class_id: player.jobId,
        x: player.x,
        y: player.y,
        level: player.level,
        last_seen: now,
      })
      const { data: rows } = await supabase
        .from('game_presence')
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
    }
    void sync()
    const unsubscribe = subscribe(sync)
    const channel = supabase
      .channel('game-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_presence' }, sync)
      .subscribe()
    const timer = window.setInterval(sync, 5000)
    return () => {
      stopped = true
      unsubscribe()
      window.clearInterval(timer)
      void supabase.removeChannel(channel)
      game.remotePlayers = []
    }
  }, [])

  return null
}
