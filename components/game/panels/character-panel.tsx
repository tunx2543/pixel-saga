'use client'

import { useState } from 'react'
import { ITEMS } from '@/lib/game/data'
import { INV_SIZE, canEquip, consumeItem, currentJob, getStats, itemLabel, itemPower, unequip } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { formatNum, formatPlayTime } from '../format'
import { ItemIcon, ItemSlot } from '../item-icon'
import { PanelFrame, PxButton } from './panels'

export function CharacterPanel() {
  const g = useGame()
  const p = g.p!
  const s = getStats()
  const job = currentJob()
  const [selected, setSelected] = useState<string | null>(null)
  const item = p.inventory.find((i) => i.uid === selected) ?? null
  const def = item ? ITEMS[item.itemId] : null
  const equipErr = item && def && (def.kind === 'weapon' || def.kind === 'armor') ? canEquip(item) : null

  const stats: [string, string][] = [
    ['อาชีพ', job.name],
    ['เลเวล', String(p.level)],
    ['HP สูงสุด', formatNum(s.maxHp)],
    ['MP สูงสุด', formatNum(s.maxMp)],
    ['พลังโจมตี', formatNum(s.atk)],
    ['พลังป้องกัน', formatNum(s.def)],
    ['คริติคอล', `${Math.round(s.crit * 100)}%`],
    ['ระยะโจมตี', job.ranged ? 'ไกล' : 'ประชิด'],
    ['ปราบมอนสเตอร์', formatNum(p.kills)],
    ['เวลาเล่น', formatPlayTime(p.playTime)],
  ]

  return (
    <PanelFrame title="ตัวละคร & กระเป๋า" subtitle={`${p.name} • อาวุธที่ใช้ได้: ${job.weaponTypes.join(', ')}`}>
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-y-1 border-2 border-border bg-muted p-2.5 text-xs">
            {stats.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-2 gap-2">
            {(['weapon', 'armor'] as const).map((slot) => {
              const it = p.equipment[slot]
              return (
                <div key={slot} className="flex flex-col items-center gap-1 border-2 border-border bg-muted p-2">
                  <p className="text-[10px] text-muted-foreground">{slot === 'weapon' ? 'อาวุธ' : 'ชุดเกราะ'}</p>
                  <div className="w-12">
                    <ItemSlot item={it} label="ว่าง" />
                  </div>
                  <p className="line-clamp-1 text-center text-[10px] text-foreground">{it ? itemLabel(it) : '-'}</p>
                  {it && (
                    <>
                      <p className="text-[10px] text-accent">
                        {slot === 'weapon' ? 'ATK' : 'DEF'} +{itemPower(it)}
                      </p>
                      <button type="button" onClick={() => unequip(slot)} className="text-[10px] text-destructive hover:underline">
                        ถอด
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            กระเป๋า ({p.inventory.length}/{INV_SIZE})
          </p>
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
            {Array.from({ length: INV_SIZE }).map((_, i) => {
              const it = p.inventory[i] ?? null
              return (
                <ItemSlot
                  key={it?.uid ?? `empty-${i}`}
                  item={it}
                  selected={!!it && it.uid === selected}
                  onClick={it ? () => setSelected(it.uid) : undefined}
                />
              )
            })}
          </div>

          {item && def ? (
            <div className="flex items-center gap-3 border-2 border-border bg-muted p-2.5">
              <ItemIcon itemId={item.itemId} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  {itemLabel(item)} {item.qty > 1 && <span className="text-muted-foreground">x{item.qty}</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {def.description}
                  {(def.kind === 'weapon' || def.kind === 'armor') && ` • พลังจริง ${itemPower(item)}`}
                  {def.reqLevel && def.reqLevel > 1 ? ` • Lv.${def.reqLevel}` : ''}
                </p>
                {equipErr && <p className="text-[11px] text-destructive">{equipErr}</p>}
              </div>
              {def.kind === 'consumable' && <PxButton onClick={() => consumeItem(item.uid)}>ใช้</PxButton>}
              {(def.kind === 'weapon' || def.kind === 'armor') && (
                <PxButton
                  onClick={() => {
                    consumeItem(item.uid)
                    setSelected(null)
                  }}
                  disabled={!!equipErr}
                >
                  สวมใส่
                </PxButton>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">คลิกไอเทมเพื่อดูรายละเอียด • ขายของได้ที่พ่อค้า • ฝากของได้ที่คลัง</p>
          )}
        </div>
      </div>
    </PanelFrame>
  )
}
