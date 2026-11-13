'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PERMANENT_GM_UID } from '@/lib/game/permissions'
import { game, notify, resolveGameUid, saveGame, say, setGameAccountIdentity, subscribe } from '@/lib/game/engine'

let lastPrivateMessageId = 0

export function PresenceSync() {
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      return
    }

    let stopped = false
    let syncing = false
    let channelReady = false
    let lastSync = 0
    let lastBroadcast = 0
    let lastPlayerPrune = 0
    let boundUserId: string | null = null
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
    const remotePlayers = new Map<string, NonNullable<typeof game.remotePlayers>[number]>()

    const publishRemotePlayers = () => {
      const cutoff = Date.now() - 15_000
      for (const [userId, player] of remotePlayers) if (player.lastSeen < cutoff) remotePlayers.delete(userId)
      game.remotePlayers = [...remotePlayers.values()]
      notify()
    }

    const receiveSnapshot = (value: unknown) => {
      if (!value || typeof value !== 'object') return
      const snapshot = value as NonNullable<typeof game.remotePlayers>[number]
      if (
        !snapshot.userId || snapshot.userId === boundUserId ||
        typeof snapshot.displayName !== 'string' || typeof snapshot.mapId !== 'string' ||
        !Number.isFinite(snapshot.x) || !Number.isFinite(snapshot.y) ||
        !Number.isFinite(snapshot.lastSeen) || !snapshot.facing || snapshot.lastSeen < Date.now() - 15_000
      ) return
      const current = remotePlayers.get(snapshot.userId)
      if (current && current.lastSeen > snapshot.lastSeen) return
      remotePlayers.set(snapshot.userId, {
        ...snapshot,
        previousX: current?.mapId === snapshot.mapId ? current.x : snapshot.x,
        previousY: current?.mapId === snapshot.mapId ? current.y : snapshot.y,
        receivedAt: Date.now(),
      })
      publishRemotePlayers()
    }

    const stopChannel = () => {
      channelReady = false
      if (channel) void supabase.removeChannel(channel)
      channel = null
      remotePlayers.clear()
      game.remotePlayers = []
    }

    const startChannel = (userId: string) => {
      if (channel) void supabase.removeChannel(channel)
      channelReady = false
      channel = supabase
        .channel('pixel-quest-world', { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'player-state' }, ({ payload }) => receiveSnapshot(payload))
        .subscribe((status) => { channelReady = status === 'SUBSCRIBED' })
      boundUserId = userId
      lastPrivateMessageId = 0
    }

    const currentSnapshot = (userId: string, uid: number) => {
      const player = game.p
      if (!player) return null
      return {
        userId,
        displayName: player.name,
        classId: player.jobId,
        jobId: player.jobId,
        mapId: player.mapId,
        x: player.x,
        y: player.y,
        level: player.level,
        uid,
        gm: uid === PERMANENT_GM_UID,
        facing: game.facing,
        moving: game.moving,
        attackAnim: game.attackAnim,
        lastSeen: Date.now(),
      }
    }

    const loadPrivateMessages = async () => {
      const userId = boundUserId
      if (!userId || stopped) return
      const { data: whispers, error } = await supabase
        .from('private_messages')
        .select('id, sender_id, body')
        .gt('id', lastPrivateMessageId)
        .order('id', { ascending: true })
        .limit(20)
      if (error) return
      for (const whisper of whispers ?? []) {
        lastPrivateMessageId = Math.max(lastPrivateMessageId, Number(whisper.id))
        say('player', `[กระซิบ] ${whisper.body}`, whisper.sender_id === userId ? 'ถึงผู้เล่น' : `จาก ${whisper.sender_id.slice(0, 8)}`)
      }
      if (whispers?.length) notify()
    }

    const sync = async (force = false) => {
      if (syncing || (!force && Date.now() - lastSync < 5000)) return
      syncing = true
      try {
        const { data } = await supabase.auth.getUser()
        let player = game.p
        if (stopped || !player) return
        if (!data.user) {
          if (boundUserId) stopChannel()
          boundUserId = null
          const hadPrivileges = player.gm || player.uid !== undefined || player.god || player.invisible || player.speed !== 1 || player.jobId === 'gm'
          player.uid = undefined
          player.gm = false
          player.god = false
          player.invisible = false
          player.speed = 1
          if (player.jobId === 'gm') player.jobId = 'novice'
          if (hadPrivileges) notify()
          lastSync = Date.now()
          return
        }
        if (boundUserId && boundUserId !== data.user.id) {
          stopChannel()
          player.uid = undefined
          player.gm = false
          player.god = false
          player.invisible = false
          player.speed = 1
          if (player.jobId === 'gm') player.jobId = 'novice'
          notify()
          boundUserId = null
          return
        }
        if (!boundUserId) startChannel(data.user.id)
        setGameAccountIdentity(data.user.id)
        const uid = await resolveGameUid(data.user.id)
        if (stopped || boundUserId !== data.user.id) return
        player = game.p
        if (!player) return
        if (uid === undefined) {
          lastSync = Date.now()
          return
        }
        const isGm = uid === PERMANENT_GM_UID
        const identityChanged = player.uid !== uid || player.gm !== isGm
        player.uid = uid
        player.gm = isGm
        if (!isGm) {
          player.god = false
          player.invisible = false
          player.speed = 1
          if (player.jobId === 'gm') player.jobId = 'novice'
        }
        if (identityChanged) saveGame()
        const snapshot = currentSnapshot(data.user.id, uid)
        const now = new Date().toISOString()
        if (snapshot) {
          await supabase.from('game_rooms').upsert({
            room_id: `global:${data.user.id}`,
            host_id: data.user.id,
            snapshot,
            updated_at: now,
          })
        }
        const { data: rows } = await supabase
          .from('game_rooms')
          .select('host_id, snapshot, updated_at')
          .like('room_id', 'global:%')
        for (const row of rows ?? []) {
          if (row.host_id === data.user.id || Date.parse(row.updated_at) <= Date.now() - 15_000) continue
          receiveSnapshot({ ...(row.snapshot as object), userId: row.host_id, lastSeen: Date.parse(row.updated_at) })
        }
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
        lastSync = Date.now()
        await loadPrivateMessages()
        notify()
      } catch {
        lastSync = Date.now()
      } finally {
        syncing = false
      }
    }

    void sync(true)
    const unsubscribe = subscribe(sync)
    const syncTimer = window.setInterval(() => void sync(true), 5000)
    const whisperTimer = window.setInterval(() => void loadPrivateMessages(), 2000)
    const broadcastTimer = window.setInterval(() => {
      const now = Date.now()
      if (remotePlayers.size && now - lastPlayerPrune >= 1000) {
        lastPlayerPrune = now
        publishRemotePlayers()
      }
      const userId = boundUserId
      const player = game.p
      if (!channelReady || !userId || !player || player.uid === undefined) return
      const interval = game.moving ? 100 : 1500
      if (now - lastBroadcast < interval) return
      lastBroadcast = now
      const snapshot = currentSnapshot(userId, player.uid)
      if (snapshot) void channel?.send({ type: 'broadcast', event: 'player-state', payload: snapshot })
    }, 100)

    return () => {
      stopped = true
      unsubscribe()
      window.clearInterval(syncTimer)
      window.clearInterval(whisperTimer)
      window.clearInterval(broadcastTimer)
      stopChannel()
    }
  }, [])

  return null
}
