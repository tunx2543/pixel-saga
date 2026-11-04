'use client'

import { ITEMS } from '@/lib/game/data'
import type { InvItem } from '@/lib/game/engine'
import { itemIconUrl } from '@/lib/game/sprites'
import { cn } from '@/lib/utils'

export function ItemIcon({ itemId, size = 32, className }: { itemId: string; size?: number; className?: string }) {
  const def = ITEMS[itemId]
  if (!def) return null
  return (
    <img
      src={itemIconUrl(def.icon, def.color)}
      alt={def.name}
      width={size}
      height={size}
      className={cn('pixelated', className)}
      draggable={false}
    />
  )
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
