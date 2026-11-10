'use client'

import { useMemo, useState } from 'react'
import { game, notify } from '@/lib/game/engine'
import { updateTradeOffer } from '@/lib/game/social'
import { useGame } from '@/lib/game/use-game'
import { ITEMS } from '@/lib/game/data'
import { PanelFrame, PxButton } from './panels'

export function TradePanel() {
  const g = useGame()
  const [offered, setOffered] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('เลือกไอเท็มเพื่อใส่ในรายการแลกเปลี่ยน')
  const target = game.remotePlayers.find((player) => player.userId === game.tradeTargetId)
  const inventory = useMemo(() => g.p?.inventory.filter((entry) => entry.qty > 0) ?? [], [g.p?.inventory])

  const sync = async (nextItems: string[], nextReady: boolean) => {
    if (!game.tradeId) {
      setStatus('ไม่พบรายการเทรด กรุณากดปุ่มแลกเปลี่ยนจากตัวละครอีกครั้ง')
      return
    }
    setStatus('กำลังบันทึกรายการ...')
    const result = await updateTradeOffer(game.tradeId, { senderItems: nextItems, recipientItems: [], senderReady: nextReady, recipientReady: false })
    setStatus(result.message)
    if (!result.ok) game.chat.push({ id: Date.now(), type: 'error', text: result.message })
    notify()
  }

  return (
    <PanelFrame title="แลกเปลี่ยนไอเท็ม" subtitle={target ? `กับ ${target.displayName}` : 'รอคำขอแลกเปลี่ยน'}>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <h3 className="text-sm font-bold text-primary">ของที่คุณเสนอ</h3>
          <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
            {inventory.map((entry) => {
              const item = ITEMS[entry.itemId]
              const selected = offered.includes(entry.uid)
              return (
                <button key={entry.uid} type="button" className={`flex items-center justify-between rounded border px-2 py-1.5 text-left text-xs ${selected ? 'border-primary bg-primary/20' : 'border-border bg-secondary/60'}`} onClick={() => {
                  const next = selected ? offered.filter((uid) => uid !== entry.uid) : [...offered, entry.uid]
                  setOffered(next)
                  setReady(false)
                  void sync(next, false)
                }}>
                  <span>{item?.name ?? entry.itemId} +{entry.plus}</span><span className="text-muted-foreground">x{entry.qty}</span>
                </button>
              )
            })}
            {!inventory.length && <p className="text-xs text-muted-foreground">ไม่มีไอเท็มในกระเป๋า</p>}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-secondary/40 p-3">
          <h3 className="text-sm font-bold text-foreground">ของอีกฝ่าย</h3>
          <p className="mt-3 text-xs text-muted-foreground">อีกฝ่ายจะเห็นรายการของคุณเมื่อกดยอมรับคำขอ</p>
          <div className="mt-6 flex items-center justify-between gap-2">
            <span className={`text-xs font-bold ${ready ? 'text-emerald-400' : 'text-muted-foreground'}`}>{ready ? 'พร้อมแลกเปลี่ยน' : 'ยังไม่พร้อม'}</span>
            <PxButton variant={ready ? 'secondary' : 'primary'} onClick={() => { const next = !ready; setReady(next); void sync(offered, next) }}>{ready ? 'ยกเลิกพร้อม' : 'พร้อมแลก'}</PxButton>
          </div>
        </section>
      </div>
      <p className="mt-3 text-[10px] text-primary" role="status">{status}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">เลือกไอเท็มที่ต้องการแลก แล้วกดพร้อมแลกเมื่อทั้งสองฝ่ายตรวจสอบรายการเรียบร้อย</p>
    </PanelFrame>
  )
}
