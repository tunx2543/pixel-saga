'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AccountPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let unsubscribe = () => {}

    try {
      const supabase = createClient()
      void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null)).catch(() => {
        setUserEmail(null)
      })
      const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user?.email ?? null))
      unsubscribe = () => data.subscription.unsubscribe()
    } catch {
      setUserEmail(null)
    }

    return unsubscribe
  }, [])

  const submit = async (mode: 'signIn' | 'signUp') => {
    setBusy(true)
    setMessage('')

    try {
      const supabase = createClient()
      const result = mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` },
          })
      if (result.error) {
        setMessage('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน')
        return
      }
      setMessage(mode === 'signUp' ? 'สร้างบัญชีแล้ว ตรวจสอบอีเมลเพื่อยืนยันตัวตน' : 'เข้าสู่ระบบแล้ว เล่นกับเพื่อนและซิงค์ตัวละครได้')
    } catch {
      setMessage('ระบบบัญชียังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  if (userEmail) {
    return (
      <div className="border-2 border-primary/40 bg-primary/10 p-3 text-xs text-primary">
        เชื่อมต่อแล้ว: {userEmail}
        <button type="button" className="ml-2 underline" onClick={() => void createClient().auth.signOut()}>ออกจากระบบ</button>
      </div>
    )
  }

  return (
    <div className="border-2 border-border/70 bg-background/40 p-3">
      <p className="mb-2 text-xs font-bold text-primary">เล่นกับเพื่อนและสำรองตัวละคร</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label="อีเมล" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" className="border-2 border-border bg-input px-2 py-1 text-xs text-foreground outline-none focus:border-primary" />
        <input aria-label="รหัสผ่าน" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน 6 ตัวขึ้นไป" className="border-2 border-border bg-input px-2 py-1 text-xs text-foreground outline-none focus:border-primary" />
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy || !email || password.length < 6} onClick={() => void submit('signIn')} className="pixel-btn bg-secondary px-2 py-1 text-xs text-secondary-foreground disabled:opacity-50">เข้าสู่ระบบ</button>
        <button type="button" disabled={busy || !email || password.length < 6} onClick={() => void submit('signUp')} className="pixel-btn bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50">สร้างบัญชี</button>
      </div>
      {message && <p className="mt-2 text-[11px] text-muted-foreground">{message}</p>}
    </div>
  )
}
