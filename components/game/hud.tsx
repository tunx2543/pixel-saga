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

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-[11px] text-muted-foreground">{label}</span>
      <div
        className="relative h-3.5 flex-1 border-2 border-[#0e0f1a] bg-[#0e0f1a]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.floor(value)}
        aria-valuemax={Math.floor(max)}
      >
        <div className={cn('h-full transition-[width] duration-150', color)} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-white drop-shadow-[1px_1px_0_#000]">
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
      <div className="pixel-panel absolute left-2 top-2 w-[min(18rem,calc(100vw-1rem))] p-2.5 md:left-3 md:top-3">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="truncate text-sm text-foreground">
            {p.gm && <span className="mr-1 text-gold">[GM]</span>}
            {p.name}
          </p>
          <p className="shrink-0 text-xs text-primary">
            Lv.{p.level} {job.name}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Bar label="HP" value={p.hp} max={s.maxHp} color="bg-hp" />
          <Bar label="MP" value={p.mp} max={s.maxMp} color="bg-mp" />
          <Bar label="EXP" value={p.level >= MAX_LEVEL ? need : p.exp} max={need} color="bg-exp" />
        </div>
        <p className="mt-1.5 text-xs text-gold">{formatNum(p.gold)} G</p>
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
            className="pixel-btn flex items-center gap-1 bg-secondary px-2 py-1.5 text-xs text-secondary-foreground hover:brightness-110"
          >
            <Save className="size-4" aria-hidden />
            <span className="sr-only">บันทึกเกม</span>
          </button>
          <button
            type="button"
            onClick={quitToTitle}
            className="pixel-btn flex items-center gap-1 bg-secondary px-2 py-1.5 text-xs text-secondary-foreground hover:brightness-110"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="sr-only">ออกสู่หน้าหลัก</span>
          </button>
        </div>
      </div>

      {g.nearNpc && !g.panel && (
        <button
          type="button"
          onClick={interact}
          className="pixel-btn absolute bottom-48 left-1/2 -translate-x-1/2 bg-accent px-4 py-2 text-sm text-accent-foreground hover:brightness-110 md:bottom-24"
        >
          คุยกับ {g.nearNpc.name} (E)
        </button>
      )}

      <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 gap-1.5 md:flex">
        <ActionSlot hotkey="Space" label="โจมตี" onClick={basicAttack} />
        {job.skills.map((sk, i) => {
          const cd = skillCooldown(sk)
          return (
            <ActionSlot
              key={sk.id}
              hotkey={String(i + 1)}
              label={sk.name}
              sub={`${sk.mp} MP`}
              cooldown={cd > 0 ? cd / sk.cooldown : 0}
              disabled={p.mp < sk.mp}
              color={sk.color}
              onClick={() => castSkill(i)}
            />
          )
        })}
        <ActionSlot hotkey="Q" label="ยา HP" sub={`x${potionCount('hp')}`} color="#e5484d" onClick={() => drinkPotion('hp')} />
        <ActionSlot hotkey="R" label="ยา MP" sub={`x${potionCount('mp')}`} color="#4c8bf5" onClick={() => drinkPotion('mp')} />
      </div>
    </>
  )
}

function ActionSlot({
  hotkey,
  label,
  sub,
  cooldown = 0,
  disabled,
  color,
  onClick,
}: {
  hotkey: string
  label: string
  sub?: string
  cooldown?: number
  disabled?: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'pixel-panel relative flex h-14 w-16 flex-col items-center justify-center overflow-hidden px-1 text-center hover:brightness-125',
        disabled && 'opacity-50',
      )}
    >
      <span className="absolute left-1 top-0.5 text-[9px] text-muted-foreground">{hotkey}</span>
      <span className="mt-1 line-clamp-1 text-[11px]" style={{ color: color ?? 'var(--foreground)' }}>
        {label}
      </span>
      {sub && <span className="text-[9px] text-muted-foreground">{sub}</span>}
      {cooldown > 0 && (
        <span className="absolute inset-x-0 bottom-0 bg-black/60" style={{ height: `${cooldown * 100}%` }} aria-hidden />
      )}
    </button>
  )
}
