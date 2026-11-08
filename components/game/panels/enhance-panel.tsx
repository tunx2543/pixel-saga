'use client'

import { useState } from 'react'
import { ITEMS, MAX_PLUS, enhanceCost, enhanceRate } from '@/lib/game/data'
import { countItem, enhance, findEquipment, itemLabel, itemPower, type EnhanceResult, type InvItem } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'
import { formatNum } from '../format'
import { ItemIcon, ItemSlot } from '../item-icon'
import { PanelFrame, PxButton } from './panels'

export function EnhancePanel() {
  const g = useGame()
  const p = g.p!
  const gear: { it: InvItem; equipped: boolean }[] = [
    ...(['weapon', 'armor', 'shoes', 'cloak', 'accessory'] as const).flatMap((slot) => p.equipment[slot] ? [{ it: p.equipment[slot]!, equipped: true }] : []),
    ...p.inventory.filter((i) => ['weapon', 'armor'].includes(ITEMS[i.itemId].kind)).map((it) => ({ it, equipped: false })),
  ]
  const [selected, setSelected] = useState<string | null>(gear[0]?.it.uid ?? null)
  const [result, setResult] = useState<EnhanceResult | null>(null)
  const item = selected ? findEquipment(selected) : null
  const def = item ? ITEMS[item.itemId] : null
  const stones = countItem('enhance_stone')
  const cost = item && def ? enhanceCost(item.plus, def.tier ?? 1) : null
  const rate = item ? enhanceRate(item.plus) : 0
  const maxed = item ? item.plus >= MAX_PLUS : false

  return (
    <PanelFrame title="โรงตีเหล็กบุญมา" subtitle="ใช้หินตีบวก + เงิน เพื่อเพิ่มพลังอุปกรณ์ (สูงสุด +15)">
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">เลือกอุปกรณ์ ({gear.length})</p>
          {gear.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีอุปกรณ์ที่ตีบวกได้</p>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {gear.map(({ it, equipped }) => (
                <div key={it.uid} className="relative">
                  <ItemSlot
                    item={it}
                    selected={selected === it.uid}
                    onClick={() => {
                      setSelected(it.uid)
                      setResult(null)
                    }}
                  />
                  {equipped && <span className="pointer-events-none absolute bottom-0 left-0.5 text-[9px] text-accent">E</span>}
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            หินตีบวกที่มี: <span className="text-[#4cc9f0]">{stones}</span> ก้อน (ซื้อได้ที่พ่อค้า หรือดรอปจากมอนสเตอร์)
          </p>
        </div>

        {item && def && cost ? (
          <div className="flex flex-col gap-3 border-2 border-border bg-muted p-3">
            <div className="flex items-center gap-3">
              <div className="border-2 border-border bg-background p-1">
                <ItemIcon itemId={item.itemId} size={48} />
              </div>
              <div>
                <p className="text-base text-foreground">{itemLabel(item)}</p>
                <p className="text-xs text-muted-foreground">
                  {def.kind === 'weapon' ? 'พลังโจมตี' : 'พลังป้องกัน'} {itemPower(item)}
                  {!maxed && (
                    <span className="text-accent"> → {itemPower({ ...item, plus: item.plus + 1 })}</span>
                  )}
                </p>
              </div>
            </div>

            {maxed ? (
              <p className="text-sm text-gold">อุปกรณ์นี้ตีบวกถึงระดับสูงสุดแล้ว!</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">ระดับ</dt>
                <dd className="text-right text-foreground">
                  +{item.plus} → <span className="text-gold">+{item.plus + 1}</span>
                </dd>
                <dt className="text-muted-foreground">โอกาสสำเร็จ</dt>
                <dd className={cn('text-right', rate >= 0.8 ? 'text-accent' : rate >= 0.4 ? 'text-gold' : 'text-destructive')}>
                  {Math.round(rate * 100)}%
                </dd>
                <dt className="text-muted-foreground">ค่าตีบวก</dt>
                <dd className={cn('text-right', p.gold >= cost.gold ? 'text-gold' : 'text-destructive')}>{formatNum(cost.gold)} G</dd>
                <dt className="text-muted-foreground">หินตีบวก</dt>
                <dd className={cn('text-right', stones >= cost.stones ? 'text-[#4cc9f0]' : 'text-destructive')}>
                  {cost.stones} ก้อน
                </dd>
              </dl>
            )}

            {!maxed && item.plus >= 6 && (
              <p className="border-2 border-destructive/60 bg-destructive/10 p-2 text-[11px] text-destructive">
                คำเตือน: ตั้งแต่ +6 ขึ้นไป หากล้มเหลวระดับจะลดลง 1
              </p>
            )}

            <PxButton
              onClick={() => setResult(enhance(item.uid))}
              disabled={maxed || p.gold < cost.gold || stones < cost.stones}
              className="py-2.5 text-sm"
            >
              ตีบวก!
            </PxButton>

            {result && (
              <p
                role="status"
                className={cn(
                  'border-2 p-2 text-center text-sm',
                  result.result === 'success' && 'border-accent bg-accent/15 text-accent',
                  result.result === 'fail' && 'border-border bg-background text-muted-foreground',
                  (result.result === 'down' || result.result === 'error') && 'border-destructive bg-destructive/15 text-destructive',
                )}
              >
                {result.message}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">เลือกอุปกรณ์ทางซ้ายเพื่อตีบวก</p>
        )}
      </div>
    </PanelFrame>
  )
}
