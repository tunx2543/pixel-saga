'use client'

import { useState } from 'react'
import { Backpack, ChevronDown, ChevronUp, LogOut, Save } from 'lucide-react'
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

  // สถานะเปิด/ปิด (พับ) ของป้ายโปรไฟล์
  const [isOpenProfile, setIsOpenProfile] = useState(true)

  return (
    <>
      {/* ป้ายโปรไฟล์มุมซ้ายบน พร้อมระบบพับหน้าต่าง */}
      <div className="pixel-panel absolute
      
