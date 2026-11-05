'use client'

import { ITEMS } from '@/lib/game/data'
import { closePanel, equip, itemLabel, unequip } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { PanelFrame, PxButton } from './panels'

export function InventoryPanel() {
  const { p } = useGame()
  if (!p) return null

  return (
    <PanelFrame title="กระเป๋าและอุปกรณ์" subtitle={`${p.inventory.length} ช่องที่ใช้ / 30 ช่อง`}>
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
        {p.inventory.map((item) => {
          const def = ITEMS[item.itemId]
          if (!def) return null
          const equipable = def.kind === 'weapon' || def.kind === 'armor'
          return (
            <div key={item.uid} className="rounded border border-border bg-card/80 p-2">
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
      <div className="mt-4 flex justify-end"><PxButton variant="secondary" onClick={closePanel}>ปิด</PxButton></div>
    </PanelFrame>
  )
}
