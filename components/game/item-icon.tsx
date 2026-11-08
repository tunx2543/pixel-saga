'use client'

import { ITEMS } from '@/lib/game/data'
import type { InvItem } from '@/lib/game/engine'
import { cn } from '@/lib/utils'

const POTION_ROWS: Record<string, number> = {
  red_potion: 0,
  orange_potion: 0,
  blue_potion: 1,
  purple_potion: 2,
  white_potion: 5,
}

const POTION_COLS: Record<string, number> = {
  red_potion: 0,
  blue_potion: 0,
  orange_potion: 1,
  purple_potion: 1,
  white_potion: 3,
}

function potionIcon(itemId: string, size: number) {
  const isSpPotion = itemId === 'blue_potion' || itemId === 'purple_potion'
  const sheet = isSpPotion ? 'vial_potion' : 'round_potion'
  const row = POTION_ROWS[itemId] ?? 0
  const col = POTION_COLS[itemId] ?? 0

  return {
    backgroundImage: `url(/images/potions/${sheet}.png)`,
    backgroundPosition: `-${col * size}px -${row * size}px`,
    backgroundSize: `${size * 4}px ${size * 6}px`,
  }
}

export function ItemIcon({ itemId, size = 32, className }: { itemId: string; size?: number; className?: string }) {
  const def = ITEMS[itemId]
  if (!def) return null
  const isPotion = itemId.endsWith('_potion')

  if (isPotion) {
    return (
      <span
        role="img"
        aria-label={def.name}
        className={cn('block shrink-0 bg-no-repeat', className)}
        style={{ width: size, height: size, ...potionIcon(itemId, size) }}
      />
    )
  }

  return def.asset ? (
    <img src={def.asset} alt={def.name} width={size} height={size} className={cn('pixelated shrink-0 object-contain', className)} draggable={false} />
  ) : null
}

export function ItemSlot({
  item,
  selected,
  onClick,
  label,
}: {
  item: InvItem | null
  selected?: boolean
  onClick?: () => void
  label?: string
}) {
  const def = item ? ITEMS[item.itemId] : null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!item && !onClick}
      title={def ? `${def.name}${item!.plus ? ` +${item!.plus}` : ''} - ${def.description}` : label}
      aria-label={def ? `${def.name}${item!.plus ? ` +${item!.plus}` : ''} จำนวน ${item!.qty}` : (label ?? 'ช่องว่าง')}
      className={cn(
        'relative flex aspect-square w-full items-center justify-center border-2 bg-muted/80 transition-colors',
        selected ? 'border-primary bg-secondary' : 'border-border hover:border-primary/60',
      )}
    >
      {item ? (
        <>
          <ItemIcon itemId={item.itemId} size={30} />
          {item.plus > 0 && (
            <span className="absolute left-0.5 top-0 text-[10px] leading-none text-gold drop-shadow-[1px_1px_0_#000]">
              +{item.plus}
            </span>
          )}
          {item.qty > 1 && (
            <span className="absolute bottom-0 right-0.5 text-[10px] leading-none text-foreground drop-shadow-[1px_1px_0_#000]">
              {item.qty}
            </span>
          )}
        </>
      ) : (
        label && <span className="text-[10px] text-muted-foreground">{label}</span>
      )}
    </button>
  )
}
