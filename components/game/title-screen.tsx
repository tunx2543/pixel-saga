'use client'

import { useState } from 'react'
import { JOBS } from '@/lib/game/data'
import { deleteSave, loadGame, newGame, readSave } from '@/lib/game/engine'
import { MAPS } from '@/lib/game/maps'
import { formatPlayTime } from './format'
import { AccountPanel } from './account-panel'

export function TitleScreen() {
  const [save] = useState(() => readSave())
  const [mode, setMode] = useState<'menu' | 'new'>(save ? 'menu' : 'new')
  const [name, setName] = useState('')

  const start = () => {
    if (save) deleteSave()
    newGame(name)
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-4">
      <img
        src="/images/title-bg.png"
        alt=""
        className="pixelated absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/55" />

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-bold tracking-wider text-primary drop-shadow-[4px_4px_0_#1a1423] md:text-6xl">
            PIXEL QUEST
          </p>
          <p className="mt-2 text-lg text-foreground drop-shadow-[2px_2px_0_#1a1423]">ตำนานนักผจญภัยพิกเซล</p>
        </div>

        <div className="pixel-panel w-full p-5">
          {mode === 'menu' && save ? (
            <div className="flex flex-col gap-4">
              <div className="border-2 border-border bg-muted p-3">
                <p className="text-xs text-muted-foreground">ความคืบหน้าที่บันทึกไว้</p>
                <p className="mt-1 text-lg text-primary">{save.name}</p>
                <p className="text-sm text-foreground">
                  Lv.{save.level} {JOBS[save.jobId]?.name ?? 'ผู้ฝึกหัด'} • {MAPS[save.mapId]?.name ?? 'เมือง'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  เวลาเล่น {formatPlayTime(save.playTime)} • บันทึกล่าสุด{' '}
                  {new Date(save.savedAt).toLocaleString('th-TH')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadGame(save)}
                className="pixel-btn bg-primary px-4 py-3 text-lg text-primary-foreground hover:brightness-110"
              >
                เล่นต่อ
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className="pixel-btn bg-secondary px-4 py-2 text-secondary-foreground hover:brightness-110"
              >
                เริ่มเกมใหม่
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                start()
              }}
            >
              <label htmlFor="hero-name" className="text-sm text-muted-foreground">
                ตั้งชื่อตัวละครของคุณ
              </label>
              <input
                id="hero-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                placeholder="นักผจญภัย"
                autoFocus
                className="border-2 border-border bg-input px-3 py-2 text-foreground outline-none focus:border-primary"
              />
              {save && (
                <p className="border-2 border-destructive/60 bg-destructive/10 p-2 text-xs text-destructive">
                  การเริ่มเกมใหม่จะลบความคืบหน้าของ {save.name} (Lv.{save.level})
                </p>
              )}
              <button
                type="submit"
                className="pixel-btn bg-primary px-4 py-3 text-lg text-primary-foreground hover:brightness-110"
              >
                เริ่มผจญภัย
              </button>
              {save && (
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  ย้อนกลับ
                </button>
              )}
            </form>
          )}
        </div>

        <AccountPanel />

        <p className="text-center text-xs text-foreground/80 drop-shadow-[1px_1px_0_#1a1423]">
          เล่นแบบผู้มาเยือนได้ทันที ข้อมูลจะถูกแยกตามเครื่อง • เข้าสู่ระบบเพื่อซิงค์ตัวละครและพบผู้เล่นอื่น
        </p>
      </div>
    </div>
  )
}
