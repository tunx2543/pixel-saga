'use client'

import { useEffect, useRef } from 'react'
import {
  action,
  closePanel,
  game,
  interact,
  notify,
  openPanel,
  saveGame,
  update,
  drinkPotion,
  castSkill,
} from '@/lib/game/engine'
import { render } from '@/lib/game/renderer'

const MOVE_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'])

export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const font = getComputedStyle(document.body).fontFamily
    let dpr = 1
    let raf = 0
    let last = performance.now()
    let uiAcc = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(r.width * dpr))
      canvas.height = Math.max(1, Math.floor(r.height * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      try {
        update(dt)
        render(ctx, canvas.width, canvas.height, dpr, font)
      } catch (error) {
        console.error('[v0] Game frame error:', error)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = 1
      }
      uiAcc += dt
      if (uiAcc > 0.1) {
        uiAcc = 0
        notify()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const isTyping = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      const k = e.key.toLowerCase()
      if (k === 'enter') {
        e.preventDefault()
        document.getElementById('chat-input')?.focus()
        return
      }
      if (k === 'escape') return closePanel()
      if (MOVE_KEYS.has(k)) {
        game.keys.add(k)
        e.preventDefault()
        return
      }
      if (e.repeat) return
      if (k === ' ' || k === 'j' || k === 'e') {
        e.preventDefault()
        action()
      } else if (k === '1' || k === '2' || k === '3') castSkill(Number(k) - 1)
      else if (k === 'q') drinkPotion('hp')
      else if (k === 'r') drinkPotion('mp')
      else if (k === 'i' || k === 'c') openPanel('character')
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      game.keys.delete(k)
      if (k === ' ' || k === 'j') game.attackHeld = false
    }
    const onBlur = () => {
      game.keys.clear()
      game.attackHeld = false
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveGame()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    window.addEventListener('beforeunload', saveGame)
    document.addEventListener('visibilitychange', onHide)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('beforeunload', saveGame)
      document.removeEventListener('visibilitychange', onHide)
      saveGame()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="pixelated absolute inset-0 h-full w-full touch-none"
      aria-label="หน้าจอเกม ใช้ WASD หรือปุ่มลูกศรเพื่อเดิน"
    />
  )
}
