'use client'

import type { ReactNode } from 'react'
import { basicAttack, castSkill, currentJob, drinkPotion, game, interact, skillCooldown } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'

const SKILL_ICONS: Record<string, string> = {
  firebolt: '/images/skills/firebolt.png',
  meteor: '/images/skills/firebolt.png',
  bash: '/images/skills/whirl.png',
  whirl: '/images/skills/whirl.png',
  double: '/images/skills/rain.png',
  rain: '/images/skills/rain.png',
  dblatk: '/images/skills/shadow.png',
  backstab: '/images/skills/shadow.png',
  shadow: '/images/skills/shadow.png',
  holy: '/images/skills/whirl.png',
  sniper: '/images/skills/rain.png',
  blizzard: '/images/skills/firebolt.png',
  power: '/images/skills/whirl.png',
}

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

  const handlePointerMoveOrDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.type === 'pointermove' && e.buttons === 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    game.keys.clear()
    if (Math.hypot(dx, dy) < 24) return

    if (Math.abs(dx) >= Math.abs(dy)) game.keys.add(dx < 0 ? 'arrowleft' : 'arrowright')
    else game.keys.add(dy < 0 ? 'arrowup' : 'arrowdown')
  }

  const handlePointerUp = () => game.keys.clear()

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
                className={cn('relative size-12 rounded-full border-2 border-white/30 bg-card/90 p-1 text-[8px] leading-tight shadow-lg', g.p && g.p.mp < sk.mp && 'opacity-50')}
              >
                {SKILL_ICONS[sk.id] ? (
                  <img src={SKILL_ICONS[sk.id]} alt="" className="size-full rounded-full object-cover" />
                ) : (
                  <span style={{ color: sk.color }}>{sk.name}</span>
                )}
                <span className="sr-only">{sk.name}</span>
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
            label="โจมตีหรือคุยกับ NPC"
            onDown={() => {
              game.attackHeld = true
              if (!interact()) basicAttack()
            }}
            onUp={() => {
              game.attackHeld = false
            }}
            className="size-16 rounded-full border-4 border-primary-foreground/30 bg-primary text-xs font-bold text-primary-foreground shadow-[0_4px_0_rgba(0,0,0,0.35)]"
          >
            โจมตี
          </HoldButton>
        </div>
      </div>
    </div>
  )
}
