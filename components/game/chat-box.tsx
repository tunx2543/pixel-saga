'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(true) // เพิ่ม State สำหรับเปิด/ปิด (พับ) ช่องแชท
  const listRef = useRef<HTMLDivElement>(null)
  const lastId = g.chat.at(-1)?.id ?? 0

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastId, isOpen])

  return (
    <div className="pixel-panel absolute bottom-36 left-2 flex w-[min(20rem,calc(100vw-1rem))] flex-col bg-card/90 md:bottom-3 md:left-3 z-20 shadow-lg">
      
      {/* แถบหัวข้อแชท + ปุ่มกดพับ/ขยาย */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2.5 py-1 bg-secondary/70 border-b border-border text-[11px] font-semibold cursor-pointer select-none text-foreground"
      >
        <span>💬 แชท ({g.chat.length})</span>
        <button type="button" aria-label="พับหน้าต่างแชท" className="p-0.5 hover:opacity-80">
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>

      {/* ส่วนเนื้อหาแชทและฟอร์มพิมพ์ จะแสดงก็ต่อเมื่อ isOpen เป็น true */}
      {isOpen && (
        <>
          <div
            ref={listRef}
            className="h-20 overflow-y-auto px-2 py-1.5 text-xs leading-relaxed md:h-32"
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
            className="flex border-t border-border"
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
              placeholder="พิมพ์แชท..."
              className="min-w-0 flex-1 bg-transparent px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="px-2.5 py-1 text-xs text-primary hover:bg-secondary">
              ส่ง
            </button>
          </form>
        </>
      )}
    </div>
  )
}
