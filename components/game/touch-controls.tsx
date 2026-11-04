'use client'

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
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

function DirButton({ k, label, className, children }: { k: string; label: string; className?: string; children: ReactNode }) {
  return (
    <HoldButton
      label={label}
      onDown={() => game.keys.add(k)}
      onUp={() => game.keys.delete(k)}
      className={cn('size-12 bg-secondary/90', className)}
    >
      {children}
    </HoldButton>
  )
}

export function TouchControls() {
  const g = useGame()
  const job = currentJob()
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 md:hidden">
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-0.5">
        <div />
        <DirButton k="arrowup" label="เดินขึ้น">
          <ChevronUp className="size-6" aria-hidden />
        </DirButton>
        <div />
        <DirButton k="arrowleft" label="เดินซ้าย">
          <ChevronLeft className="size-6" aria-hidden />
        </DirButton>
        <div />
        <DirButton k="arrowright" label="เดินขวา">
          <ChevronRight className="size-6" aria-hidden />
        </DirButton>
        <div />
        <DirButton k="arrowdown" label="เดินลง">
          <ChevronDown className="size-6" aria-hidden />
        </DirButton>
        <div />
      </div>

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
  )
}
