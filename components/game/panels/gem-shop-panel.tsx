'use client'

import { useState } from 'react'
import { Gem, Sparkles } from 'lucide-react'
import { GEM_SHOP_CATEGORIES, GEM_SHOP_ITEMS, type GemShopCategory, type GemShopItem } from '@/lib/game/gem-shop'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'
import { formatNum } from '../format'
import { PanelFrame } from './panels'

type CategoryFilter = 'all' | GemShopCategory

function GemItemArt({ item, large = false }: { item: GemShopItem; large?: boolean }) {
  const colors = { '1': item.colors.primary, '2': item.colors.secondary, '3': item.colors.accent }
  const px = large ? 12 : 7

  return (
    <div
      aria-hidden="true"
      className={cn('gem-art-wrap', `gem-motion-${item.motion}`, large && 'gem-art-wrap-large')}
      style={{
        background: `radial-gradient(circle at 50% 48%, ${item.colors.primary}55, transparent 68%), linear-gradient(145deg, ${item.colors.secondary}22, transparent 72%)`,
      }}
    >
      <div className="gem-art-grid" style={{ gridTemplateColumns: `repeat(8, ${px}px)` }}>
        {item.pixels.flatMap((row, rowIndex) =>
          Array.from(row.padEnd(8, '.').slice(0, 8)).map((pixel, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className="gem-art-pixel"
              style={{ width: px, height: px, backgroundColor: colors[pixel as keyof typeof colors] ?? 'transparent' }}
            />
          )),
        )}
      </div>
      <span className="gem-art-sparkle gem-art-sparkle-one" style={{ backgroundColor: item.colors.accent }} />
      <span className="gem-art-sparkle gem-art-sparkle-two" style={{ backgroundColor: item.colors.primary }} />
      {item.motion === 'orbit' && <span className="gem-art-orbit" style={{ borderColor: `${item.colors.accent}aa` }} />}
    </div>
  )
}

export function GemShopPanel() {
  const { p } = useGame()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [selectedId, setSelectedId] = useState(GEM_SHOP_ITEMS[0].id)
  const items = GEM_SHOP_ITEMS.filter((item) => category === 'all' || item.category === category)
  const selected = items.find((item) => item.id === selectedId) ?? items[0]

  return (
    <PanelFrame title="ร้านค้าเพชร" subtitle="คอลเลกชันพิกเซลแฟชั่น สัตว์คู่ใจ และไอเทมอำนวยความสะดวก">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/5 px-3 py-2">
        <p className="flex items-center gap-2 text-[11px] text-cyan-100">
          <Sparkles className="size-4 text-cyan-300" aria-hidden />
          แคตตาล็อกตัวอย่าง — ปุ่มนี้ไม่หักเพชรและยังไม่ปลดล็อกไอเทมจริง
        </p>
        <p className="flex items-center gap-1.5 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-sm font-bold text-cyan-100" aria-label={`เพชรคงเหลือ ${formatNum(p?.diamonds ?? 0)}`}>
          <Gem className="size-4" aria-hidden /> {formatNum(p?.diamonds ?? 0)} D
        </p>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="หมวดหมู่สินค้า">
        {GEM_SHOP_CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={category === entry.id}
            onClick={() => {
              setCategory(entry.id)
              setSelectedId(GEM_SHOP_ITEMS.find((item) => entry.id === 'all' || item.category === entry.id)?.id ?? GEM_SHOP_ITEMS[0].id)
            }}
            className={cn(
              'pixel-btn shrink-0 px-3 py-1.5 text-[10px]',
              category === entry.id ? 'bg-cyan-300 text-slate-950' : 'bg-secondary text-secondary-foreground',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <section className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_25%_50%,rgba(34,211,238,.12),transparent_36%),linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,27,75,.92))] p-3 sm:grid-cols-[148px_1fr] sm:items-center" aria-labelledby="gem-preview-title">
        <div className="flex justify-center">
          <GemItemArt item={selected} large />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 id="gem-preview-title" className="text-base font-bold text-white">{selected.name}</h3>
            <span className="rounded border border-fuchsia-300/30 bg-fuchsia-300/10 px-1.5 py-0.5 text-[9px] text-fuchsia-200">{selected.rarity}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">{selected.description}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-cyan-100">{selected.ability}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-cyan-200"><Gem className="size-4" aria-hidden /> {formatNum(selected.price)} เพชร</p>
        </div>
      </section>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => {
          const active = selected.id === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg border-2 p-2 text-left transition-colors',
                  active ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-border bg-muted/70 hover:border-cyan-300/35',
                )}
              >
                <GemItemArt item={item} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">{item.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{item.rarity} · {item.description}</span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan-200"><Gem className="size-3" aria-hidden /> {formatNum(item.price)} D</span>
                </span>
                <span className="shrink-0 text-[9px] text-cyan-200">{active ? 'กำลังดู' : 'ดูตัวอย่าง'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">ความสามารถและราคาในหน้านี้เป็นข้อมูลจำลองเพื่อให้ดูคอนเซปต์ก่อนเปิดขายจริง</p>
    </PanelFrame>
  )
}
