'use client'

import { JOBS, type JobDef } from '@/lib/game/data'
import { availableJobs, changeJob, currentJob } from '@/lib/game/engine'
import { useGame } from '@/lib/game/use-game'
import { formatNum } from '../format'
import { PanelFrame, PxButton } from './panels'

const STAT_LABELS: [keyof JobDef, string][] = [
  ['hpMul', 'HP'],
  ['mpMul', 'MP'],
  ['atkMul', 'ATK'],
  ['defMul', 'DEF'],
  ['speedMul', 'SPD'],
]

function StatBars({ job }: { job: JobDef }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {STAT_LABELS.map(([k, label]) => {
        const v = job[k] as number
        return (
          <div key={k} className="text-center">
            <div className="flex h-10 items-end border-2 border-border bg-background">
              <div className="w-full bg-accent" style={{ height: `${Math.min(100, (v / 2.6) * 100)}%` }} />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
            <p className="text-[10px] text-foreground">x{v}</p>
          </div>
        )
      })}
    </div>
  )
}

function JobTree() {
  const roots = Object.values(JOBS).filter((j) => j.tier === 1)
  return (
    <div className="grid grid-cols-2 gap-1.5 text-[11px] md:grid-cols-4">
      {roots.map((j) => {
        const nextJobs = Object.values(JOBS).filter((nextJob) => nextJob.from === j.id && nextJob.id !== 'paladin')
        return (
          <div key={j.id} className="border-2 border-border bg-background p-1.5 text-center">
            <p className="text-foreground">{j.name}</p>
            <p className="text-muted-foreground">Lv.{j.reqLevel}</p>
            {nextJobs.length > 0 && <p className="text-primary">↓</p>}
            {nextJobs.map((nextJob) => (
              <div key={nextJob.id}>
                <p className="text-foreground">{nextJob.name}</p>
                <p className="text-muted-foreground">Lv.{nextJob.reqLevel}</p>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function JobPanel() {
  const g = useGame()
  const p = g.p!
  const job = currentJob()
  const options = availableJobs()

  return (
    <PanelFrame title="หอปรมาจารย์อาร์ค" subtitle="เปลี่ยนอาชีพเพื่อปลดล็อกสกิลและพลังใหม่">
      <div className="mb-4 flex flex-col gap-2 border-2 border-border bg-muted p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">อาชีพปัจจุบัน</p>
          <p className="text-lg text-primary">
            {job.name} <span className="text-sm text-foreground">Lv.{p.level}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">สกิล: {job.skills.map((s) => s.name).join(', ')}</p>
      </div>

      {options.length === 0 ? (
        <p className="py-6 text-center text-sm text-gold">คุณถึงอาชีพขั้นสูงสุดแล้ว! ยอดเยี่ยมมาก นักผจญภัย</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {options.map((j) => {
            const levelOk = p.level >= j.reqLevel
            const goldOk = p.gold >= j.cost
            return (
              <li key={j.id} className="flex flex-col gap-2.5 border-2 border-border bg-muted p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base text-foreground">{j.name}</p>
                    <p className="text-[11px] text-muted-foreground">{j.description}</p>
                  </div>
                  <span className="shrink-0 border-2 border-border px-1.5 text-[10px] text-accent">
                    {j.ranged ? 'ระยะไกล' : 'ระยะประชิด'}
                  </span>
                </div>
                <StatBars job={j} />
                <div>
                  <p className="text-[11px] text-muted-foreground">สกิล</p>
                  <ul className="mt-0.5 flex flex-wrap gap-1">
                    {j.skills.map((s) => (
                      <li key={s.id} className="border border-border bg-background px-1.5 py-0.5 text-[10px]" style={{ color: s.color }}>
                        {s.name} ({s.mp}MP)
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={levelOk ? 'text-accent' : 'text-destructive'}>ต้องการ Lv.{j.reqLevel}</span>
                  <span className={goldOk ? 'text-gold' : 'text-destructive'}>{j.cost ? `${formatNum(j.cost)} G` : 'ฟรี'}</span>
                </div>
                <PxButton onClick={() => changeJob(j.id)} disabled={!levelOk || !goldOk} className="py-2 text-sm">
                  เปลี่ยนเป็น {j.name}
                </PxButton>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-xs text-muted-foreground">เส้นทางอาชีพ (เริ่มจาก ผู้ฝึกหัด)</p>
        <JobTree />
      </div>
    </PanelFrame>
  )
}
