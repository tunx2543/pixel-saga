'use client'

import type { ReactNode } from 'react'
import { basicAttack, castSkill, currentJob, drinkPotion, game, skillCooldown } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'

function HoldButton({
  onDown,
  onUp,
  className,
  label,
  children,
}: {
  onDown: () => void
  onUp?: () => void
  className?: string
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onDown()
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onContextMenu={(e) => e.preventDefault()}
      className={cn('pixel-btn flex touch-none items-center justify-center text-foreground', className)}
    >
      {children}
    </button>
  )
}

export function TouchControls() {
  const g = useGame()
  const job = currentJob()

  // ฟังก์ชันคำนวณทิศทางจากการจิ้มหน้าจอ แล้วจำลองการกดปุ่มทิศทาง (Keys)
  const handlePointerMoveOrDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // ถ้านิ้วไม่ได้กดลงมา (แค่ลากผ่านเฉยๆ โดยไม่ได้แตะ) หรือจิ้มโดนปุ่ม UI ให้ข้าม
    if (e.buttons === 0) return
    if ((e.target as HTMLElement).closest('button')) {
      game.keys.clear()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    // คำนวณพิกัดเทียบกับกึ่งกลางจอ หรือตำแหน่งตัวละครโดยประมาณ
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY

    // เคลียร์ปุ่มเก่าก่อน
    game.keys.clear()

    // ถ้าจุดที่จิ้มอยู่ใกล้จุดศูนย์กลางมาก ให้ปล่อยตัวยืนนิ่ง
    if (Math.hypot(dx, dy) < 20) return

    // ตรวจสอบว่าเอียงไปทางแนวตั้งหรือแนวนอนมากกว่ากัน
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) game.keys.add('arrowleft')
      else game.keys.add('arrowright')
    } else {
      if (dy < 0) game.keys.add('arrowup')
      else game.keys.add('arrowdown')
    }
  }

  const handlePointerUp = () => {
    // ปล่อยมือแล้วให้หยุดเดิน (เคลียร์ปุ่มทั้งหมด)
    game.keys.clear()
  }

  return (
    <div 
      className="pointer-events-auto absolute inset-0 touch-none"
      onPointerDown={handlePointerMoveOrDown}
      onPointerMove={handlePointerMoveOrDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ส่วนควบคุมด้านขวา (ยา, สกิล และปุ่มโจมตี) ยังคงใช้งานปกติ */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end p-3 md:hidden">
        <div className="pointer-events-auto flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <HoldButton label="ยา HP" onDown={() => drinkPotion('hp')} className="size-11 bg-hp/80 text-[10px]">
              HP
            </HoldButton>
            <HoldButton label="ยา MP" onDown={() => drinkPotion('mp')} className="size-11 bg-mp/80 text-[10px]">
              MP
            </HoldButton>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-1.5">
              {job.skills.map((sk, i) => (
                <HoldButton
                  key={sk.id}
                  label={sk.name}
                  onDown={() => castSkill(i)}
                  className={cn('relative size-12 overflow-hidden bg-card/90 text-[9px] leading-tight', g.p && g.p.mp < sk.mp && 'opacity-50')}
                >
                  <span style={{ color: sk.color }}>{sk.name}</span>
                  {skillCooldown(sk) > 0 && (
                    <span
                      className="absolute inset-x-0 bottom-0 bg-black/60"
                      style={{ height: `${(skillCooldown(sk) / sk.cooldown) * 100}%` }}
                      aria-hidden
                    />
                  )}
                </HoldButton>
              ))}
            </div>
            <HoldButton
              label="โจมตี"
              onDown={() => {
                game.attackHeld = true
                basicAttack()
              }}
              onUp={() => {
                game.attackHeld = false
              }}
              className="size-16 rounded-full bg-primary text-sm text-primary-foreground"
            >
              โจมตี
            </HoldButton>
          </div>
        </div>
      </div>
    </div>
  )
}

