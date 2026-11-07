'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/game/engine'

export function SocialNotifications() {
  const [request, setRequest] = useState<{ userId: string; uid: number | null } | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data } = await supabase.from('friendships').select('user_id').eq('friend_user_id', user.id).eq('status', 'pending').limit(1).maybeSingle()
      if (!data || !active) return
      const { data: player } = await supabase.from('game_players').select('uid').eq('user_id', data.user_id).maybeSingle()
      setRequest({ userId: data.user_id, uid: player?.uid ?? null })
    }
    void load()
    const timer = window.setInterval(() => void load(), 4000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  if (!request) return null

  const respond = async (status: 'accepted' | 'blocked') => {
    const supabase = createClient()
    await supabase.from('friendships').update({ status }).eq('user_id', request.userId).eq('friend_user_id', (await supabase.auth.getUser()).data.user?.id)
    setRequest(null)
    notify()
  }

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-50 w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-primary/50 bg-background/95 p-3 shadow-2xl backdrop-blur" role="status">
      <p className="text-[10px] font-bold tracking-[0.15em] text-primary">คำขอเพื่อนใหม่</p>
      <p className="mt-1 text-xs text-foreground">ผู้เล่น UID {request.uid === null ? '?????' : String(request.uid).padStart(5, '0')} ต้องการเพิ่มคุณเป็นเพื่อน</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="pixel-button primary px-2 py-1.5 text-[10px]" onClick={() => void respond('accepted')}>ยอมรับ</button>
        <button type="button" className="pixel-button secondary px-2 py-1.5 text-[10px]" onClick={() => void respond('blocked')}>ปฏิเสธ</button>
      </div>
    </div>
  )
}
