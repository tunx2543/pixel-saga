export function formatPlayTime(sec: number) {
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`
}

export function formatNum(n: number) {
  return Math.floor(n).toLocaleString('en-US')
}
