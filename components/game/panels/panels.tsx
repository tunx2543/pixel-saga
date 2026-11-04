'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { closePanel } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { formatNum } from '../format'
import { CharacterPanel } from './character-panel'
import { EnhancePanel } from './enhance-panel'
import { GachaPanel } from './gacha-panel'
import { JobPanel } from './job-panel'
import { ShopPanel } from './shop-panel'
import { StoragePanel } from './storage-panel'

export function Panels() {
  const g = useGame()
  switch (g.panel) {
    case 'shop':
      return <ShopPanel />
    case 'enhance':
      return <EnhancePanel />
    case 'gacha':
      return <GachaPanel />
    case 'job':
      return <JobPanel />
    case 'storage':
      return <StoragePanel />
    case 'character':
      return <CharacterPanel />
    default:
      return null
  }
}

export function PanelFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const g = useGame()
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-2 md:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) closePanel()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pixel-panel flex max-h-full w-full max-w-3xl flex-col"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-border bg-secondary px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="truncate text-lg text-primary">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-gold">{formatNum(g.p?.gold ?? 0)} G</span>
            <button
              type="button"
              onClick={closePanel}
              className="pixel-btn bg-destructive/80 p-1 text-white hover:bg-destructive"
              aria-label="ปิดหน้าต่าง (Esc)"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">{children}</div>
      </section>
    </div>
  )
}

export function PxButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  className?: string
}) {
  const styles = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    danger: 'bg-destructive text-white',
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn px-3 py-1.5 text-xs hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
