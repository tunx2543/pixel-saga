'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useGame } from '@/lib/game/use-game'
import { castGmSkill, currentJob, getStats, openPanel } from '@/lib/game/engine'
import { expToNext } from '@/lib/game/data'
import { MAX_LEVEL } from '@/lib/game/data'
import { formatNum } from './format'

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-7 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-muted/60">
        <div className={`h-full ${color} transition-[width]`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-16 text-right text-muted-foreground">{formatNum(value)}/{formatNum(max)}</span>
    </div>
  )
}

export function Hud() {
  const { p } = useGame()
  const [isOpenProfile, setIsOpenProfile] = useState(true)

  if (!p) return null

  const s = getStats(p)
  const job = currentJob()
  const need = expToNext(p.level)

  return (
    <div className="pointer-events-auto pixel-panel absolute left-2 top-2 z-20 w-[min(14rem,calc(100vw-1rem))] p-2 shadow-lg md:left-3 md:top-3">
      <div
        onClick={() => setIsOpenProfile(!isOpenProfile)}
        className="flex cursor-pointer select-none items-center justify-between gap-1"
      >
        <div className="flex items-center gap-1.5 truncate">
          <p className="truncate text-xs font-semibold text-foreground">
            {p.gm && <span className="mr-1 text-gold">[GM]</span>}
            {p.name}
          </p>
          <p className="shrink-0 text-[10px] text-primary">Lv.{p.level} {job.name}</p>
        </div>
        <button type="button" aria-label={isOpenProfile ? 'พับโปรไฟล์' : 'เปิดโปรไฟล์'} className="p-0.5 hover:opacity-80">
          {isOpenProfile ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {isOpenProfile && (
        <div className="mt-1.5 border-t border-border/60 pt-1.5">
          <div className="flex flex-col gap-0.5">
            <Bar label="HP" value={p.hp} max={s.maxHp} color="bg-hp" />
            <Bar label="MP" value={p.mp} max={s.maxMp} color="bg-mp" />
            <Bar label="EXP" value={p.level >= MAX_LEVEL ? need : p.exp} max={need} color="bg-exp" />
          </div>
          <p className="mt-1 text-[11px] text-gold">{formatNum(p.gold)} G</p>
          {p.gm && (
            <div className="mt-2 border-t border-gold/40 pt-2">
              <p className="mb-1 text-[10px] font-semibold text-gold">GM SKILLS</p>
              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => castGmSkill('invisible')} className="pixel-btn bg-gold/20 px-1 py-1 text-[9px] text-gold">ล่องหน</button>
                <button type="button" onClick={() => castGmSkill('summon')} className="pixel-btn bg-gold/20 px-1 py-1 text-[9px] text-gold">เสกของ</button>
                <button type="button" onClick={() => castGmSkill('immortal')} className="pixel-btn bg-gold/20 px-1 py-1 text-[9px] text-gold">อมตะ</button>
              </div>
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button type="button" onClick={() => openPanel('inventory')} className="pixel-btn bg-secondary px-2 py-1 text-[10px] text-foreground hover:bg-secondary/80">กระเป๋า</button>
            <button type="button" onClick={() => openPanel('gacha')} className="pixel-btn bg-primary/20 px-2 py-1 text-[10px] text-primary hover:bg-primary/30">เปิดตู้กาชา</button>
            <button type="button" onClick={() => openPanel('friends')} className="pixel-btn bg-accent/20 px-2 py-1 text-[10px] text-accent hover:bg-accent/30">สังคม</button>
          </div>
        </div>
      )}
    </div>
  )
}
