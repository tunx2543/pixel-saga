'use client'

import { GM_ITEMS } from '@/lib/game/data'
import { closePanel, summonGmItem } from '@/lib/game/engine'
import { PanelFrame, PxButton } from './panels'

export function GmSummonPanel() {
  return (
    <PanelFrame title="เสกของ GM" subtitle="ไอเทมทั้งหมดในเกม — ใช้ได้เฉพาะตัวละคร GM">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.values(GM_ITEMS).map((item) => (
          <PxButton key={item.id} variant="secondary" onClick={() => summonGmItem(item.id)} className="min-h-16 gap-2 text-left">
            {item.asset && <img src={item.asset} alt="" width={32} height={32} className="pixelated shrink-0 object-contain" />}
            <span className="min-w-0"><span className="block truncate">{item.name}</span><span className="block text-[10px] opacity-70">GM 888 · สงวนเฉพาะ GM</span></span>
          </PxButton>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><PxButton variant="secondary" onClick={closePanel}>ปิด</PxButton></div>
    </PanelFrame>
  )
}
