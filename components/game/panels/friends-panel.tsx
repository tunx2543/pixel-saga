'use client'

import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { closePanel, game as gameState } from '@/lib/game/engine'

export function FriendsPanel({ game }: { game: typeof gameState }) {
  const [requestCount, setRequestCount] = useState(0)
  const [friends, setFriends] = useState<Array<{ userId: string; name: string | null }>>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { count } = await supabase
        .from('friendships')
        .select('friend_user_id', { count: 'exact', head: true })
        .eq('friend_user_id', user.id)
        .eq('status', 'pending')
      const { data: accepted } = await supabase.from('friendships').select('user_id, friend_user_id').or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`).eq('status', 'accepted')
      const friendIds = (accepted ?? []).map((row) => row.user_id === user.id ? row.friend_user_id : row.user_id)
      const { data: friendPlayers } = friendIds.length ? await supabase.from('game_players').select('user_id, name').in('user_id', friendIds) : { data: [] }
      if (active) {
        setRequestCount(count ?? 0)
        setFriends((friendPlayers ?? []).map((row) => ({ userId: row.user_id, name: row.name })))
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return (
    <section className="game-panel friends-panel" aria-label="Friends">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">SOCIAL</span>
          <h2>เพื่อน</h2>
        </div>
        <span className="panel-badge">คำขอ {requestCount}</span>
      </div>
      <p className="panel-copy">รายชื่อเพื่อนและคำขอที่ยอมรับแล้ว</p>
      <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-2">
        <span className="field-label">รายชื่อเพื่อน</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {friends.map((friend) => (
            <button key={friend.userId} type="button" className="group flex w-16 flex-col items-center gap-1 rounded-lg border border-border bg-background/60 p-1.5 hover:border-primary" title={friend.name ?? 'เพื่อน'} onClick={() => { game.socialTargetId = friend.userId }}>
              <span className="grid size-8 place-items-center rounded-full bg-primary/20 text-primary"><UserRound className="size-4" aria-hidden /></span>
              <span className="max-w-full truncate text-[9px] text-muted-foreground">{friend.name ?? 'เพื่อน'}</span>
            </button>
          ))}
          {!friends.length && <p className="text-xs text-muted-foreground">ยังไม่มีเพื่อนที่ยอมรับคำขอ</p>}
        </div>
      </div>
      <p className="panel-copy muted">กดไอคอนเพื่อนเพื่อเลือกผู้เล่นที่ต้องการติดต่อ</p>
      <button type="button" className="pixel-button secondary" onClick={closePanel}>ปิด</button>
    </section>
  )
}
