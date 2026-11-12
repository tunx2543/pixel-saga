'use client'

import { useState } from 'react'
import { STORAGE_SIZE, deposit, getInventoryCapacity, moveGold, withdraw } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { formatNum } from '../format'
import { ItemSlot } from '../item-icon'
import { PanelFrame, PxButton } from './panels'

export function StoragePanel() {
  const g = useGame()
  const p = g.p!
  const [amount, setAmount] = useState('')

  return (
    <PanelFrame title="คลังเก็บของพี่มณี" subtitle="คลิกไอเทมเพื่อย้ายระหว่างกระเป๋าและคลัง (ของในคลังถูกบันทึกถาวร)">
      <div className="mb-4 flex flex-col gap-2 border-2 border-border bg-muted p-3 md:flex-row md:items-center">
        <div className="flex-1 text-xs">
          <p className="text-muted-foreground">
            เงินในตัว: <span className="text-gold">{formatNum(p.gold)} G</span>
          </p>
          <p className="text-muted-foreground">
            เงินในคลัง: <span className="text-gold">{formatNum(p.storageGold)} G</span>
          </p>
        </div>
        <label htmlFor="gold-amount" className="sr-only">
          จำนวนเงิน
        </label>
        <input
          id="gold-amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          placeholder="จำนวนเงิน"
          className="w-full border-2 border-border bg-input px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary md:w-32"
        />
        <div className="flex gap-1.5">
          <PxButton onClick={() => moveGold(Number(amount || p.gold), true)}>ฝาก{amount ? '' : 'ทั้งหมด'}</PxButton>
          <PxButton variant="accent" onClick={() => moveGold(Number(amount || p.storageGold), false)}>
            ถอน{amount ? '' : 'ทั้งหมด'}
          </PxButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            กระเป๋า ({p.inventory.length}/{getInventoryCapacity(p)}) — คลิกเพื่อฝาก
          </p>
          <div className="grid grid-cols-8 gap-1">
            {p.inventory.map((it) => (
              <ItemSlot key={it.uid} item={it} onClick={() => deposit(it.uid)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            คลัง ({p.storage.length}/{STORAGE_SIZE}) — คลิกเพื่อถอน
          </p>
          {p.storage.length === 0 ? (
            <p className="border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">คลังว่างเปล่า</p>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {p.storage.map((it) => (
                <ItemSlot key={it.uid} item={it} onClick={() => withdraw(it.uid)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  )
}
