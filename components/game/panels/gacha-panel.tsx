'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ITEMS } from '@/lib/game/data'
import { addItem, closePanel, notify, player, saveGame } from '@/lib/game/engine'
import { PanelFrame, PxButton } from './panels'

const RATES = [
  { itemId: 'weapon_059', rate: 3, rarity: 'แรร์' },
  { itemId: 'weapon_039', rate: 5, rarity: 'แรร์' },
  { itemId: 'weapon_028', rate: 7, rarity: 'แรร์' },
  { itemId: 'weapon_023', rate: 10, rarity: 'แรร์' },
  { itemId: 'weapon_001', rate: 15, rarity: 'ธรรมดา' },
  { itemId: 'weapon_005', rate: 18, rarity: 'ธรรมดา' },
  { itemId: 'weapon_010', rate: 20, rarity: 'ธรรมดา' },
  { itemId: 'weapon_018', rate: 22, rarity: 'ธรรมดา' },
]
const COST = 500

export function GachaPanel() {
  const [result, setResult] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)

  const draw = () => {
    if (rolling || player().gold < COST) return
    setRolling(true)
    window.setTimeout(() => {
      const roll = Math.random() * 100
      let cursor = 0
      const picked = RATES.find((entry) => {
        cursor += entry.rate
        return roll <= cursor
      }) ?? RATES[RATES.length - 1]
      if (!addItem(picked.itemId)) {
        setResult('กระเป๋าเต็ม — ยังไม่ได้ใช้ Gold')
        setRolling(false)
        return
      }
      player().gold -= COST
      saveGame()
      notify()
      void (async () => {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          const { data: existing } = await supabase
            .from('game_inventory')
            .select('quantity')
            .eq('user_id', data.user.id)
            .eq('item_id', picked.itemId)
            .maybeSingle()
          await supabase.from('game_inventory').upsert({
            user_id: data.user.id,
            item_id: picked.itemId,
            quantity: (existing?.quantity ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
        }
      })()
      setResult(`${ITEMS[picked.itemId].name} (${picked.rarity})`)
      setRolling(false)
    }, 420)
  }

  return (
    <PanelFrame title="ตู้สุ่มไอเทมแรร์" subtitle="อัตราดรอปเปิดเผย โปร่งใสทุกครั้ง">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {RATES.map((entry) => {
            const item = ITEMS[entry.itemId]
            return (
              <div key={entry.itemId} className="border-2 border-border bg-muted/60 p-2 text-center">
                <div className="mx-auto mb-2 grid size-12 place-items-center overflow-hidden rounded-lg border-2 border-white/20 bg-card text-2xl" style={{ color: item.color }}>
                  {item.asset ? <img src={item.asset} alt={item.name} className="pixelated size-full object-contain" /> : <span aria-hidden="true">{entry.rarity.slice(0, 1)}</span>}
                </div>
                <p className="truncate text-xs text-foreground">{item.name}</p>
                <p className={`mt-1 text-xs ${entry.rarity === 'แรร์' ? 'text-accent' : 'text-primary'}`}>{entry.rarity} · {entry.rate}%</p>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-primary/40 bg-primary/10 p-3">
          <div>
            <p className="text-sm text-primary">สุ่ม 1 ครั้ง</p>
            <p className="text-xs text-muted-foreground">ใช้ {COST.toLocaleString()} G</p>
          </div>
          <PxButton onClick={draw} disabled={rolling || player().gold < COST}>
            {rolling ? 'กำลังสุ่ม...' : 'เปิดตู้'}
          </PxButton>
        </div>
        {result && <p className="border-2 border-accent bg-accent/10 p-3 text-center text-accent">ได้รับ: {result}</p>}
        <p className="text-xs text-muted-foreground">อัตราดรอปคิดจากตารางด้านบน และจะแสดงผลทันทีหลังเปิดตู้</p>
        <PxButton variant="secondary" onClick={closePanel}>ปิด</PxButton>
      </div>
    </PanelFrame>
  )
}
