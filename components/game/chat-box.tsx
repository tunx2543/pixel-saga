'use client'

import { useEffect, useRef, useState } from 'react'
import { game, submitChat, type ChatType } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { cn } from '@/lib/utils'

const TYPE_STYLE: Record<ChatType, string> = {
  system: 'text-accent',
  player: 'text-foreground',
  gm: 'text-gold',
  loot: 'text-[#7ae582]',
  error: 'text-destructive',
  npc: 'text-[#ffd6a5]',
}

const TYPE_TAG: Record<ChatType, string> = {
  system: '[ระบบ]',
  player: '',
  gm: '[GM]',
  loot: '[ไอเทม]',
  error: '[!]',
  npc: '[NPC]',
}

export function ChatBox() {
  const g = useGame()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const lastId = g.chat.at(-1)?.id ?? 0

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastId])

  return (
    <div className="pixel-panel absolute bottom-40 left-2 flex w-[min(22rem,calc(100vw-1rem))] flex-col bg-card/85 md:bottom-3 md:left-3">
      <div
        ref={listRef}
        className="h-24 overflow-y-auto px-2 py-1.5 text-xs leading-relaxed md:h-40"
        role="log"
        aria-live="polite"
        aria-label="ช่องแชท"
      >
        {g.chat.map((m) => (
          <p key={m.id} className={cn('break-words', TYPE_STYLE[m.type])}>
            {TYPE_TAG[m.type] && <span className="mr-1 opacity-80">{TYPE_TAG[m.type]}</span>}
            {m.author && <span className="mr-1 text-primary">{m.author}:</span>}
            {m.text}
          </p>
        ))}
      </div>
      <form
        className="flex border-t-2 border-border"
        onSubmit={(e) => {
          e.preventDefault()
          submitChat(text)
          setText('')
          ;(document.activeElement as HTMLElement | null)?.blur()
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          พิมพ์ข้อความแชท
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            game.keys.clear()
            game.attackHeld = false
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
            if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
          }}
          maxLength={140}
          autoComplete="off"
          placeholder="กด Enter เพื่อแชท • /help ดูคำสั่ง"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" className="px-3 text-xs text-primary hover:bg-secondary">
          ส่ง
        </button>
      </form>
    </div>
  )
}
