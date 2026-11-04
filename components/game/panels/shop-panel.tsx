'use client'

import { useState } from 'react'
import { ITEMS, SHOP_STOCK } from '@/lib/game/data'
import { buyItem, itemLabel, sellItem, sellPrice } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'
import { formatNum } from '../format'
import { ItemIcon } from '../item-icon'
import { PanelFrame, PxButton } from './panels'

const TYPE_NAME: Record<string, string> = { stick: 'กระบอง', sword: 'ดาบ', staff: 'คทา', bow: 'ธนู', dagger: 'มีด' }

export function ShopPanel() {
  const g = useGame()
  const p = g.p!
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')

  return (
    <PanelFrame title="ร้านค้าลุงสมปอง" subtitle="ซื้อยา อุปกรณ์ และหินตีบวก หรือขายของที่หามาได้">
      <div className="mb-3 flex gap-1.5" role="tablist">
        {(['buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('pixel-btn px-4 py-1.5 text-sm', tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}
          >
            {t === 'buy' ? 'ซื้อ' : 'ขาย'}
          </button>
        ))}
      </div>

      {tab === 'buy' ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {SHOP_STOCK.map((id) => {
            const def = ITEMS[id]
            const stack = def.kind === 'consumable' || def.kind === 'material'
            return (
              <li key={id} className="flex items-center gap-3 border-2 border-border bg-muted p-2">
                <ItemIcon itemId={id} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{def.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {def.weaponType ? `${TYPE_NAME[def.weaponType]} ATK +${def.atk}` : def.description}
                    {def.reqLevel && def.reqLevel > 1 ? ` • Lv.${def.reqLevel}` : ''}
                  </p>
                  <p className="text-xs text-gold">{formatNum(def.price)} G</p>
                </div>
                <div className="flex flex-col gap-1">
                  <PxButton onClick={() => buyItem(id, 1)} disabled={p.gold < def.price}>
                    ซื้อ
                  </PxButton>
                  {stack && (
                    <PxButton variant="secondary" onClick={() => buyItem(id, 10)} disabled={p.gold < def.price * 10}>
                      x10
                    </PxButton>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : p.inventory.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">กระเป๋าว่างเปล่า</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {p.inventory.map((it) => (
            <li key={it.uid} className="flex items-center gap-3 border-2 border-border bg-muted p-2">
              <ItemIcon itemId={it.itemId} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {itemLabel(it)} {it.qty > 1 && <span className="text-muted-foreground">x{it.qty}</span>}
                </p>
                <p className="text-xs text-gold">{formatNum(sellPrice(it))} G / ชิ้น</p>
              </div>
              <div className="flex flex-col gap-1">
                <PxButton variant="accent" onClick={() => sellItem(it.uid, 1)}>
                  ขาย
                </PxButton>
                {it.qty > 1 && (
                  <PxButton variant="secondary" onClick={() => sellItem(it.uid, it.qty)}>
                    ทั้งหมด
                  </PxButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelFrame>
  )
}
