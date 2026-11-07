'use client'

import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { closePanel, game as gameState } from '@/lib/game/engine'
import { createTrade, sendFriendRequest, sendWhisper } from '@/lib/game/social'

export function FriendsPanel({ game }: { game: typeof gameState }) {
  const [uid, setUid] = useState('')
  const [myUid, setMyUid] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [requestCount, setRequestCount] = useState(0)
  const [friends, setFriends] = useState<Array<{ userId: string; uid: number | null }>>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data: ownPlayer } = await supabase.from('game_players').select('uid').eq('user_id', user.id).maybeSingle()
      setMyUid(ownPlayer?.uid ?? null)
      const { count } = await supabase
        .from('friendships')
        .select('friend_user_id', { count: 'exact', head: true })
        .eq('friend_user_id', user.id)
        .eq('status', 'pending')
      const { data: accepted } = await supabase.from('friendships').select('user_id, friend_user_id').or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`).eq('status', 'accepted')
      const friendIds = (accepted ?? []).map((row) => row.user_id === user.id ? row.friend_user_id : row.user_id)
      const { data: friendPlayers } = friendIds.length ? await supabase.from('game_players').select('user_id, uid').in('user_id', friendIds) : { data: [] }
      if (active) {
        setRequestCount(count ?? 0)
        setFriends((friendPlayers ?? []).map((row) => ({ userId: row.user_id, uid: row.uid })))
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const sendRequest = async () => {
    setMessage('')
    if (!/^\d{1,5}$/.test(uid.trim())) {
      setMessage('กรุณาระบุ UID ตัวเลข 5 หลัก เช่น 00001')
      return
    }
    const result = await sendFriendRequest(uid.trim())
    setMessage(result.message)
    if (result.ok) setUid('')
  }

  return (
    <section className="game-panel friends-panel" aria-label="Friends">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">SOCIAL</span>
          <h2>เพื่อน</h2>
        </div>
        <span className="panel-badge">คำขอ {requestCount}</span>
      </div>
      <p className="panel-copy">แอดเพื่อนด้วย UID เพื่อพบกันในโลกเดียวกัน</p>
      {myUid !== null && (
        <div className="rounded-lg border border-border bg-secondary/40 p-2">
          <span className="field-label">UID ของคุณ</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-[10px] text-primary">{String(myUid).padStart(5, '0')}</code>
            <button type="button" className="pixel-button secondary shrink-0 px-2 py-1 text-[10px]" onClick={() => void navigator.clipboard?.writeText(myUid)}>คัดลอก</button>
          </div>
        </div>
      )}
      <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-2">
        <span className="field-label">รายชื่อเพื่อน</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {friends.map((friend) => (
            <button key={friend.userId} type="button" className="group flex w-14 flex-col items-center gap-1 rounded-lg border border-border bg-background/60 p-1.5 hover:border-primary" title={`UID ${String(friend.uid ?? 0).padStart(5, '0')}`} onClick={() => { game.socialTargetId = friend.userId }}>
              <span className="grid size-8 place-items-center rounded-full bg-primary/20 text-primary"><UserRound className="size-4" aria-hidden /></span>
              <span className="text-[9px] text-muted-foreground">{String(friend.uid ?? 0).padStart(5, '0')}</span>
            </button>
          ))}
          {!friends.length && <p className="text-xs text-muted-foreground">ยังไม่มีเพื่อนที่ยอมรับคำขอ</p>}
        </div>
      </div>
      <label className="field-label" htmlFor="friend-uid">UID เพื่อน</label>
      <div className="friend-form">
        <input id="friend-uid" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="00001" />
        <button type="button" className="pixel-button primary" onClick={() => void sendRequest()}>ส่งคำขอ</button>
      </div>
      <p className="panel-copy muted">ตัวละครนี้: {game.p?.name || 'Guest'} · โหมด Guest จะไม่บันทึกคำขอ</p>
      {game.socialTargetId && (
        <div className="mt-2 rounded-lg border border-primary/40 bg-primary/5 p-2">
          <span className="field-label">ตัวละครที่เลือก</span>
          <code className="mt-1 block truncate text-[10px] text-primary">{game.socialTargetId}</code>
          <div className="mt-2 grid grid-cols-3 gap-1">
            <button type="button" className="pixel-button secondary px-1 py-1 text-[9px]" onClick={() => void sendFriendRequest(game.socialTargetId!).then((r) => setMessage(r.message))}>เพิ่มเพื่อน</button>
            <button type="button" className="pixel-button secondary px-1 py-1 text-[9px]" onClick={() => void createTrade(game.socialTargetId!).then((r) => setMessage(r.message))}>แลกเปลี่ยน</button>
            <button type="button" className="pixel-button secondary px-1 py-1 text-[9px]" onClick={() => void sendWhisper(game.socialTargetId!, 'สวัสดี').then((r) => setMessage(r.message))}>กระซิบ</button>
          </div>
        </div>
      )}
      {message && <p className="panel-message" role="status">{message}</p>}
      <button type="button" className="pixel-button secondary" onClick={closePanel}>ปิด</button>
    </section>
  )
}
