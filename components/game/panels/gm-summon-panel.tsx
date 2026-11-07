'use client'

import { ITEMS } from '@/lib/game/data'
import { closePanel, summonGmItem } from '@/lib/game/engine'
import { PanelFrame, PxButton } from './panels'

export function GmSummonPanel() {
  return (
    <PanelFrame title="เสกของ GM" subtitle="ไอเทมทั้งหมดในเกม — ใช้ได้เฉพาะตัวละคร GM">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.values(ITEMS).map((item) => (
          <PxButton key={item.id} variant={item.id === 'gm_golden_staff' ? 'accent' : 'secondary'} onClick={() => summonGmItem(item.id)} className="min-h-12 text-left">
            <span className="block truncate">{item.name}</span>
            <span className="block text-[10px] opacity-70">{item.kind === 'weapon' ? `ATK ${item.atk ?? 0}` : item.kind}</span>
          </PxButton>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><PxButton variant="secondary" onClick={closePanel}>ปิด</PxButton></div>
    </PanelFrame>
  )
}
