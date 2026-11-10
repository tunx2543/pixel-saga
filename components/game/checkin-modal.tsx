'use client'

import { useMemo, useState } from 'react'
import { addItem, game } from '@/lib/game/engine'
import { ITEMS } from '@/lib/game/data'

const CHECKIN_KEY = 'pixel-quest-checkin-v1'
const rewards = [
  { label: 'ยาแดง x3', itemId: 'red_potion', qty: 3 },
  { label: 'ผ้าขาดจากมอน x5', itemId: 'torn_cloth', qty: 5 },
  { label: 'ยาฟ้า x2', itemId: 'blue_potion', qty: 2 },
  { label: 'เศษซากมอนสเตอร์ x3', itemId: 'monster_scrap', qty: 3 },
  { label: 'บัตรเปลี่ยนชื่อ', itemId: 'name_change_ticket', qty: 1 },
  { label: 'ทอง 1,000 G', itemId: null, qty: 1000 },
  { label: 'บัตรเปลี่ยนชื่อ x2', itemId: 'name_change_ticket', qty: 2 },
]

function dayIndex() {
  const now = new Date()
  return now.getDay() === 0 ? 6 : now.getDay() - 1
}

export function CheckinModal({ onClose }: { onClose: () => void }) {
  const today = dayIndex()
  const [claimed, setClaimed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(CHECKIN_KEY) === new Date().toISOString().slice(0, 10)
  })
  const current = rewards[today]
  const item = current.itemId ? ITEMS[current.itemId] : null
  const progress = useMemo(() => `${today + 1}/7 วัน`, [today])

  const claim = () => {
    if (claimed) return
    if (current.itemId) addItem(current.itemId, current.qty)
    else game.gold += current.qty
    window.localStorage.setItem(CHECKIN_KEY, new Date().toISOString().slice(0, 10))
    setClaimed(true)
  }

  return (
    <div className="absolute inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="pixel-panel w-full max-w-lg border border-amber-300/40 bg-[#171522] p-4 shadow-2xl sm:p-6" aria-labelledby="checkin-title">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">Daily Blessing</p>
            <h2 id="checkin-title" className="mt-1 text-2xl font-bold text-foreground">เช็คอินรับรางวัล</h2>
            <p className="mt-1 text-xs text-muted-foreground">รางวัลวันนี้ • วันที่ {progress}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground" aria-label="ปิดหน้าต่าง">ปิด</button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {rewards.map((reward, index) => {
            const isToday = index === today
            const rewardItem = reward.itemId ? ITEMS[reward.itemId] : null
            return <div key={reward.label + index} className={`min-w-0 rounded-lg border p-1.5 text-center ${isToday ? 'border-amber-300 bg-amber-300/15 shadow-[0_0_18px_rgba(248,197,55,0.22)]' : 'border-border/70 bg-muted/40'}`}>
              <p className="text-[9px] text-muted-foreground">วัน {index + 1}</p>
              <div className="mx-auto my-2 grid size-9 place-items-center rounded-md border border-white/10 bg-black/20 text-lg" style={{ color: rewardItem?.color ?? '#f8c537' }}>{rewardItem?.icon === 'ticket' ? '✦' : rewardItem?.icon === 'junk' ? '◆' : rewardItem ? '✚' : 'G'}</div>
              <p className="min-h-7 text-[9px] leading-tight text-foreground">{reward.label}</p>
            </div>
          })}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-amber-300/40 bg-amber-300/10 text-2xl" style={{ color: item?.color ?? '#f8c537' }}>{item?.icon === 'ticket' ? '✦' : item?.icon === 'junk' ? '◆' : item ? '✚' : 'G'}</div>
          <div className="min-w-0 flex-1"><p className="text-[10px] text-amber-300">รางวัลประจำวันนี้</p><p className="truncate font-bold text-foreground">{current.label}</p><p className="text-xs text-muted-foreground">ล็อกอินต่อเนื่องเพื่อปลดรางวัลใหญ่วันที่ 7</p></div>
          <button type="button" onClick={claim} disabled={claimed} className="pixel-btn shrink-0 bg-amber-300 px-3 py-2 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">{claimed ? 'รับแล้ว' : 'รับรางวัล'}</button>
        </div>
      </section>
    </div>
  )
}
