'use client'

import { createClient } from '@/lib/supabase/client'

export type SocialResult = { ok: boolean; message: string }

export async function sendFriendRequest(targetUserId: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const { error } = await supabase.from('friendships').upsert({ user_id: user.id, friend_user_id: targetUserId, status: 'pending' }, { onConflict: 'user_id,friend_user_id' })
  return error ? { ok: false, message: 'ส่งคำขอเพื่อนไม่สำเร็จ' } : { ok: true, message: 'ส่งคำขอเพื่อนแล้ว' }
}

export async function sendWhisper(targetUserId: string, body: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const { error } = await supabase.from('private_messages').insert({ sender_id: user.id, recipient_id: targetUserId, body: body.trim().slice(0, 240) })
  return error ? { ok: false, message: 'ส่งกระซิบไม่สำเร็จ' } : { ok: true, message: 'ส่งกระซิบแล้ว' }
}

export async function createTrade(targetUserId: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const { error } = await supabase.from('trade_requests').insert({ sender_id: user.id, recipient_id: targetUserId, offer: {} })
  return error ? { ok: false, message: 'ส่งคำขอแลกเปลี่ยนไม่สำเร็จ' } : { ok: true, message: 'ส่งคำขอแลกเปลี่ยนแล้ว' }
}

export async function publishAnnouncement(body: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const { error } = await supabase.rpc('publish_gm_announcement', { announcement_body: body.trim().slice(0, 240) })
  return error ? { ok: false, message: 'ประกาศไม่สำเร็จ: ต้องใช้สิทธิ์ GM ที่ยืนยันบนเซิร์ฟเวอร์' } : { ok: true, message: 'ประกาศ GM แล้ว' }
}

export async function createBan(targetUserId: string, durationMinutes: number | null, reason: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const expiresAt = durationMinutes && durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60_000).toISOString() : null
  const { error } = await supabase.rpc('ban_player', { target_id: targetUserId, ban_reason: reason.slice(0, 160), ban_expires_at: expiresAt })
  return error ? { ok: false, message: 'แบนไม่สำเร็จ: ต้องใช้สิทธิ์ GM ที่ยืนยันบนเซิร์ฟเวอร์' } : { ok: true, message: expiresAt ? `แบน ${durationMinutes} นาทีแล้ว` : 'แบนถาวรแล้ว' }
}
