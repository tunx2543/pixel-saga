'use client'

import { createClient } from '@/lib/supabase/client'
import type { InvItem, SaveData } from './engine'

export type SocialResult = { ok: boolean; message: string }
export type TradeOfferSnapshot = {
  senderItems: string[]
  recipientItems: string[]
  senderDisplay: InvItem[]
  recipientDisplay: InvItem[]
  senderReady: boolean
  recipientReady: boolean
}
export type TradeUpdate = SocialResult & { offer?: TradeOfferSnapshot; completed?: boolean; saveData?: SaveData }

async function resolveTargetId(target: string): Promise<string | null> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)) return target
  if (!/^\d{1,10}$/.test(target)) return null
  const { data, error } = await createClient().rpc('resolve_game_user_id', { target_uid: Number(target) })
  return error || typeof data !== 'string' ? null : data
}

export async function sendFriendRequest(targetUserId: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const targetId = await resolveTargetId(targetUserId)
  if (!targetId) return { ok: false, message: 'ไม่พบผู้เล่นนี้' }
  const { data, error } = await supabase.rpc('send_friend_request', { target_user_id: targetId })
  if (error) return { ok: false, message: 'ส่งคำขอเพื่อนไม่สำเร็จ' }
  if (data === 'already_exists') return { ok: true, message: 'คุณเป็นเพื่อนหรือส่งคำขอไปแล้ว' }
  return { ok: true, message: data === 'accepted' ? 'ตอบรับคำขอเพื่อนแล้ว' : 'ส่งคำขอเพื่อนแล้ว' }
}

export async function respondFriendRequest(requesterId: string, decision: 'accepted' | 'declined'): Promise<SocialResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('respond_friend_request', { requester_id: requesterId, decision })
  return error || !data
    ? { ok: false, message: 'ตอบกลับคำขอเพื่อนไม่สำเร็จ' }
    : { ok: true, message: decision === 'accepted' ? 'เพิ่มเพื่อนแล้ว' : 'ปฏิเสธคำขอแล้ว' }
}

export async function sendWhisper(targetUserId: string, body: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const targetId = await resolveTargetId(targetUserId)
  if (!targetId) return { ok: false, message: 'ไม่พบผู้เล่นนี้' }
  const text = body.trim().slice(0, 240)
  if (!text) return { ok: false, message: 'พิมพ์ข้อความก่อนส่ง' }
  const { error } = await supabase.from('private_messages').insert({ sender_id: user.id, recipient_id: targetId, body: text })
  return error ? { ok: false, message: 'ส่งกระซิบไม่สำเร็จ' } : { ok: true, message: 'ส่งกระซิบแล้ว' }
}

export async function createTrade(targetUserId: string): Promise<SocialResult & { tradeId?: number }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const targetId = await resolveTargetId(targetUserId)
  if (!targetId) return { ok: false, message: 'ไม่พบผู้เล่นนี้' }
  const { data, error } = await supabase.rpc('create_trade_request', { target_user_id: targetId })
  return error ? { ok: false, message: 'ส่งคำขอแลกเปลี่ยนไม่สำเร็จ' } : { ok: true, message: 'ส่งคำขอแลกเปลี่ยนแล้ว', tradeId: Number(data) }
}

export async function updateTradeOffer(tradeId: number, itemUids: string[], ready: boolean): Promise<TradeUpdate> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('update_trade_offer', { trade_id: tradeId, item_uids: itemUids, is_ready: ready })
  if (error) return { ok: false, message: error.message.includes('inventory is full') ? 'กระเป๋าฝ่ายรับเต็ม กรุณานำไอเท็มออกก่อน' : 'อัปเดตรายการแลกเปลี่ยนไม่สำเร็จ' }
  const result = data as { status?: string; offer?: TradeOfferSnapshot; saveData?: SaveData } | null
  return {
    ok: true,
    message: result?.status === 'completed' ? 'แลกเปลี่ยนสำเร็จและส่งไอเท็มแล้ว' : 'อัปเดตรายการแลกเปลี่ยนแล้ว',
    offer: result?.offer,
    completed: result?.status === 'completed',
    saveData: result?.saveData,
  }
}

export async function publishAnnouncement(body: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const { error } = await supabase.rpc('publish_gm_announcement', { announcement_body: body.trim().slice(0, 240) })
  return error ? { ok: false, message: 'ประกาศไม่สำเร็จ: ต้องใช้สิทธิ์ GM ที่ยืนยันบนเซิร์ฟเวอร์' } : { ok: true, message: 'ประกาศ GM แล้ว' }
}

export async function createBan(targetUserId: string, durationSeconds: number | null, reason: string): Promise<SocialResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }
  const targetId = await resolveTargetId(targetUserId)
  if (!targetId) return { ok: false, message: 'ไม่พบผู้เล่นนี้' }
  const expiresAt = durationSeconds && durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1_000).toISOString() : null
  const { error } = await supabase.rpc('ban_player', { target_id: targetId, ban_reason: reason.slice(0, 160), ban_expires_at: expiresAt })
  return error ? { ok: false, message: 'แบนไม่สำเร็จ: ต้องใช้สิทธิ์ GM ที่ยืนยันบนเซิร์ฟเวอร์' } : { ok: true, message: expiresAt ? `แบน ${durationSeconds} วินาทีแล้ว` : 'แบนถาวรแล้ว' }
}
