'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { closePanel, game as gameState } from '@/lib/game/engine'

export function FriendsPanel({ game }: { game: typeof gameState }) {
  const [uid, setUid] = useState('')
  const [message, setMessage] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { count } = await supabase
        .from('friend_requests')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
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
    if (!/^[0-9a-f-]{36}$/i.test(uid)) {
      setMessage('UID ต้องเป็นรูปแบบ UUID')
      return
    }
    const { error } = await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: uid })
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
      <label className="field-label" htmlFor="friend-uid">UID เพื่อน</label>
      <div className="friend-form">
        <input id="friend-uid" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        <button type="button" className="pixel-button primary" onClick={() => void sendRequest()}>ส่งคำขอ</button>
      </div>
      <p className="panel-copy muted">ตัวละครนี้: {game.p?.name || 'Guest'} · โหมด Guest จะไม่บันทึกคำขอ</p>
      {message && <p className="panel-message" role="status">{message}</p>}
      <button type="button" className="pixel-button secondary" onClick={closePanel}>ปิด</button>
    </section>
  )
}
