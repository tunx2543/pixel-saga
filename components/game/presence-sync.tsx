'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { game, subscribe } from '@/lib/game/engine'

export function PresenceSync() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false
    const publish = async () => {
      const { data } = await supabase.auth.getUser()
      const player = game.p
      if (stopped || !data.user || !player) return
      await supabase.from('game_presence').upsert({
        user_id: data.user.id,
        display_name: player.name,
        class_id: player.jobId,
        x: player.x,
        y: player.y,
        level: player.level,
        last_seen: new Date().toISOString(),
      })
    }
    void publish()
    const unsubscribe = subscribe(publish)
    const timer = window.setInterval(publish, 5000)
    return () => {
      stopped = true
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [])

  return null
}
