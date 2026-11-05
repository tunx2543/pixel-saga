'use client'

import { useState } from 'react'
import { ITEMS } from '@/lib/game/data'
import { closePanel, drinkPotion, equip, itemLabel, unequip } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { PanelFrame, PxButton } from './panels'

export function InventoryPanel() {
  const { p } = useGame()
  const [tab, setTab] = useState<'items' | 'use'>('items')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  if (!p) return null

  const selectedItem = selectedItemId ? ITEMS[selectedItemId] : null
  const selectedMeta = selectedItem ? {
    jobs: selectedItem.kind === 'weapon' ? 'นักดาบ, นักธนู, นักเวท' : selectedItem.kind === 'armor' ? 'ทุกอาชีพ' : 'ทุกอาชีพ',
    level: selectedItem.kind === 'weapon' || selectedItem.kind === 'armor' ? 10 : 1,
    slot: selectedItem.kind === 'weapon' ? 'อาวุธ' : selectedItem.kind === 'armor' ? 'เกราะ' : 'ไอเทมทั่วไป',
  } : null
  const visibleItems = p.inventory.filter((item) => tab === 'items'
    ? ITEMS[item.itemId]?.kind === 'weapon' || ITEMS[item.itemId]?.kind === 'armor'
    : ITEMS[item.itemId]?.kind === 'consumable')

  return (
    <PanelFrame title="กระเป๋าและอุปกรณ์" subtitle={`${p.inventory.length} ช่องที่ใช้ / 30 ช่อง`}>
      <div className="mb-3 grid grid-cols-2 gap-1">
        <PxButton variant={tab === 'items' ? 'primary' : 'secondary'} onClick={() => setTab('items')}>อุปกรณ์</PxButton>
        <PxButton variant={tab === 'use' ? 'primary' : 'secondary'} onClick={() => setTab('use')}>ใช้ไอเทม</PxButton>
      </div>
      {tab === 'use' && (
        <div className="mb-3 flex gap-2">
          <PxButton onClick={() => drinkPotion('hp')}>ใช้ยา HP</PxButton>
          <PxButton onClick={() => drinkPotion('mp')}>ใช้ยา MP</PxButton>
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(['weapon', 'armor'] as const).map((slot) => {
          const item = p.equipment[slot]
          return (
            <div key={slot} className="rounded border border-border bg-secondary/60 p-2">
              <p className="mb-1 text-[10px] text-muted-foreground">{slot === 'weapon' ? 'อาวุธ' : 'เกราะ'}</p>
              {item ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-primary">{itemLabel(item)}</span>
                  <PxButton variant="secondary" onClick={() => unequip(slot)}>ถอด</PxButton>
                </div>
              ) : <span className="text-xs text-muted-foreground">ว่าง</span>}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visibleItems.map((item) => {
          const def = ITEMS[item.itemId]
          if (!def) return null
          const equipable = def.kind === 'weapon' || def.kind === 'armor'
          return (
            <div key={item.uid} role="button" tabIndex={0} onClick={() => setSelectedItemId(item.itemId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedItemId(item.itemId) }} className="cursor-pointer rounded border border-border bg-card/80 p-2 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded border border-white/20 text-lg" style={{ backgroundColor: `${def.color}33` }}>
                  {def.kind === 'weapon' ? '⚔' : def.kind === 'armor' ? '◆' : def.kind === 'consumable' ? '●' : '✦'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-foreground">{itemLabel(item)}</p>
                  <p className="text-[10px] text-muted-foreground">x{item.qty}</p>
                </div>
              </div>
              {equipable && <PxButton className="w-full" onClick={() => equip(item.uid)}>สวมใส่</PxButton>}
            </div>
          )
        })}
      </div>
      {p.inventory.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">กระเป๋ายังว่างอยู่</p>}
      {selectedItem && selectedMeta && (
        <div className="mt-4 rounded border border-primary/50 bg-primary/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-pixel text-sm text-primary">รายละเอียดไอเทม</h3>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedItemId(null)} aria-label="ปิดรายละเอียด">ปิด</button>
          </div>
          <p className="font-pixel text-base text-foreground">{selectedItem.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{selectedItem.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-muted-foreground">ช่องสวมใส่</dt><dd className="text-foreground">{selectedMeta.slot}</dd></div>
            <div><dt className="text-muted-foreground">เลเวลที่ใช้ได้</dt><dd className="text-foreground">Lv. {selectedMeta.level} ขึ้นไป</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">อาชีพที่ใส่ได้</dt><dd className="text-primary">{selectedMeta.jobs}</dd></div>
          </dl>
        </div>
      )}
      <div className="mt-4 flex justify-end"><PxButton variant="secondary" onClick={closePanel}>ปิด</PxButton></div>
    </PanelFrame>
  )
}
