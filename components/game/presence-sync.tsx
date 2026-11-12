'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isPermanentGm, PERMANENT_GM_UID } from '@/lib/game/permissions'
import { game, notify, say, subscribe } from '@/lib/game/engine'

let lastPrivateMessageId = 0

export function PresenceSync() {
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      // Online presence is optional; Guest mode must continue without Supabase.
      return
    }

    let stopped = false
    let syncing = false
    let lastSync = 0
    const sync = async (force = false) => {
      if (syncing || (!force && Date.now() - lastSync < 1000)) return
      syncing = true
      try {
        const { data } = await supabase.auth.getUser()
        const player = game.p
        if (stopped || !player) return
        if (!data.user) {
          const hadPrivileges = player.gm || player.uid === PERMANENT_GM_UID || player.god || player.invisible || player.speed !== 1 || player.jobId === 'gm'
          if (player.uid === PERMANENT_GM_UID) player.uid = undefined
          player.gm = false
          player.god = false
          player.invisible = false
          player.speed = 1
          if (player.jobId === 'gm') player.jobId = 'novice'
          if (hadPrivileges) notify()
          return
        }
        const isGm = isPermanentGm(data.user.email)
        if (isGm) {
          player.uid = PERMANENT_GM_UID
          player.gm = true
        } else {
          if (player.uid === PERMANENT_GM_UID) player.uid = undefined
          player.gm = false
          player.god = false
          player.invisible = false
          player.speed = 1
          if (player.jobId === 'gm') player.jobId = 'novice'
        }
        const now = new Date().toISOString()
        const snapshot = {
          userId: data.user.id,
          displayName: player.name,
          classId: player.jobId,
          jobId: player.jobId,
          mapId: player.mapId,
          x: player.x,
          y: player.y,
          level: player.level,
          uid: player.uid ?? 1,
          gm: isGm,
          facing: game.facing,
          moving: game.moving,
          attackAnim: game.attackAnim,
          lastSeen: Date.parse(now),
        }
        await supabase.from('game_rooms').upsert({
          room_id: `global:${data.user.id}`,
          host_id: data.user.id,
          snapshot,
          updated_at: now,
        })
        lastSync = Date.now()
        const { data: rows } = await supabase
          .from('game_rooms')
          .select('host_id, snapshot, updated_at')
          .like('room_id', 'global:%')
        game.remotePlayers = (rows ?? [])
          .filter((row) => row.host_id !== data.user.id && Date.parse(row.updated_at) > Date.now() - 30000)
          .map((row) => row.snapshot as NonNullable<typeof game.remotePlayers>[number])
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
