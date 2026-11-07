'use client'

import { rebirth, game } from '@/lib/game/engine'
import { PanelFrame, PxButton } from './panels'

export function RebirthPanel() {
  const level = game.p?.level ?? 1
  const count = game.p?.rebirthCount ?? 0
  return (
    <PanelFrame title="การจุติ" subtitle="เทวทูตแห่งการจุติ">
      <div className="mx-auto max-w-lg rounded-xl border border-yellow-400/40 bg-yellow-400/5 p-4 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-yellow-300/60 bg-yellow-300/10 text-xs font-bold tracking-widest text-yellow-300">REBIRTH</div>
        <h3 className="mt-3 text-xl font-bold text-yellow-300">เริ่มต้นใหม่ด้วยพลังเดิม</h3>
        <p className="mt-2 text-sm text-muted-foreground">ต้องมีเลเวล 70 จึงจะจุติได้ หลังจุติเลเวลจะกลับเป็น 1 แต่ค่าสเตตัสที่สะสมไว้ อุปกรณ์ และแต้มต่าง ๆ จะยังคงอยู่</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="rounded-lg border border-border bg-background/50 p-2">เลเวลปัจจุบัน <b className="float-right text-primary">{level}</b></div>
          <div className="rounded-lg border border-border bg-background/50 p-2">จุติแล้ว <b className="float-right text-yellow-300">{count}</b></div>
        </div>
        <PxButton className="mt-4 w-full" variant="accent" disabled={level < 70} onClick={() => rebirth()}>
          {level >= 70 ? 'จุติกลับเลเวล 1' : `ต้องการเลเวล 70 (ตอนนี้ ${level})`}
        </PxButton>
      </div>
    </PanelFrame>
  )
}
