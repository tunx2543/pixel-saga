'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { closePanel, game, notify, saveGame, loadCloudGame } from '@/lib/game/engine'
import { updateTradeOffer, type TradeOfferSnapshot } from '@/lib/game/social'
import { useGame } from '@/lib/game/use-game'
import { ITEMS } from '@/lib/game/data'
import { GEM_SHOP_ITEMS } from '@/lib/game/gem-shop'
import { PanelFrame, PxButton } from './panels'

const EMPTY_OFFER: TradeOfferSnapshot = {
  senderItems: [],
  recipientItems: [],
  senderDisplay: [],
  recipientDisplay: [],
  senderGold: 0,
  recipientGold: 0,
  senderGemItems: [],
  recipientGemItems: [],
  senderReady: false,
  recipientReady: false,
}

export function TradePanel() {
  const g = useGame()
  const [offer, setOffer] = useState<TradeOfferSnapshot>(EMPTY_OFFER)
  const [side, setSide] = useState<'sender' | 'recipient'>('sender')
  const [tradeStatus, setTradeStatus] = useState('pending')
  const [status, setStatus] = useState('กำลังเชื่อมต่อรายการแลกเปลี่ยน...')
  const [goldDraft, setGoldDraft] = useState('0')
  const goldDraftIsDirty = useRef(false)
  const tradeId = game.tradeId
  const target = game.remotePlayers.find((player) => player.userId === game.tradeTargetId)
  const inventory = useMemo(() => g.p?.inventory.filter((entry) => entry.qty > 0) ?? [], [g.p?.inventory])
  const offered = side === 'sender' ? offer.senderItems : offer.recipientItems
  const offeredByOther = side === 'sender' ? offer.recipientDisplay : offer.senderDisplay
  const ready = side === 'sender' ? offer.senderReady : offer.recipientReady
  const otherReady = side === 'sender' ? offer.recipientReady : offer.senderReady
  const offeredGemItems = side === 'sender' ? offer.senderGemItems : offer.recipientGemItems
  const offeredByOtherGemItems = side === 'sender' ? offer.recipientGemItems : offer.senderGemItems
  const otherGold = side === 'sender' ? offer.recipientGold : offer.senderGold
  const ownedGemShopItems = side === 'sender'
    ? GEM_SHOP_ITEMS.filter((item) => item.category !== 'utility' && (g.p?.ownedGemItems ?? []).includes(item.id))
    : []

  useEffect(() => {
    if (!tradeId) return
    goldDraftIsDirty.current = false
    setGoldDraft('0')
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
        const nextSide = data.sender_id === user.id ? 'sender' : 'recipient'
        const nextOffer = { ...EMPTY_OFFER, ...(data.offer as Partial<TradeOfferSnapshot>) }
        setSide(nextSide)
        setTradeStatus(data.status)
        setOffer(nextOffer)
        if (!goldDraftIsDirty.current) setGoldDraft(String(nextSide === 'sender' ? nextOffer.senderGold : nextOffer.recipientGold))
        if (data.status === 'cancelled' || data.status === 'declined') {
          game.chat.push({ id: Date.now(), type: 'system', text: 'อีกฝ่ายปิดการแลกเปลี่ยนแล้ว' })
          closePanel()
          return
        }
        if (data.status === 'completed' && !completedApplied) {
          const latest = await loadCloudGame()
          if (latest && active && game.p) {
            completedApplied = true
            game.p.inventory = latest.inventory
            game.p.gold = latest.gold
            game.p.ownedGemItems = latest.ownedGemItems
            game.p.equippedGemFashion = latest.equippedGemFashion
            game.p.equippedGemCompanion = latest.equippedGemCompanion
            saveGame()
            setStatus('แลกเปลี่ยนสำเร็จและอัปเดตข้อมูลแล้ว')
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

  const sync = async (nextItems: string[], nextGemItems: string[], nextReady: boolean) => {
    if (!tradeId) {
      setStatus('ไม่พบรายการเทรด กรุณากดปุ่มแลกเปลี่ยนจากตัวละครอีกครั้ง')
      return
    }
    const offeredGold = Number(goldDraft)
    if (!Number.isSafeInteger(offeredGold) || offeredGold < 0 || offeredGold > (game.p?.gold ?? 0)) {
      setStatus('กรุณาใส่ Gold เป็นจำนวนเต็มที่ไม่เกินยอดคงเหลือ')
      return
    }
    setStatus('กำลังบันทึกรายการ...')
    const result = await updateTradeOffer(tradeId, nextItems, offeredGold, nextGemItems, nextReady)
    setStatus(result.message)
    if (result.offer) setOffer({ ...EMPTY_OFFER, ...result.offer })
    if (result.ok) {
      goldDraftIsDirty.current = false
      setGoldDraft(String(offeredGold))
    }
    const completedSave = result.completed ? await loadCloudGame() : null
    const savedData = completedSave ?? result.saveData
    if (savedData && game.p) {
      game.p.inventory = savedData.inventory
      game.p.gold = savedData.gold
      game.p.ownedGemItems = savedData.ownedGemItems
      game.p.equippedGemFashion = savedData.equippedGemFashion
      game.p.equippedGemCompanion = savedData.equippedGemCompanion
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
          <label htmlFor="trade-gold-offer" className="mt-2 block text-[10px] text-muted-foreground">Gold ที่เสนอ (คงเหลือ {g.p?.gold.toLocaleString() ?? 0} G)</label>
          <input
            id="trade-gold-offer"
            type="number"
            min={0}
            max={g.p?.gold ?? 0}
            step={1}
            inputMode="numeric"
            value={goldDraft}
            disabled={!canEdit}
            onChange={(event) => {
              goldDraftIsDirty.current = true
              setGoldDraft(event.target.value)
            }}
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground disabled:opacity-50"
          />
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
                    void sync(next, offeredGemItems, false)
                  }}
                >
                  <span>{item?.name ?? entry.itemId} +{entry.plus}</span><span className="text-muted-foreground">x{entry.qty}</span>
                </button>
              )
            })}
            {!inventory.length && <p className="text-xs text-muted-foreground">ไม่มีไอเท็มในกระเป๋า</p>}
          </div>
          <h4 className="mt-3 text-xs font-semibold text-primary">ไอเท็มร้านเพชรที่เป็นเจ้าของ</h4>
          <div className="mt-1 grid max-h-28 gap-1 overflow-y-auto">
            {ownedGemShopItems.map((item) => {
              const selected = offeredGemItems.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canEdit}
                  aria-pressed={selected}
                  onClick={() => {
                    const next = selected ? offeredGemItems.filter((id) => id !== item.id) : [...offeredGemItems, item.id]
                    void sync(offered, next, false)
                  }}
                  className={`flex items-center justify-between rounded border px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-primary bg-primary/20' : 'border-border bg-secondary/60'}`}
                >
                  <span>{item.name}</span><span className="text-muted-foreground">{item.rarity}</span>
                </button>
              )
            })}
            {!ownedGemShopItems.length && (
              <p className="text-xs text-muted-foreground">
                {side === 'sender' ? 'ไม่มีไอเท็มร้านเพชรที่โอนได้' : 'ผู้เริ่มต้นแลกเปลี่ยนเป็นฝ่ายเสนอไอเท็มตกแต่งร้านเพชรได้'}
              </p>
            )}
          </div>
          <p className={`mt-2 text-[10px] ${ready ? 'text-emerald-400' : 'text-muted-foreground'}`}>{ready ? 'คุณพร้อมแลกแล้ว' : 'ยังไม่พร้อม'}</p>
        </section>
        <section className="rounded-lg border border-border bg-secondary/40 p-3">
          <h3 className="text-sm font-bold text-foreground">ของที่ {otherName} เสนอ</h3>
          <p className="mt-2 rounded border border-gold/30 bg-gold/5 px-2 py-1.5 text-xs text-gold">Gold: {otherGold.toLocaleString()} G</p>
          <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
            {offeredByOther.map((entry) => (
              <p key={entry.uid} className="flex justify-between rounded border border-border bg-background/50 px-2 py-1.5 text-xs">
                <span>{ITEMS[entry.itemId]?.name ?? entry.itemId} +{entry.plus}</span><span className="text-muted-foreground">x{entry.qty}</span>
              </p>
            ))}
            {!offeredByOther.length && <p className="text-xs text-muted-foreground">ยังไม่มีไอเท็มที่เสนอ</p>}
          </div>
          {offeredByOtherGemItems.length > 0 && (
            <div className="mt-2 grid gap-1">
              {offeredByOtherGemItems.map((id) => (
                <p key={id} className="rounded border border-accent/30 bg-accent/5 px-2 py-1.5 text-xs text-accent">
                  {GEM_SHOP_ITEMS.find((item) => item.id === id)?.name ?? id}
                </p>
              ))}
            </div>
          )}
          <p className={`mt-2 text-[10px] ${otherReady ? 'text-emerald-400' : 'text-muted-foreground'}`}>{otherReady ? 'อีกฝ่ายพร้อมแลกแล้ว' : 'อีกฝ่ายยังไม่พร้อม'}</p>
        </section>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-primary" role="status">{status}</p>
        <PxButton disabled={!canEdit} variant={ready ? 'secondary' : 'primary'} onClick={() => void sync(offered, offeredGemItems, !ready)}>
          {ready ? 'ยกเลิกพร้อม' : 'พร้อมแลก'}
        </PxButton>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">ไอเท็ม Gold และสิทธิ์ครอบครองของร้านเพชรจะโอนเมื่อทั้งสองฝ่ายยืนยัน พร้อมตรวจสอบยอดและพื้นที่กระเป๋าในธุรกรรมเดียว</p>
    </PanelFrame>
  )
}
