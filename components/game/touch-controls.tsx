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
        e.stopPropagation()
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onDown()
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        onUp?.()
      }}
      onPointerCancel={(e) => {
        e.stopPropagation()
        onUp?.()
      }}
      onLostPointerCapture={(e) => {
        e.stopPropagation()
        onUp?.()
      }}
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

  // ฟังก์ชันคำนวณการเดินเมื่อจิ้มหน้าจอ (เฉพาะพื้นที่ว่าง)
  const handlePointerMoveOrDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return
    if ((e.target as HTMLElement).closest('button')) {
      game.keys.clear()
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY

    game.keys.clear()

    if (Math.hypot(dx, dy) < 25) return

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) game.keys.add('arrowleft')
      else game.keys.add('arrowright')
    } else {
      if (dy < 0) game.keys.add('arrowup')
      else game.keys.add('arrowdown')
    }
  }

  const handlePointerUp = () => {
    game.keys.clear()
  }

  return (
    <div 
      className="pointer-events-none absolute inset-0 touch-none"
      onPointerDown={handlePointerMoveOrDown}
      onPointerMove={handlePointerMoveOrDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* จัดระเบียบ UI ด้านขวาให้กระชับ ไม่บังจอตอนเล่นแนวนอน */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-2 right-2 flex items-end justify-end gap-2 p-2">
        {/* ปุ่มยา HP / MP ขนาดเล็กด้านข้าง */}
        <div className="flex flex-col gap-1">
          <HoldButton label="ยา HP" onDown={() => drinkPotion('hp')} className="size-9 bg-hp/80 text-[9px]">
            HP
          </HoldButton>
          <HoldButton label="ยา MP" onDown={() => drinkPotion('mp')} className="size-9 bg-mp/80 text-[9px]">
            MP
          </HoldButton>
        </div>

        {/* แถวสกิลและปุ่มโจมตี */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            {job.skills.map((sk, i) => (
              <HoldButton
                key={sk.id}
                label={sk.name}
                onDown={() => castSkill(i)}
                className={cn('relative size-10 overflow-hidden bg-card/90 text-[8px] leading-tight', g.p && g.p.mp < sk.mp && 'opacity-50')}
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
            className="size-14 rounded-full bg-primary text-xs text-primary-foreground"
          >
            โจมตี
          </HoldButton>
        </div>
      </div>
    </div>
  )
}
