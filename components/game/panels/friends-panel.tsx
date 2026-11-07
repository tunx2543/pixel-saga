'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { closePanel, game as gameState } from '@/lib/game/engine'
import { createTrade, sendFriendRequest, sendWhisper } from '@/lib/game/social'

export function FriendsPanel({ game }: { game: typeof gameState }) {
  const [uid, setUid] = useState('')
  const [myUid, setMyUid] = useState('')
  const [message, setMessage] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      setMyUid(user.id)
      const { count } = await supabase
        .from('friendships')
        .select('friend_user_id', { count: 'exact', head: true })
        .eq('friend_user_id', user.id)
        .eq('status', 'pending')
      if (active) setRequestCount(count ?? 0)
    }
    void load()
    return () => { active = false }
  }, [])

  const sendRequest = async () => {
    setMessage('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('กรุณาสมัครสมาชิกก่อนแอดเพื่อน')
      return
    }
    const receiverId = uid.trim().toLowerCase()
    if (!/^[0-9a-f-]{36}$/i.test(receiverId)) {
      setMessage('UID ต้องเป็นรูปแบบ UUID เช่น xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
      return
    }
    if (receiverId === user.id) {
      setMessage('ไม่สามารถแอด UID ของตัวเองได้')
      return
    }
    const { error } = await supabase.from('friendships').upsert({ user_id: user.id, friend_user_id: receiverId, status: 'pending' }, { onConflict: 'user_id,friend_user_id' })
    setMessage(error ? 'ส่งคำขอไม่สำเร็จ หรือ UID นี้มีคำขออยู่แล้ว' : 'ส่งคำขอเพื่อนแล้ว')
    if (!error) setUid('')
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
      {myUid && (
        <div className="rounded-lg border border-border bg-secondary/40 p-2">
          <span className="field-label">UID ของคุณ</span>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-[10px] text-primary">{myUid}</code>
            <button type="button" className="pixel-button secondary shrink-0 px-2 py-1 text-[10px]" onClick={() => void navigator.clipboard?.writeText(myUid)}>คัดลอก</button>
          </div>
        </div>
      )}
      <label className="field-label" htmlFor="friend-uid">UID เพื่อน</label>
      <div className="friend-form">
        <input id="friend-uid" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
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
