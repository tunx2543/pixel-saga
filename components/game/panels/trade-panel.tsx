'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { game, notify, saveGame, loadCloudGame } from '@/lib/game/engine'
import { updateTradeOffer, type TradeOfferSnapshot } from '@/lib/game/social'
import { useGame } from '@/lib/game/use-game'
import { ITEMS } from '@/lib/game/data'
import { PanelFrame, PxButton } from './panels'

const EMPTY_OFFER: TradeOfferSnapshot = {
  senderItems: [],
  recipientItems: [],
  senderDisplay: [],
  recipientDisplay: [],
  senderReady: false,
  recipientReady: false,
}

export function TradePanel() {
  const g = useGame()
  const [offer, setOffer] = useState<TradeOfferSnapshot>(EMPTY_OFFER)
  const [side, setSide] = useState<'sender' | 'recipient'>('sender')
  const [tradeStatus, setTradeStatus] = useState('pending')
  const [status, setStatus] = useState('กำลังเชื่อมต่อรายการแลกเปลี่ยน...')
  const tradeId = game.tradeId
  const target = game.remotePlayers.find((player) => player.userId === game.tradeTargetId)
  const inventory = useMemo(() => g.p?.inventory.filter((entry) => entry.qty > 0) ?? [], [g.p?.inventory])
  const offered = side === 'sender' ? offer.senderItems : offer.recipientItems
  const offeredByOther = side === 'sender' ? offer.recipientDisplay : offer.senderDisplay
  const ready = side === 'sender' ? offer.senderReady : offer.recipientReady
  const otherReady = side === 'sender' ? offer.recipientReady : offer.senderReady

  useEffect(() => {
    if (!tradeId) return
    let active = true
    let completedApplied = false
    let loading = false
    const refreshTrade = async () => {
      if (!active || loading) return
      loading = true
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
          .from('trade_requests')
          .select('sender_id, recipient_id, status, offer')
          .eq('id', tradeId)
          .maybeSingle()
        if (error || !data || !active) return
        setSide(data.sender_id === user.id ? 'sender' : 'recipient')
        setTradeStatus(data.status)
        setOffer({ ...EMPTY_OFFER, ...(data.offer as Partial<TradeOfferSnapshot>) })
        if (data.status === 'completed' && !completedApplied) {
          const latest = await loadCloudGame()
          if (latest && active && game.p) {
            completedApplied = true
            game.p.inventory = latest.inventory
            saveGame()
            setStatus('แลกเปลี่ยนสำเร็จและอัปเดตกระเป๋าแล้ว')
            notify()
          }
        } else if (data.status === 'pending') {
          setStatus('รออีกฝ่ายยอมรับคำขอแลกเปลี่ยน')
        } else if (data.status === 'completed') {
          setStatus('แลกเปลี่ยนสำเร็จแล้ว')
        } else {
          setStatus('เลือกไอเท็มที่ต้องการเสนอ')
        }
      } finally {
        loading = false
      }
    }
    void refreshTrade()
    const timer = window.setInterval(() => void refreshTrade(), 1200)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [tradeId])

  const sync = async (nextItems: string[], nextReady: boolean) => {
    if (!tradeId) {
      setStatus('ไม่พบรายการเทรด กรุณากดปุ่มแลกเปลี่ยนจากตัวละครอีกครั้ง')
      return
    }
    setStatus('กำลังบันทึกรายการ...')
    const result = await updateTradeOffer(tradeId, nextItems, nextReady)
    setStatus(result.message)
    if (result.offer) setOffer({ ...EMPTY_OFFER, ...result.offer })
    if (result.saveData && game.p) {
      game.p.inventory = result.saveData.inventory
      saveGame()
    }
    if (!result.ok) game.chat.push({ id: Date.now(), type: 'error', text: result.message })
    if (result.completed) setTradeStatus('completed')
    notify()
  }

  const canEdit = tradeStatus === 'accepted'
  const otherName = target?.displayName ?? 'อีกฝ่าย'

  return (
    <PanelFrame title="แลกเปลี่ยนไอเท็ม" subtitle={`กับ ${otherName}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <h3 className="text-sm font-bold text-primary">ของที่คุณเสนอ</h3>
          <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
            {inventory.map((entry) => {
              const item = ITEMS[entry.itemId]
              const selected = offered.includes(entry.uid)
              return (
                <button
                  key={entry.uid}
                  type="button"
                  disabled={!canEdit}
                  aria-pressed={selected}
                  className={`flex items-center justify-between rounded border px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-primary bg-primary/20' : 'border-border bg-secondary/60'}`}
                  onClick={() => {
                    const next = selected ? offered.filter((uid) => uid !== entry.uid) : [...offered, entry.uid]
                    void sync(next, false)
                  }}
                >
                  <span>{item?.name ?? entry.itemId} +{entry.plus}</span><span className="text-muted-foreground">x{entry.qty}</span>
                </button>
              )
            })}
            {!inventory.length && <p className="text-xs text-muted-foreground">ไม่มีไอเท็มในกระเป๋า</p>}
          </div>
          <p className={`mt-2 text-[10px] ${ready ? 'text-emerald-400' : 'text-muted-foreground'}`}>{ready ? 'คุณพร้อมแลกแล้ว' : 'ยังไม่พร้อม'}</p>
        </section>
        <section className="rounded-lg border border-border bg-secondary/40 p-3">
          <h3 className="text-sm font-bold text-foreground">ของที่ {otherName} เสนอ</h3>
          <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
            {offeredByOther.map((entry) => (
              <p key={entry.uid} className="flex justify-between rounded border border-border bg-background/50 px-2 py-1.5 text-xs">
                <span>{ITEMS[entry.itemId]?.name ?? entry.itemId} +{entry.plus}</span><span className="text-muted-foreground">x{entry.qty}</span>
              </p>
            ))}
            {!offeredByOther.length && <p className="text-xs text-muted-foreground">ยังไม่มีไอเท็มที่เสนอ</p>}
          </div>
          <p className={`mt-2 text-[10px] ${otherReady ? 'text-emerald-400' : 'text-muted-foreground'}`}>{otherReady ? 'อีกฝ่ายพร้อมแลกแล้ว' : 'อีกฝ่ายยังไม่พร้อม'}</p>
        </section>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-primary" role="status">{status}</p>
        <PxButton disabled={!canEdit} variant={ready ? 'secondary' : 'primary'} onClick={() => void sync(offered, !ready)}>
          {ready ? 'ยกเลิกพร้อม' : 'พร้อมแลก'}
        </PxButton>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">ไอเท็มจะถูกโอนเมื่อทั้งสองฝ่ายยืนยัน และระบบตรวจสอบกระเป๋าก่อนทำรายการ</p>
    </PanelFrame>
  )
}
