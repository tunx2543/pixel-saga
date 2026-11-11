'use client'

import { useState } from 'react'
import { addItem, game, notify, saveGame } from '@/lib/game/engine'
import { ITEMS } from '@/lib/game/data'

const CHECKIN_KEY = 'pixel-quest-checkin-v2'
const rewards = [
  { label: 'เพชร 5 เม็ด', diamonds: 5, icon: 'D' },
  { label: 'ทอง 500 G', gold: 500, icon: 'G' },
  { label: 'กล่องสุ่มอาวุธ', weaponBox: true, icon: 'W' },
  { label: 'เพชร 10 เม็ด', diamonds: 10, icon: 'D' },
  { label: 'บัตรเปลี่ยนชื่อ', itemId: 'name_change_ticket', qty: 1, icon: 'N' },
  { label: 'ทอง 1,000 G', gold: 1000, icon: 'G' },
  { label: 'กล่องสุ่มอาวุธ + เพชร 20', weaponBox: true, diamonds: 20, icon: 'W' }
]

function localDateKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function todayIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

export function CheckinModal({ onClose }: { onClose: () => void }) {
  const today = todayIndex()
  const current = rewards[today]
  const [claimed, setClaimed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(CHECKIN_KEY) === localDateKey())
  const [result, setResult] = useState('')

  const claim = () => {
    if (claimed || !game.p) return
    if (current.itemId && !addItem(current.itemId, current.qty ?? 1)) return
    let resultText = current.label
    if (current.weaponBox) {
      const pool = Object.values(ITEMS).filter((item) => item.kind === 'weapon' && !item.gmOnly && item.reqLevel && item.reqLevel <= 30)
      const picked = pool[Math.floor(Math.random() * pool.length)]
      if (!picked || !addItem(picked.id)) return
      resultText = `${current.label}: ${picked.name}`
    }
    game.p.diamonds = (game.p.diamonds ?? 0) + (current.diamonds ?? 0)
    game.p.gold += current.gold ?? 0
    window.localStorage.setItem(CHECKIN_KEY, localDateKey())
    setClaimed(true)
    setResult(resultText)
    saveGame()
    notify()
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5" role="presentation">
      <section className="pixel-panel w-full max-w-2xl border border-amber-300/40 bg-[#171522] p-4 shadow-[0_24px_80px_rgba(0,0,0,.65)] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">Daily Blessing · Town Hall</p>
            <h2 id="checkin-title" className="mt-1 text-2xl font-bold text-foreground">หอรางวัลประจำวัน</h2>
            <p className="mt-1 text-xs text-muted-foreground">รับรางวัลหมุนเวียน 7 วัน: เพชร ทอง อาวุธ และบัตรเปลี่ยนชื่อ</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" aria-label="ปิดหน้ารางวัล">ปิด</button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {rewards.map((reward, index) => (
            <div key={reward.label + index} className={`min-w-0 rounded-lg border p-2 text-center ${index === today ? 'border-amber-300 bg-amber-300/15 shadow-[0_0_18px_rgba(248,197,55,.2)]' : 'border-border/70 bg-muted/30'}`}>
              <p className="text-[9px] text-muted-foreground">วันที่ {index + 1}</p>
              <div className="mx-auto my-2 grid size-9 place-items-center rounded-md border border-white/10 bg-black/20 text-base font-bold text-amber-200">{reward.icon}</div>
              <p className="min-h-8 text-[9px] leading-tight text-foreground">{reward.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/25 bg-gradient-to-r from-amber-300/10 to-violet-400/10 p-3 sm:p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-amber-300/40 bg-amber-300/10 text-xl font-bold text-amber-200">{current.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-amber-300">รางวัลวันนี้ · วันที่ {today + 1}</p>
            <p className="font-bold text-foreground">{current.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">รับได้วันละ 1 ครั้ง • รีเซ็ตทุกวันตามเวลาท้องถิ่น</p>
          </div>
          <button type="button" onClick={claim} disabled={claimed} className="pixel-btn min-w-24 bg-amber-300 px-4 py-2.5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">{claimed ? 'รับแล้ววันนี้' : 'รับรางวัล'}</button>
        </div>
        {result && <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-center text-xs text-emerald-200" role="status">ได้รับ: {result}</p>}
        <p className="mt-3 text-center text-[10px] text-muted-foreground">ยอดเพชรของคุณ: <span className="font-bold text-cyan-200">{game.p?.diamonds ?? 0} เพชร</span> <span className="mx-1">·</span> Gold: <span className="font-bold text-amber-200">{game.p?.gold.toLocaleString() ?? 0} G</span></p>
      </section>
    </div>
  )
}
