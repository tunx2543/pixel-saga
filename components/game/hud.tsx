'use client'

import { Backpack, LogOut, Save } from 'lucide-react'
import { expToNext, MAX_LEVEL } from '@/lib/game/data'
import {
  basicAttack,
  castSkill,
  currentJob,
  currentMap,
  drinkPotion,
  getStats,
  interact,
  openPanel,
  potionCount,
  quitToTitle,
  saveGame,
  say,
  skillCooldown,
} from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'
import { formatNum } from './format'

// ย่อขนาดหลอดพลังให้บางลงและประหยัดพื้นที่
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 text-[10px] text-muted-foreground">{label}</span>
      <div
        className="relative h-2.5 flex-1 border border-[#0e0f1a] bg-[#0e0f1a]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.floor(value)}
        aria-valuemax={Math.floor(max)}
      >
        <div className={cn('h-full transition-[width] duration-150', color)} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] leading-none text-white drop-shadow-[1px_1px_0_#000]">
          {formatNum(value)} / {formatNum(max)}
        </span>
      </div>
    </div>
  )
}

export function Hud() {
  const g = useGame()
  const p = g.p!
  const s = getStats()
  const job = currentJob()
  const map = currentMap()
  const need = expToNext(p.level)
  const savedAgo = g.lastSavedAt ? Math.floor((Date.now() - g.lastSavedAt) / 1000) : null

  return (
    <>
      {/* ป้ายโปรไฟล์มุมซ้ายบน (ย่อขนาดให้กะทัดรัดลง) */}
      <div className="pixel-panel absolute left-2 top-2 w-[min(14rem,calc(100vw-1rem))] p-2 md:left-3 md:top-3">
        <div className="mb-1 flex items-baseline justify-between gap-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {p.gm && <span className="mr-1 text-gold">[GM]</span>}
            {p.name}
          </p>
          <p className="shrink-0 text-[10px] text-primary">
            Lv.{p.level} {job.name}
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <Bar label="HP" value={p.hp} max={s.maxHp} color="bg-hp" />
          <Bar label="MP" value={p.mp} max={s.maxMp} color="bg-mp" />
          <Bar label="EXP" value={p.level >= MAX_LEVEL ? need : p.exp} max={need} color="bg-exp" />
        </div>
        <p className="mt-1 text-[11px] text-gold">{formatNum(p.gold)} G</p>
      </div>

      <div className="absolute right-2 top-2 flex flex-col items-end gap-2 md:right-3 md:top-3">
        <div className="pixel-panel px-3 py-2 text-right">
          <p className="text-sm text-foreground">{map.name}</p>
          <p className={cn('text-xs', map.safe ? 'text-accent' : 'text-destructive')}>{map.levelLabel}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {savedAgo === null ? 'ยังไม่บันทึก' : `บันทึกอัตโนมัติ ${savedAgo} วิที่แล้ว`}
          </p>
          {p.gm && (
            <p className="text-[10px] text-gold">
              GM {p.god ? '• อมตะ' : ''} {p.speed !== 1 ? `• x${p.speed}` : ''}
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => openPanel('character')}
            className="pixel-btn flex items-center gap-1 bg-secondary px-2 py-1.5 text-xs text-secondary-foreground hover:brightness-110"
          >
            <Backpack className="size-4" aria-hidden />
            <span className="hidden sm:inline">ตัวละคร (I)</span>
            <span className="sr-only sm:hidden">ตัวละคร</span>
          </button>
          <button
            type="button"
            onClick={() => {
              saveGame()
              say('system', 'บันทึกเกมเรียบร้อย')
            }}
            className="pixel-btn flex items-center gap-1 bg-secondary px-2 py-1.5
          
