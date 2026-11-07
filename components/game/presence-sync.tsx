'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { game, notify, say, subscribe } from '@/lib/game/engine'

let lastPrivateMessageId = 0

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
        const { data: ban } = await supabase
          .from('player_bans')
          .select('expires_at, reason')
          .eq('target_user_id', data.user.id)
          .maybeSingle()
        if (ban && (!ban.expires_at || Date.parse(ban.expires_at) > Date.now())) {
          game.p = null
          game.chat = []
          notify()
          return
        }
        const now = new Date().toISOString()
        await supabase.from('game_players').upsert({
          user_id: data.user.id,
          display_name: player.name,
          class_id: player.jobId,
          save_data: { ...player, facing: game.facing, moving: game.moving, attackAnim: game.attackAnim },
          x: player.x,
          y: player.y,
          level: player.level,
          last_seen: now,
        })
        lastSync = Date.now()
        const { data: rows } = await supabase
          .from('game_players')
          .select('user_id, display_name, class_id, save_data, x, y, level, last_seen')
          .gt('last_seen', new Date(Date.now() - 30000).toISOString())
        game.remotePlayers = (rows ?? [])
          .filter((row) => row.user_id !== data.user.id)
          .map((row) => {
            const save = (row.save_data ?? {}) as Record<string, unknown>
            return {
              userId: row.user_id,
              displayName: row.display_name,
              classId: row.class_id,
              jobId: typeof save.jobId === 'string' ? save.jobId : row.class_id,
              mapId: typeof save.mapId === 'string' ? save.mapId : 'town',
              x: Number(row.x),
              y: Number(row.y),
              level: row.level,
              gm: save.gm === true,
              facing: (typeof save.facing === 'string' ? save.facing : 'down') as 'up' | 'down' | 'left' | 'right',
              moving: save.moving === true,
              attackAnim: typeof save.attackAnim === 'number' ? save.attackAnim : 0,
              lastSeen: Date.parse(row.last_seen),
            }
          })
        const { data: announcements } = await supabase
          .from('world_announcements')
          .select('author_id, body, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
        const latest = announcements?.[0]
        if (latest) {
          const createdAt = Date.parse(latest.created_at)
          if (Date.now() - createdAt < 12_000) game.announcement = { body: latest.body, authorId: latest.author_id, until: createdAt + 12_000 }
        }
        const { data: whispers } = await supabase
          .from('private_messages')
          .select('id, sender_id, recipient_id, body, created_at')
          .gt('id', lastPrivateMessageId)
          .order('id', { ascending: true })
          .limit(20)
        for (const whisper of whispers ?? []) {
          lastPrivateMessageId = Math.max(lastPrivateMessageId, Number(whisper.id))
          say('player', `[กระซิบ] ${whisper.body}`, whisper.sender_id === data.user.id ? 'ถึงผู้เล่น' : `จาก ${whisper.sender_id.slice(0, 8)}`)
        }
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
