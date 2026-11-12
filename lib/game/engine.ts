import {
  GM_ITEMS,
  ITEMS,
  JOBS,
  MAX_LEVEL,
  MAX_PLUS,
  MONSTERS,
  enhanceCost,
  enhanceRate,
  expToNext,
  type ItemDef,
  type JobDef,
  type SkillDef,
  type EquipmentSlot,
} from './data'
import { MAPS, MAP_ORDER, TILE, boxBlocked, isSolidPx, type MapDef, type NpcDef, type NpcRole } from './maps'
import { GEM_SHOP_ITEMS } from './gem-shop'
import type { Dir } from './sprites'
import { createClient } from '@/lib/supabase/client'
import { createBan, createTrade, publishAnnouncement, sendFriendRequest, sendWhisper } from './social'

export const SAVE_KEY = 'pixel-rpg-save-v1'
const GM_UNLOCK = '/openmodgm24156'
export const INV_SIZE = 40
export const STORAGE_SIZE = 60

export interface InvItem {
  uid: string
  itemId: string
  qty: number
  plus: number
}

export interface SaveData {
  version: 1
  name: string
  jobId: string
  level: number
  exp: number
  hp: number
  mp: number
  gold: number
  diamonds: number
  ownedGemItems: string[]
  equippedGemFashion: string | null
  equippedGemCompanion: string | null
  lootMagnetUntil: number
  inventoryCapacityBonus: number
  inventory: InvItem[]
  storage: InvItem[]
  storageGold: number
  equipment: Record<EquipmentSlot, InvItem | null>
  mapId: string
  x: number
  y: number
  gm: boolean
  uid?: number
  god: boolean
  invisible?: boolean
  speed: number
  playTime: number
  kills: number
  savedAt: number
  statPoints?: number
  skillPoints?: number
  skillLevels?: Record<string, number>
  rebirthCount?: number
  rebirthBonus?: { maxHp: number; maxMp: number; atk: number; def: number }
}

export interface RemotePlayer {
  userId: string
  uid: number
  displayName: string
  classId: string
  jobId: string
  mapId: string
  x: number
  y: number
  level: number
  gm: boolean
  facing: Dir
  moving: boolean
  attackAnim: number
  lastSeen: number
}

export interface Monster {
  uid: string
  defId: string
  x: number
  y: number
  homeX: number
  homeY: number
  hp: number
  maxHp: number
  dead: boolean
  respawnAt: number
  provoked: boolean
  attackCd: number
  hitFlash: number
  lunge: number
  vx: number
  vy: number
  wanderT: number
  flip: boolean
  animT: number
}

export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  max: number
  size: number
}

export interface GroundDrop {
  uid: string
  itemId: string
  qty: number
  x: number
  y: number
  ownerId: string
  expiresAt: number
}

export interface Effect {
  type: 'slash' | 'ring' | 'burst' | 'levelup' | 'spark'
  x: number
  y: number
  r: number
  color: string
  life: number
  max: number
  angle?: number
}

interface Projectile {
  x: number
  y: number
  targetUid: string
  speed: number
  color: string
  size: number
  mults: number[]
  aoe: number
  delay: number
}

export type PanelId = 'shop' | 'gem-shop' | 'enhance' | 'job' | 'storage' | 'character' | 'gacha' | 'rebirth' | 'friends' | 'trade' | 'inventory' | 'gm-summon'
export type ChatType = 'system' | 'player' | 'gm' | 'loot' | 'error' | 'npc'
export interface ChatMsg {
  id: number
  type: ChatType
  text: string
  author?: string
}

export const game = {
  p: null as SaveData | null,
  monsters: [] as Monster[],
  groundDrops: [] as GroundDrop[],
  remotePlayers: [] as RemotePlayer[],
  floats: [] as FloatText[],
  autoFarm: false,
  autoSkills: false,
  autoSkillIndex: 0,
  effects: [] as Effect[],
  projectiles: [] as Projectile[],
  chat: [] as ChatMsg[],
  panel: null as PanelId | null,
  socialMenuOpen: false,
  keys: new Set<string>(),
  attackHeld: false,
  facing: 'down' as Dir,
  moving: false,
  walkT: 0,
  attackCd: 0,
  attackAnim: 0,
  skillCd: {} as Record<string, number>,
  bubble: null as null | { text: string; until: number },
  announcement: null as null | { body: string; authorId: string; until: number },
  lootToast: null as null | { itemId: string; until: number },
  socialTargetId: null as string | null,
  tradeTargetId: null as string | null,
  tradeId: null as number | null,
  nearNpc: null as NpcDef | null,
  time: 0,
  regenT: 0,
  saveT: 0,
  persist: false,
  combatT: 99,
  lastSavedAt: 0,
  lastWarnAt: 0,
  version: 0,
}

/* ---------------- store ---------------- */

const listeners = new Set<() => void>()
export function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export function getVersion() {
  return game.version
}
export function notify() {
  game.version++
  listeners.forEach((l) => l())
}

/* ---------------- helpers ---------------- */

const uid = () => Math.random().toString(36).slice(2, 10)
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))

export function player() {
  return game.p!
}
export function currentMap(): MapDef {
  return MAPS[game.p?.mapId ?? 'town'] ?? MAPS.town
}
export function currentJob(): JobDef {
  return JOBS[game.p?.jobId ?? 'novice'] ?? JOBS.novice
}

export function itemPower(it: InvItem | null) {
  if (!it) return 0
  const def = ITEMS[it.itemId]
  const base = def.atk ?? def.def ?? 0
  return Math.floor(base * (1 + it.plus * 0.12) + it.plus * 2)
}

export function getStats(p: SaveData = game.p!) {
  const job = JOBS[p.jobId] ?? JOBS.novice
  const L = p.level
  const wAtk = itemPower(p.equipment.weapon)
  const aDef = (['armor', 'shoes', 'cloak', 'accessory'] as const).reduce((total, slot) => total + itemPower(p.equipment[slot]), 0)
  return {
    maxHp: Math.floor((80 + L * 22) * job.hpMul + aDef * 2) + (p.rebirthBonus?.maxHp ?? 0),
    maxMp: Math.floor((30 + L * 7) * job.mpMul) + (p.rebirthBonus?.maxMp ?? 0),
    atk: Math.floor((8 + L * 2.6 + wAtk) * job.atkMul) + (p.rebirthBonus?.atk ?? 0),
    def: Math.floor((3 + L * 1.4) * job.defMul + aDef) + (p.rebirthBonus?.def ?? 0),
    speed: 72 * job.speedMul * (p.speed || 1) * (p.equippedGemCompanion === 'aurora_cloud_dragon' ? 1.2 : 1),
    crit: job.crit,
    attackSpeed: job.attackSpeed,
  }
}

let chatId = 0
export function say(type: ChatType, text: string, author?: string) {
  game.chat.push({ id: ++chatId, type, text, author })
  if (game.chat.length > 150) game.chat.splice(0, game.chat.length - 150)
}

function addFloat(x: number, y: number, text: string, color: string, size = 10) {
  game.floats.push({ x: x + rand(-4, 4), y, text, color, life: 1, max: 1, size })
}

function addEffect(e: Omit<Effect, 'life'>) {
  game.effects.push({ ...e, life: e.max })
}

/* ---------------- inventory ---------------- */

function stackable(def: ItemDef) {
  return def.kind === 'consumable' || def.kind === 'material'
}

export function getInventoryCapacity(p: SaveData) {
  const bonus = Math.max(0, Math.min(60, Math.floor((p.inventoryCapacityBonus ?? 0) / 20) * 20))
  return INV_SIZE + bonus
}

export function addItem(itemId: string, qty = 1, plus = 0, list?: InvItem[], cap?: number): boolean {
  const p = player()
  const target = list ?? p.inventory
  const maxSlots = cap ?? (target === p.inventory ? getInventoryCapacity(p) : INV_SIZE)
  const def = ITEMS[itemId]
  if (!def || qty <= 0) return false
  if (stackable(def)) {
    const s = target.find((i) => i.itemId === itemId)
    if (s) {
      s.qty += qty
      return true
    }
    if (target.length >= maxSlots) return false
    target.push({ uid: uid(), itemId, qty, plus: 0 })
    return true
  }
  for (let i = 0; i < qty; i++) {
    if (target.length >= maxSlots) return false
    target.push({ uid: uid(), itemId, qty: 1, plus })
  }
  return true
}

export function countItem(itemId: string) {
  return player()
    .inventory.filter((i) => i.itemId === itemId)
    .reduce((s, i) => s + i.qty, 0)
}

function removeItemId(itemId: string, qty: number) {
  const inv = player().inventory
  let left = qty
  for (let i = inv.length - 1; i >= 0 && left > 0; i--) {
    if (inv[i].itemId !== itemId) continue
    const take = Math.min(left, inv[i].qty)
    inv[i].qty -= take
    left -= take
    if (inv[i].qty <= 0) inv.splice(i, 1)
  }
  return left === 0
}

function removeUid(list: InvItem[], id: string, qty: number) {
  const idx = list.findIndex((i) => i.uid === id)
  if (idx < 0) return null
  const it = list[idx]
  const take = Math.min(qty, it.qty)
  it.qty -= take
  if (it.qty <= 0) list.splice(idx, 1)
  return { ...it, qty: take }
}

function clampVitals() {
  const p = player()
  const s = getStats()
  p.hp = Math.min(p.hp, s.maxHp)
  p.mp = Math.min(p.mp, s.maxMp)
}

export function canEquip(it: InvItem): string | null {
  const def = ITEMS[it.itemId]
  const p = player()
  if (def.kind !== 'weapon' && def.kind !== 'armor') return 'ไอเทมนี้สวมใส่ไม่ได้'
  if ((def.reqLevel ?? 1) > p.level) return `ต้องการเลเวล ${def.reqLevel}`
  if (def.kind === 'weapon' && !currentJob().weaponTypes.includes(def.weaponType!)) return `อาชีพ ${currentJob().name} ใช้อาวุธนี้ไม่ได้`
  if (def.allowedJobs?.length && !def.allowedJobs.includes(currentJob().id)) return `อาชีพ ${currentJob().name} สวมใส่ไอเทมนี้ไม่ได้`
  return null
}

export function equip(id: string) {
  const p = player()
  const it = p.inventory.find((i) => i.uid === id)
  if (!it) return
  const err = canEquip(it)
  if (err) {
    say('error', err)
    notify()
    return
  }
  const slot: EquipmentSlot = ITEMS[it.itemId].slot ?? (ITEMS[it.itemId].kind === 'weapon' ? 'weapon' : 'armor')
  p.inventory = p.inventory.filter((i) => i.uid !== id)
  const prev = p.equipment[slot]
  if (prev) p.inventory.push(prev)
  p.equipment[slot] = it
  clampVitals()
  say('system', `สวมใส่ ${itemLabel(it)}`)
  notify()
}

export function unequip(slot: EquipmentSlot) {
  const p = player()
  const it = p.equipment[slot]
  if (!it) return
  if (p.inventory.length >= getInventoryCapacity(p)) {
    say('error', 'กระเป๋าเต็ม')
    notify()
    return
  }
  p.inventory.push(it)
  p.equipment[slot] = null
  clampVitals()
  notify()
}

export function itemLabel(it: InvItem) {
  const def = ITEMS[it.itemId]
  return `${def?.name ?? it.itemId}${it.plus > 0 ? ` +${it.plus}` : ''}`
}

export function consumeItem(id: string) {
  const p = player()
  const it = p.inventory.find((i) => i.uid === id)
  if (!it) return
  const def = ITEMS[it.itemId]
  if (def.kind === 'weapon' || def.kind === 'armor') return equip(id)
  if (def.kind !== 'consumable') return

  if (def.id === 'starlight_loot_magnet') {
    p.lootMagnetUntil = Math.max(Date.now(), p.lootMagnetUntil ?? 0) + 5 * 60 * 1000
    removeUid(p.inventory, id, 1)
    say('system', 'แม่เหล็กแสงดาวทำงาน 5 นาที — เก็บดรอปของคุณในระยะ 120 px')
    saveGame()
    notify()
    return
  }

  if (def.id === 'astral_bag_expansion') {
    if (p.inventoryCapacityBonus >= 60) {
      say('error', 'กระเป๋าเพิ่มช่องถึงขีดจำกัด +60 แล้ว')
      return notify()
    }
    removeUid(p.inventory, id, 1)
    p.inventoryCapacityBonus = Math.min(60, p.inventoryCapacityBonus + 20)
    say('system', `กระเป๋าเพิ่มเป็น ${getInventoryCapacity(p)} ช่องถาวร`)
    saveGame()
    notify()
    return
  }

  const s = getStats()
  if (def.heal) {
    p.hp = Math.min(s.maxHp, p.hp + def.heal)
    addFloat(p.x, p.y - 22, `+${def.heal}`, '#7ae582')
  }
  if (def.mana) {
    p.mp = Math.min(s.maxMp, p.mp + def.mana)
    addFloat(p.x, p.y - 22, `+${def.mana}`, '#4cc9f0')
  }
  removeUid(p.inventory, id, 1)
  if (def.id === 'return_scroll' || def.id === 'town_warp_tome') {
    const town = MAPS.town
    changeMap('town', town.spawn.x, town.spawn.y)
  }
  saveGame()
  notify()
}

export function drinkPotion(kind: 'hp' | 'mp') {
  const p = player()
  const s = getStats()
  const missing = kind === 'hp' ? s.maxHp - p.hp : s.maxMp - p.mp
  const potions = p.inventory
    .filter((i) => (kind === 'hp' ? ITEMS[i.itemId].heal : ITEMS[i.itemId].mana))
    .sort((a, b) => {
      const va = kind === 'hp' ? ITEMS[a.itemId].heal! : ITEMS[a.itemId].mana!
      const vb = kind === 'hp' ? ITEMS[b.itemId].heal! : ITEMS[b.itemId].mana!
      return va - vb
    })
  if (!potions.length) {
    warn(kind === 'hp' ? 'ไม่มียาฟื้นฟู HP' : 'ไม่มียาฟื้นฟู MP')
    return
  }
  if (missing <= 0) return
  const pick =
    potions.find((i) => (kind === 'hp' ? ITEMS[i.itemId].heal! : ITEMS[i.itemId].mana!) >= missing) ??
    potions[potions.length - 1]
  consumeItem(pick.uid)
}

export function potionCount(kind: 'hp' | 'mp') {
  return player()
    .inventory.filter((i) => (kind === 'hp' ? ITEMS[i.itemId].heal : ITEMS[i.itemId].mana))
    .reduce((s, i) => s + i.qty, 0)
}

function warn(text: string) {
  if (game.time - game.lastWarnAt < 1) return
  game.lastWarnAt = game.time
  say('error', text)
}

/* ---------------- maps ---------------- */

function randomSpawnPoint(map: MapDef) {
  for (let t = 0; t < 300; t++) {
    const tx = randInt(3, map.width - 4)
    const ty = randInt(3, map.height - 4)
    const x = (tx + 0.5) * TILE
    const y = (ty + 0.7) * TILE
    if (boxBlocked(map, x, y, 6, 6)) continue
    const nearPortal = map.portals.some((pt) => Math.hypot(pt.x + pt.w / 2 - tx, pt.y + pt.h / 2 - ty) < 8)
    if (nearPortal) continue
    return { x, y }
  }
  return { x: map.width * 8, y: map.height * 8 }
}

function makeMonster(defId: string, x: number, y: number): Monster {
  const def = MONSTERS[defId]
  return {
    uid: uid(),
    defId,
    x,
    y,
    homeX: x,
    homeY: y,
    hp: def.hp,
    maxHp: def.hp,
    dead: false,
    respawnAt: 0,
    provoked: false,
    attackCd: 0,
    hitFlash: 0,
    lunge: 0,
    vx: 0,
    vy: 0,
    wanderT: rand(0, 2),
    flip: false,
    animT: rand(0, 2),
  }
}

function populateMap() {
  const map = currentMap()
  game.monsters = []
  for (const s of map.spawns)
    for (let i = 0; i < s.count; i++) {
      const pt = randomSpawnPoint(map)
      game.monsters.push(makeMonster(s.monsterId, pt.x, pt.y))
    }
}

export function changeMap(mapId: string, tx: number, ty: number) {
  const p = player()
  const map = MAPS[mapId]
  if (!map) return
  p.mapId = mapId
  p.x = (tx + 0.5) * TILE
  p.y = (ty + 0.5) * TILE
  game.projectiles = []
  game.effects = []
  game.floats = []
  game.panel = null
  populateMap()
  say('system', `เข้าสู่ ${map.name} (${map.levelLabel})`)
  saveGame()
  notify()
}

/* ---------------- combat ---------------- */

const dmgFormula = (atk: number, def: number) => (atk * atk) / (atk + def)

function nearestMonster(range: number, fromX = player().x, fromY = player().y - 8) {
  let best: Monster | null = null
  let bd = Infinity
  for (const m of game.monsters) {
    if (m.dead) continue
    const d = Math.hypot(m.x - fromX, m.y - 6 - fromY)
    if (d <= range && d < bd) {
      bd = d
      best = m
    }
  }
  return best
}

function faceToward(x: number, y: number) {
  const p = player()
  const dx = x - p.x
  const dy = y - p.y
  game.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'
}

  function damageMonster(m: Monster, mult: number) {
  if (m.dead) return
  const p = player()
  const s = getStats()
  const def = MONSTERS[m.defId]
  if (!def) return
  const gmStaff = p.equipment.weapon?.itemId === 'gm_golden_staff' && p.gm
  let dmg = gmStaff ? 9999999 : dmgFormula(s.atk * mult, def.def) * rand(0.9, 1.1)
  const crit = !gmStaff && Math.random() < s.crit
  if (crit) dmg *= 1.6
  const amount = Math.max(1, Math.round(dmg))
  m.hp -= amount
  m.provoked = true
  m.hitFlash = 0.15
  game.combatT = 0
  addFloat(m.x, m.y - 20, crit ? `${amount}!` : `${amount}`, crit ? '#ffd60a' : '#ffffff', crit ? 20 : 16)
  if (m.hp <= 0) killMonster(m)
}

function dropItem(itemId: string, qty: number, x: number, y: number) {
  const p = player()
  game.groundDrops.push({ uid: uid(), itemId, qty, x: x + rand(-5, 5), y: y + rand(-3, 3), ownerId: String(p.uid ?? p.name), expiresAt: game.time + 60 })
}

function collectGroundDrops() {
  const p = player()
  const ownerId = String(p.uid ?? p.name)
  for (let i = game.groundDrops.length - 1; i >= 0; i--) {
    const drop = game.groundDrops[i]
    if (drop.expiresAt <= game.time) {
      game.groundDrops.splice(i, 1)
      continue
    }
    const petRange = p.equippedGemCompanion === 'moonlight_firefly' ? 34 : p.equippedGemCompanion === 'gem_raccoon' ? 52 : p.equippedGemCompanion === 'aurora_cloud_dragon' ? 68 : 22
    const magnetRange = p.lootMagnetUntil > Date.now() ? 120 : 22
    if (drop.ownerId !== ownerId || Math.hypot(drop.x - p.x, drop.y - p.y) > Math.max(petRange, magnetRange)) continue
    if (!addItem(drop.itemId, drop.qty)) {
      warn('กระเป๋าเต็ม! เก็บไอเทมไม่ได้')
      continue
    }
    game.groundDrops.splice(i, 1)
    game.lootToast = { itemId: drop.itemId, until: game.time + 3 }
    say('loot', `เก็บ ${ITEMS[drop.itemId].name} x${drop.qty}`)
  }
}

function killMonster(m: Monster) {
  const p = player()
  const def = MONSTERS[m.defId]
  m.dead = true
  m.hp = 0
  m.respawnAt = game.time + (def.boss ? 90 : 10)
  p.kills++
  addEffect({ type: 'burst', x: m.x, y: m.y - 6, r: def.boss ? 30 : 14, color: def.color, max: 0.4 })
  const gold = randInt(def.gold[0], def.gold[1])
  p.gold += gold
  addFloat(m.x, m.y - 30, `+${gold}G`, '#f2c94c', 9)
  gainExp(def.exp)

  const equipmentPool = [...new Map(
    Object.values(ITEMS)
      .filter((item) => (item.kind === 'weapon' || item.kind === 'armor') && !item.gmOnly)
      .map((item) => [item.id, item]),
  ).values()]
  const dynamicDrops = def.boss
    ? equipmentPool.map((item) => ({ itemId: item.id, chance: 0.001 }))
    : []
  const junkDrops = def.drops.filter((drop) => {
    const item = ITEMS[drop.itemId]
    return !item || (item.kind !== 'weapon' && item.kind !== 'armor')
  })
  const seen = new Set<string>()
  for (const d of [...junkDrops, ...dynamicDrops]) {
    if (seen.has(d.itemId)) continue
    seen.add(d.itemId)
    if (Math.random() < d.chance) {
      dropItem(d.itemId, 1, m.x, m.y)
      say('loot', `${ITEMS[d.itemId].name} ตกพื้น`)
      notify()
    }
  }
  if (def.boss) say('system', `★ ${p.name} ได้ปราบ ${def.name} สำเร็จ! ★`)
}

export function gainExp(n: number) {
  const p = player()
  if (p.level >= MAX_LEVEL) return
  p.exp += n
  addFloat(p.x, p.y - 34, `+${n} EXP`, '#c77dff', 9)
  const beforeStats = getStats()
  let leveled = false
  while (p.level < MAX_LEVEL && p.exp >= expToNext(p.level)) {
    p.exp -= expToNext(p.level)
    p.level++
    leveled = true
  }
  if (p.level >= MAX_LEVEL) p.exp = 0
  if (leveled) onLevelUp(beforeStats)
}

function onLevelUp(beforeStats: ReturnType<typeof getStats>) {
  const p = player()
  const s = getStats()
  p.hp = s.maxHp
  p.mp = s.maxMp
  p.statPoints = (p.statPoints ?? 0) + 3
  p.skillPoints = (p.skillPoints ?? 0) + 1
  p.skillLevels ??= {}
  const autoSkill = currentJob().skills[(p.level - 1) % currentJob().skills.length]
  if (autoSkill) {
    p.skillLevels[autoSkill.id] = (p.skillLevels[autoSkill.id] ?? 1) + 1
    say('system', `${autoSkill.name} อัปเป็น Lv.${p.skillLevels[autoSkill.id]} อัตโนมัติ`)
  }
  addEffect({ type: 'levelup', x: p.x, y: p.y, r: 20, color: '#ffd60a', max: 1.2 })
  addFloat(p.x, p.y - 40, 'LEVEL UP!', '#ffd60a', 14)
  say('system', `ยินดีด้วย! เลเวลอัพเป็น Lv.${p.level}`)
  say('system', `ค่าสถานะเพิ่ม: HP +${s.maxHp - beforeStats.maxHp}, MP +${s.maxMp - beforeStats.maxMp}, ATK +${s.atk - beforeStats.atk}, DEF +${s.def - beforeStats.def}`)
  const next = Object.values(JOBS).find((j) => j.from === p.jobId && j.reqLevel === p.level)
  if (next) say('system', `คุณสามารถเปลี่ยนอาชีพได้แล้ว! ไปหา ปรมาจารย์อาร์ค ที่เมือง`)
  saveGame()
}

function projectileColor(job: JobDef) {
  if (job.weaponTypes.includes('staff')) return '#ff9f1c'
  return '#f1faee'
}

function shoot(t: Monster, mults: number[], color: string, size: number, aoe = 0, delay = 0) {
  const p = player()
  game.projectiles.push({ x: p.x, y: p.y - 10, targetUid: t.uid, speed: 240, color, size, mults, aoe, delay })
}

export function basicAttack() {
  const p = game.p
  if (!p || game.attackCd > 0 || game.panel) return
  const job = currentJob()
  const t = nearestMonster(job.range + 6)
  game.attackCd = job.attackSpeed
  game.attackAnim = 0.18
  if (!t) return
  faceToward(t.x, t.y)
  if (job.ranged) shoot(t, [1], projectileColor(job), 2)
  else {
    damageMonster(t, 1)
    addEffect({ type: 'slash', x: t.x, y: t.y - 8, r: 10, color: '#ffffff', max: 0.18, angle: Math.random() * Math.PI })
  }
}

export function skillCooldown(skill: SkillDef) {
  return Math.max(0, game.skillCd[skill.id] ?? 0)
}

export function castSkill(index: number) {
  const p = game.p
  if (!p || game.panel) return
  const job = currentJob()
  const skill = job.skills[index]
  if (!skill) return
  const skillLevel = p.skillLevels?.[skill.id] ?? 1
  const skillMult = skill.mult * (1 + (skillLevel - 1) * 0.08)
  if (skillCooldown(skill) > 0) return
  if (p.mp < skill.mp) {
    warn('MP ไม่พอ!')
    return
  }
  const range = job.ranged ? job.range + 12 : skill.kind === 'aoe-target' ? 90 : job.range + 12
  if (skill.kind === 'aoe-self') {
    const r = skill.radius ?? 40
    addEffect({ type: 'ring', x: p.x, y: p.y - 6, r, color: skill.color, max: 0.45 })
    for (const m of game.monsters) if (!m.dead && Math.hypot(m.x - p.x, m.y - p.y) <= r) damageMonster(m, skillMult)
  } else {
    const t = nearestMonster(range)
    if (!t) {
      warn('ไม่มีเป้าหมายในระยะ')
      return
    }
    faceToward(t.x, t.y)
    if (skill.kind === 'single') {
      if (job.ranged) shoot(t, [skillMult], skill.color, 4)
      else {
        damageMonster(t, skillMult)
        addEffect({ type: 'slash', x: t.x, y: t.y - 8, r: 16, color: skill.color, max: 0.3, angle: Math.random() * Math.PI })
      }
    } else if (skill.kind === 'multi') {
      const hits = skill.hits ?? 2
      if (job.ranged) for (let i = 0; i < hits; i++) shoot(t, [skillMult], skill.color, 2, 0, i * 0.1)
      else
        for (let i = 0; i < hits; i++) {
          damageMonster(t, skillMult)
          addEffect({ type: 'slash', x: t.x + i * 3, y: t.y - 8 - i * 3, r: 12, color: skill.color, max: 0.25, angle: i })
        }
    } else if (skill.kind === 'aoe-target') {
      const r = skill.radius ?? 48
      addEffect({ type: 'burst', x: t.x, y: t.y - 6, r, color: skill.color, max: 0.55 })
      for (const m of game.monsters) if (!m.dead && Math.hypot(m.x - t.x, m.y - t.y) <= r) damageMonster(m, skillMult)
    }
  }
  p.mp -= skill.mp
  game.skillCd[skill.id] = skill.cooldown
  game.attackAnim = 0.22
  addFloat(p.x, p.y - 30, skill.name, skill.color, 9)
}

function hurtPlayer(rawAtk: number) {
  const p = player()
  game.combatT = 0
  if (p.god) {
    addFloat(p.x, p.y - 22, 'GOD', '#ffd60a', 9)
    return
  }
  const s = getStats()
  const dmg = Math.max(1, Math.round(dmgFormula(rawAtk * 1.5, s.def) * rand(0.85, 1.15)))
  p.hp -= dmg
  addFloat(p.x, p.y - 22, `-${dmg}`, '#ff4d4d', 10)
  if (p.hp <= 0) die()
}

function die() {
  const p = player()
  const lost = p.level >= MAX_LEVEL ? 0 : Math.floor(expToNext(p.level) * 0.05)
  p.exp = Math.max(0, p.exp - lost)
  const s = getStats()
  p.hp = s.maxHp
  p.mp = s.maxMp
  say('error', `คุณถูกสังหาร! เสีย EXP ${lost} และถูกส่งกลับเมือง`)
  const town = MAPS.town
  changeMap('town', town.spawn.x, town.spawn.y)
}

/* ---------------- NPC systems ---------------- */

const ROLE_PANEL: Record<NpcRole, PanelId> = { shop: 'shop', enhance: 'enhance', job: 'job', storage: 'storage', gacha: 'gacha', rebirth: 'rebirth' }

export function interact() {
  const npc = game.nearNpc
  if (!npc || !game.p) return false
  game.keys.clear()
  game.panel = ROLE_PANEL[npc.role]
  say('npc', npc.greeting, npc.name)
  notify()
  return true
}

export function rebirth() {
  const p = player()
  if (p.level < MAX_LEVEL) {
    say('error', `ต้องมีเลเวล ${MAX_LEVEL} จึงจะจุติได้`)
    notify()
    return false
  }
  if ((p.rebirthCount ?? 0) >= 6) {
    say('error', 'จุติครบสูงสุด 6 ครั้งแล้ว')
    notify()
    return false
  }
  const before = getStats(p)
  const baseHp = 80 + 22 + itemPower(p.equipment.armor) * 2
  const baseMp = 30 + 7
  const baseAtk = Math.floor(8 + 2.6 + itemPower(p.equipment.weapon))
  const baseDef = Math.floor(3 + 1.4 + itemPower(p.equipment.armor))
  p.rebirthBonus = {
    maxHp: Math.max(0, before.maxHp - baseHp),
    maxMp: Math.max(0, before.maxMp - baseMp),
    atk: Math.max(0, before.atk - baseAtk),
    def: Math.max(0, before.def - baseDef),
  }
  p.rebirthCount = (p.rebirthCount ?? 0) + 1
  p.jobId = 'novice'
  p.level = 1
  p.exp = 0
  p.hp = baseHp + p.rebirthBonus.maxHp
  p.mp = baseMp + p.rebirthBonus.maxMp
  const spawn = MAPS.town.spawn
  changeMap('town', spawn.x, spawn.y)
  game.effects.push({ type: 'levelup', x: p.x, y: p.y, r: 36, color: '#ffd60a', life: 3, max: 3 })
  addFloat(p.x, p.y - 42, `REBIRTH ${p.rebirthCount}`, '#ffd60a', 15)
  say('system', 'จุติสำเร็จ! กลับไปเลเวล 1 และคงค่าสเตตัสเดิมไว้')
  saveGame()
  game.panel = null
  notify()
  return true
}

export function action() {
  if (!interact()) basicAttack()
}

export function castGmSkill(skill: 'invisible' | 'summon' | 'immortal') {
  const p = player()
  if (!p.gm) return
  if (skill === 'invisible') {
    p.invisible = !p.invisible
    say('gm', `ล่องหน: ${p.invisible ? 'เปิด' : 'ปิด'}`)
  } else if (skill === 'immortal') {
    p.god = !p.god
    if (p.god) { p.hp = getStats().maxHp; p.mp = getStats().maxMp }
    say('gm', `อมตะ: ${p.god ? 'เปิด' : 'ปิด'}`)
  } else {
    openPanel('gm-summon')
  }
  saveGame()
  notify()
}

export function summonGmItem(itemId: string) {
  const p = player()
  if (!p.gm || !GM_ITEMS[itemId]) return
  if (addItem(itemId, 1)) say('gm', `เสก ${GM_ITEMS[itemId].name} สำเร็จ`)
  else say('error', 'กระเป๋าเต็ม')
  saveGame()
  notify()
}

export function openPanel(id: PanelId) {
  if (id === 'gm-summon' && !game.p?.gm) return
  game.panel = id
  notify()
}

export function closePanel() {
  if (!game.panel) return
  game.panel = null
  saveGame()
  notify()
}

export function buyItem(itemId: string, qty: number) {
  const p = player()
  const def = ITEMS[itemId]
  const cost = def.price * qty
  if (p.gold < cost) {
    say('error', 'เงินไม่พอ')
    return notify()
  }
  const free = getInventoryCapacity(p) - p.inventory.length
  if (!stackable(def) && free < qty) {
    say('error', 'กระเป๋าเต็ม')
    return notify()
  }
  if (!addItem(itemId, qty)) {
    say('error', 'กระเป๋าเต็ม')
    return notify()
  }
  p.gold -= cost
  say('loot', `ซื้อ ${def.name} x${qty} (-${cost.toLocaleString()}G)`)
  notify()
}

export function buyGemShopItem(itemId: string) {
  const p = player()
  const shopItem = GEM_SHOP_ITEMS.find((item) => item.id === itemId)
  if (!shopItem) return

  if (shopItem.category !== 'utility' && p.ownedGemItems.includes(itemId)) {
    say('error', 'คุณมีไอเทมชิ้นนี้แล้ว')
    return notify()
  }
  if (shopItem.id === 'astral_bag_expansion' && p.inventoryCapacityBonus >= 60) {
    say('error', 'กระเป๋าเพิ่มช่องถึงขีดจำกัด +60 แล้ว')
    return notify()
  }
  if (p.diamonds < shopItem.price) {
    say('error', 'เพชรไม่พอ')
    return notify()
  }
  if (shopItem.category === 'utility') {
    if (!shopItem.inventoryItemId || !addItem(shopItem.inventoryItemId)) {
      say('error', 'กระเป๋าเต็ม')
      return notify()
    }
  } else {
    p.ownedGemItems.push(itemId)
  }

  p.diamonds -= shopItem.price
  say('loot', `ซื้อ ${shopItem.name} สำเร็จ (-${shopItem.price.toLocaleString()} เพชร)`)
  saveGame()
  notify()
}

export function equipGemShopItem(itemId: string) {
  const p = player()
  const shopItem = GEM_SHOP_ITEMS.find((item) => item.id === itemId)
  if (!shopItem || shopItem.category === 'utility' || !p.ownedGemItems.includes(itemId)) return

  if (shopItem.category === 'fashion') {
    p.equippedGemFashion = p.equippedGemFashion === itemId ? null : itemId
  } else {
    p.equippedGemCompanion = p.equippedGemCompanion === itemId ? null : itemId
  }
  const equipped = p.equippedGemFashion === itemId || p.equippedGemCompanion === itemId
  say('system', equipped ? `สวมใส่ ${shopItem.name} แล้ว` : `ถอด ${shopItem.name} แล้ว`)
  saveGame()
  notify()
}

export function sellPrice(it: InvItem) {
  return Math.floor(ITEMS[it.itemId].price * 0.4 * (1 + it.plus * 0.3))
}

export function sellItem(id: string, qty: number) {
  const p = player()
  const it = p.inventory.find((i) => i.uid === id)
  if (!it) return
  const price = sellPrice(it)
  const removed = removeUid(p.inventory, id, qty)
  if (!removed) return
  const total = price * removed.qty
  p.gold += total
  say('loot', `ขาย ${itemLabel(removed)} x${removed.qty} (+${total.toLocaleString()}G)`)
  notify()
}

export function findEquipment(id: string): InvItem | null {
  const p = player()
  if (p.equipment.weapon?.uid === id) return p.equipment.weapon
  if (p.equipment.armor?.uid === id) return p.equipment.armor
  return p.inventory.find((i) => i.uid === id) ?? null
}

export type EnhanceResult = { result: 'success' | 'fail' | 'down' | 'error'; message: string }

export function enhance(id: string): EnhanceResult {
  const p = player()
  const it = findEquipment(id)
  if (!it) return { result: 'error', message: 'ไม่พบไอเทม' }
  const def = ITEMS[it.itemId]
  if (def.kind !== 'weapon' && def.kind !== 'armor') return { result: 'error', message: 'ตีบวกได้เฉพาะอาวุธและชุดเกราะ' }
  if (it.plus >= MAX_PLUS) return { result: 'error', message: `ตีบวกสูงสุดแล้ว (+${MAX_PLUS})` }
  const cost = enhanceCost(it.plus, def.tier ?? 1)
  if (p.gold < cost.gold) return { result: 'error', message: 'เงินไม่พอ' }
  if (countItem('enhance_stone') < cost.stones) return { result: 'error', message: `หินตีบวกไม่พอ (ต้องการ ${cost.stones})` }
  p.gold -= cost.gold
  removeItemId('enhance_stone', cost.stones)
  const rate = enhanceRate(it.plus)
  let res: EnhanceResult
  if (Math.random() < rate) {
    it.plus++
    res = { result: 'success', message: `ตีบวกสำเร็จ! ${def.name} +${it.plus}` }
    say('system', res.message)
    if (it.plus >= 7) say('gm', `ประกาศ: ${p.name} ตีบวก ${def.name} ได้ +${it.plus}!`)
  } else if (it.plus >= 6) {
    it.plus--
    res = { result: 'down', message: `ตีบวกล้มเหลว! ระดับลดลงเป็น +${it.plus}` }
    say('error', res.message)
  } else {
    res = { result: 'fail', message: 'ตีบวกล้มเหลว! ระดับคงเดิม' }
    say('error', res.message)
  }
  clampVitals()
  saveGame()
  notify()
  return res
}

export function availableJobs() {
  const p = player()
  return Object.values(JOBS).filter((j) => j.from === p.jobId)
}

export function changeJob(jobId: string) {
  const p = player()
  const job = JOBS[jobId]
  if (!job || job.from !== p.jobId) return say('error', 'ไม่สามารถเปลี่ยนเป็นอาชีพนี้ได้'), notify()
  if (p.level < job.reqLevel) return say('error', `ต้องการเลเวล ${job.reqLevel}`), notify()
  if (p.gold < job.cost) return say('error', 'เงินไม่พอ'), notify()
  p.gold -= job.cost
  applyJob(jobId)
  say('system', `เปลี่ยนอาชีพเป็น ${job.name} สำเร็จ!`)
  saveGame()
  notify()
}

function applyJob(jobId: string) {
  const p = player()
  p.jobId = jobId
  const w = p.equipment.weapon
  if (w && !currentJob().weaponTypes.includes(ITEMS[w.itemId].weaponType!)) {
    p.inventory.push(w)
    p.equipment.weapon = null
    say('system', `ถอด ${itemLabel(w)} เพราะอาชีพใหม่ใช้ไม่ได้`)
  }
  game.skillCd = {}
  const s = getStats()
  p.hp = s.maxHp
  p.mp = s.maxMp
  addEffect({ type: 'levelup', x: p.x, y: p.y, r: 22, color: '#c77dff', max: 1.4 })
}

export function deposit(id: string) {
  const p = player()
  const it = p.inventory.find((i) => i.uid === id)
  if (!it) return
  const def = ITEMS[it.itemId]
  const canStack = stackable(def) && p.storage.some((s) => s.itemId === it.itemId)
  if (!canStack && p.storage.length >= STORAGE_SIZE) return say('error', 'คลังเต็ม'), notify()
  p.inventory = p.inventory.filter((i) => i.uid !== id)
  if (canStack) p.storage.find((s) => s.itemId === it.itemId)!.qty += it.qty
  else p.storage.push(it)
  notify()
}

export function withdraw(id: string) {
  const p = player()
  const it = p.storage.find((i) => i.uid === id)
  if (!it) return
  const def = ITEMS[it.itemId]
  const canStack = stackable(def) && p.inventory.some((s) => s.itemId === it.itemId)
  if (!canStack && p.inventory.length >= getInventoryCapacity(p)) return say('error', 'กระเป๋าเต็ม'), notify()
  p.storage = p.storage.filter((i) => i.uid !== id)
  if (canStack) p.inventory.find((s) => s.itemId === it.itemId)!.qty += it.qty
  else p.inventory.push(it)
  notify()
}

export function moveGold(amount: number, toStorage: boolean) {
  const p = player()
  const n = Math.floor(amount)
  if (!Number.isFinite(n) || n <= 0) return
  if (toStorage) {
    const take = Math.min(n, p.gold)
    p.gold -= take
    p.storageGold += take
  } else {
    const take = Math.min(n, p.storageGold)
    p.storageGold -= take
    p.gold += take
  }
  notify()
}

/* ---------------- chat & commands ---------------- */

export function submitChat(raw: string) {
  const p = game.p
  if (!p) return
  const text = raw.trim().slice(0, 140)
  if (!text) return
  if (text.startsWith('/')) runCommand(text)
  else {
    say('player', text, p.name)
    game.bubble = { text, until: game.time + 4 }
  }
  notify()
}

const PUBLIC_HELP = ['/help - ดูคำสั่ง', '/save - บันทึกเกม', '/pos - ดูตำแหน่ง', '/friend <UID> - เพิ่มเพื่อน', '/trade <UID> - ขอแลกเปลี่ยน', '/whisper <UID> <ข้อความ> - กระซิบ', '/clear - ล้างแชท']

const GM_HELP = [
  '/level <เลข> - ตั้งเลเวล',
  '/exp <เลข> - เพิ่ม EXP',
  '/gold <เลข> - เพิ่มเงิน',
  '/gem <จำนวน 1-1,000,000> - เสกเพชร (GM เท่านั้น)',
  '/เสกเพชร <จำนวน 1-1,000,000> - คำสั่งภาษาไทย (GM เท่านั้น)',
  '/item <ไอดี> [จำนวน] [บวก] - เสกไอเทม',
  '/allweapons - เสกอาวุธทั้งหมดที่อาชีพนี้ใช้ได้',
  '/items - รายการไอดีไอเทม',
  '/stone <เลข> - เสกหินตีบวก',
  '/tp <แมพ> - วาร์ป (town, meadow, forest, cave, volcano)',
  '/heal - ฟื้นฟู HP/MP เต็ม',
  '/god - เปิด/ปิดอมตะ',
  '/speed <0.5-5> - ความเร็ว',
  '/killall - ฆ่ามอนในแมพ',
  '/spawn <ไอดี> [จำนวน] - เรียกมอนสเตอร์',
  '/mobs - รายการไอดีมอนสเตอร์',
  '/job <ไอดี> - เปลี่ยนอาชีพทันที',
  '/jobs - รายการไอดีอาชีพ',
  '/ban (UID)_(วินาที)_(เหตุผล) - แบนผู้เล่น เช่น /ban 00001_3600_ใช้บอท',
  '/gmchat <ข้อความ> - ประกาศแถบด้านบน',
  '/closegm - ปิดโหมด GM',
]

function runCommand(text: string) {
  const p = player()
  const [cmdRaw, ...args] = text.split(/\s+/)
  const cmd = cmdRaw.toLowerCase()
  const num = (i: number, d = 0) => {
    const n = Number(args[i])
    return Number.isFinite(n) ? n : d
  }

  if (cmd === GM_UNLOCK) {
    if (p.uid !== 0) {
      say('error', 'คำสั่งนี้ใช้ได้เฉพาะ UID 00000')
      return
    }
    p.gm = true
    say('gm', 'โหมด GM เปิดอยู่แล้วสำหรับบัญชีหลัก')
    saveGame()
    notify()
    return
  }
  switch (cmd) {
    case '/help':
      PUBLIC_HELP.forEach((l) => say('system', l))
      if (p.gm) say('gm', 'พิมพ์ /gm เพื่อดูคำสั่ง GM')
      return
    case '/save':
      saveGame()
      say('system', 'บันทึกเกมเรียบร้อย')
      return
    case '/pos':
      say('system', `${currentMap().name} X:${Math.floor(p.x / TILE)} Y:${Math.floor(p.y / TILE)}`)
      return
    case '/clear':
      game.chat = []
      return
    case '/friend': {
      const target = args[0]
      if (!target) return say('error', 'ใช้ /friend <UID>')
      void sendFriendRequest(target).then((result) => { say(result.ok ? 'system' : 'error', result.message); notify() })
      return
    }
    case '/trade': {
      const target = args[0]
      if (!target) return say('error', 'ใช้ /trade <UID>')
      void createTrade(target).then((result) => { say(result.ok ? 'system' : 'error', result.message); notify() })
      return
    }
    case '/whisper': {
      const target = args[0]
      const body = args.slice(1).join(' ')
      if (!target || !body) return say('error', 'ใช้ /whisper <UID> <ข้อความ>')
      void sendWhisper(target, body).then((result) => { say(result.ok ? 'system' : 'error', result.message); notify() })
      return
    }
  }

  const grantGems = () => {
    const amount = Number(args[0])
    const maxGrant = 1_000_000
    const maxBalance = 1_000_000_000
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > maxGrant) {
      return say('error', 'ใช้ /gem <จำนวนเต็ม 1-1,000,000>')
    }
    const currentBalance = Number.isSafeInteger(p.diamonds) ? Math.max(0, p.diamonds) : 0
    if (currentBalance + amount > maxBalance) {
      return say('error', `ยอดเพชรสูงสุดคือ ${maxBalance.toLocaleString()} เพชร`)
    }
    p.diamonds = currentBalance + amount
    say('gm', `เสกเพชรสำเร็จ +${amount.toLocaleString()} | ยอดรวม ${p.diamonds.toLocaleString()} เพชร`)
  }

  const gmCommands: Record<string, () => void> = {
    '/gm': () => GM_HELP.forEach((l) => say('gm', l)),
    '/gem': grantGems,
    '/เสกเพชร': grantGems,
    '/level': () => {
      const lv = Math.max(1, Math.min(MAX_LEVEL, Math.floor(num(0, p.level))))
      p.level = lv
      p.exp = 0
      onLevelUp(getStats())
      say('gm', `ตั้งเลเวลเป็น ${lv}`)
    },
    '/exp': () => {
      gainExp(Math.max(0, Math.floor(num(0))))
      say('gm', `เพิ่ม EXP ${Math.floor(num(0))}`)
    },
    '/gold': () => {
      p.gold = Math.max(0, p.gold + Math.floor(num(0)))
      say('gm', `เงินปัจจุบัน ${p.gold.toLocaleString()}G`)
    },
  '/item': () => {
  const id = args[0]
  if (!id || !ITEMS[id]) return say('error', 'ไม่พบไอดีไอเทม พิมพ์ /items เพื่อดูรายการ')
  const qty = Math.max(1, Math.min(999, Math.floor(num(1, 1))))
  const plus = Math.max(0, Math.min(MAX_PLUS, Math.floor(num(2, 0))))
  if (addItem(id, qty, plus)) say('gm', `เสก ${ITEMS[id].name}${plus ? ` +${plus}` : ''} x${qty}`)
  else say('error', 'กระเป๋าเต็ม')
  },
  '/allweapons': () => {
  const allowed = new Set(currentJob().weaponTypes)
  const weapons = Object.values(ITEMS).filter((item) => item.kind === 'weapon' && item.weaponType && allowed.has(item.weaponType))
  let added = 0
  for (const item of weapons) {
    if (addItem(item.id, 1)) added++
    else if (addItem(item.id, 1, 0, p.storage, STORAGE_SIZE)) added++
  }
  say('gm', `เสกอาวุธสำหรับอาชีพ ${currentJob().name} แล้ว ${added}/${weapons.length} ชิ้น (ในกระเป๋า/คลัง)`)
  saveGame()
  },
  '/items': () => {
  const ids = Object.keys(ITEMS)
  for (let i = 0; i < ids.length; i += 8) say('gm', ids.slice(i, i + 8).join(', '))
    },
    '/stone': () => {
      const n = Math.max(1, Math.min(999, Math.floor(num(0, 10))))
      addItem('enhance_stone', n)
      say('gm', `เสกหินตีบวก x${n}`)
    },
    '/tp': () => {
      const id = args[0]
      const map = id ? MAPS[id] : null
      if (!map) return say('error', `แมพที่มี: ${MAP_ORDER.join(', ')}`)
      changeMap(map.id, map.spawn.x, map.spawn.y)
    },
    '/heal': () => {
      const s = getStats()
      p.hp = s.maxHp
      p.mp = s.maxMp
      say('gm', 'ฟื้นฟูเต็ม')
    },
    '/god': () => {
      p.god = !p.god
      say('gm', `โหมดอมตะ: ${p.god ? 'เปิด' : 'ปิด'}`)
    },
    '/speed': () => {
      p.speed = Math.max(0.5, Math.min(5, num(0, 1)))
      say('gm', `ความเร็ว x${p.speed}`)
    },
    '/killall': () => {
      let n = 0
      for (const m of game.monsters)
        if (!m.dead) {
          killMonster(m)
          n++
        }
      say('gm', `กำจัดมอนสเตอร์ ${n} ตัว`)
    },
    '/spawn': () => {
      const id = args[0]
      if (!id || !MONSTERS[id]) return say('error', 'ไม่พบไอดีมอนสเตอร์ พิมพ์ /mobs เพื่อดูรายการ')
      const n = Math.max(1, Math.min(20, Math.floor(num(1, 1))))
      const map = currentMap()
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2)
        let x = p.x + Math.cos(a) * 40
        let y = p.y + Math.sin(a) * 40
        if (boxBlocked(map, x, y, 6, 6)) {
          x = p.x
          y = p.y
        }
        const m = makeMonster(id, x, y)
        m.respawnAt = Infinity
        game.monsters.push(m)
      }
      say('gm', `เรียก ${MONSTERS[id].name} x${n}`)
    },
    '/mobs': () => {
      const ids = Object.keys(MONSTERS)
      for (let i = 0; i < ids.length; i += 7) say('gm', ids.slice(i, i + 7).join(', '))
    },
    '/job': () => {
      const id = args[0]
      if (!id || !JOBS[id]) return say('error', `อาชีพที่มี: ${Object.keys(JOBS).join(', ')}`)
      applyJob(id)
      say('gm', `เปลี่ยนอาชีพเป็น ${JOBS[id].name}`)
    },
    '/jobs': () => say('gm', Object.keys(JOBS).join(', ')),
    '/ban': () => {
      const input = args.join(' ').trim()
      const parts = input.split('_').map((part) => part.trim())
      const target = parts[0]
      const duration = parts[1]?.toLowerCase() === 'permanent' || parts[1] === 'ถาวร' ? null : Number(parts[1])
      const reason = parts.slice(2).join('_').trim() || 'ไม่ระบุเหตุผล'
      if (!target || (duration !== null && (!Number.isInteger(duration) || duration <= 0))) return say('error', 'ใช้ /ban (UID)_(วินาที)_(เหตุผล) เช่น /ban 00001_3600_ใช้บอท')
      void createBan(target, duration, reason).then((result) => { say(result.ok ? 'gm' : 'error', result.message); notify() })
    },
    '/gmchat': () => {
      const body = args.join(' ').trim()
      if (!body) return say('error', 'ใช้ /gmchat <ข้อความ>')
      void publishAnnouncement(body).then((result) => { say(result.ok ? 'gm' : 'error', result.message); notify() })
    },
    '/closegm': () => {
      p.gm = false
      p.god = false
      p.speed = 1
      say('system', 'ปิดโหมด GM แล้ว')
    },
  }

  const fn = gmCommands[cmd]
  if (!fn) return say('error', `ไม่รู้จักคำสั่ง ${cmd} พิมพ์ /help`)
  if (!p.gm) return say('error', 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้')
  fn()
  saveGame()
}

/* ---------------- save / load ---------------- */

export function saveGame() {
  const p = game.p
  if (!p || !game.persist || typeof window === 'undefined') return
  p.savedAt = Date.now()
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(p))
    game.lastSavedAt = Date.now()
    void saveCloudGame(p)
  } catch {
    say('error', 'บันทึกเกมไม่สำเร็จ')
  }
  game.saveT = 0
}

async function saveCloudGame(p: SaveData) {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    await supabase.from('game_players').upsert({
      user_id: data.user.id,
      display_name: p.name,
      class_id: p.jobId,
      save_data: p,
      x: p.x,
      y: p.y,
      level: p.level,
      last_seen: new Date().toISOString(),
    })
  } catch {
    // Guest saves remain available locally when cloud sync is unavailable.
  }
}

export async function loadCloudGame() {
  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null
    const { data } = await supabase
      .from('game_players')
      .select('save_data')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    return data?.save_data && typeof data.save_data === 'object' ? (data.save_data as SaveData) : null
  } catch {
    return null
  }
}

export function readSave(): SaveData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as SaveData
    if (!d || d.version !== 1 || typeof d.name !== 'string') return null
    return d
  } catch {
    return null
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY)
}

function sanitizeList(list: unknown): InvItem[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((i): i is InvItem => !!i && typeof i.itemId === 'string' && !!ITEMS[i.itemId])
    .map((i) => ({ uid: i.uid || uid(), itemId: i.itemId, qty: Math.max(1, Math.floor(i.qty || 1)), plus: Math.max(0, Math.min(MAX_PLUS, Math.floor(i.plus || 0))) }))
}

function resetRuntime() {
  game.monsters = []
  game.groundDrops = []
  game.floats = []
  game.effects = []
  game.projectiles = []
  game.chat = []
  game.panel = null
  game.keys.clear()
  game.attackHeld = false
  game.skillCd = {}
  game.bubble = null
  game.time = 0
  game.saveT = 0
  game.combatT = 99
}

function startSession(p: SaveData, welcome: string, persist = false) {
  resetRuntime()
  game.persist = persist
  game.p = p
  const map = currentMap()
  if (boxBlocked(map, p.x, p.y)) {
    p.x = (map.spawn.x + 0.5) * TILE
    p.y = (map.spawn.y + 0.5) * TILE
  }
  populateMap()
  clampVitals()
  say('system', welcome)
  say('system', 'WASD/ลูกศร เดิน • Space โจมตี • 1-3 สกิล • Q/R ยา • E คุยกับ NPC • I ตัวละคร • Enter แชท')
  saveGame()
  notify()
}

export function loadGame(d: SaveData) {
  const inventory = sanitizeList(d.inventory)
  const sanitizeEquipment = (slot: EquipmentSlot, fallback: InvItem | null = null) => {
    const item = d.equipment?.[slot] ?? (slot === 'armor' ? fallback : null)
    const candidate = sanitizeList(item ? [item] : [])[0] ?? null
    if (!candidate) return null

    const def = ITEMS[candidate.itemId]
    const compatible = slot === 'weapon'
      ? def.kind === 'weapon'
      : def.kind === 'armor' && (def.slot ?? 'armor') === slot
    if (compatible) return candidate

    if (!inventory.some((entry) => entry.uid === candidate.uid)) inventory.push(candidate)
    return null
  }
  const legacyArmor = d.equipment?.armor ? sanitizeList([d.equipment.armor])[0] ?? null : null
  const weapon = sanitizeEquipment('weapon')
  const armor = sanitizeEquipment('armor', legacyArmor)
  const shoes = sanitizeEquipment('shoes')
  const cloak = sanitizeEquipment('cloak')
  const accessory = sanitizeEquipment('accessory')
  const p: SaveData = {
    version: 1,
    name: d.name.slice(0, 16) || 'นักผจญภัย',
    jobId: d.gm && JOBS[d.jobId] ? d.jobId : (JOBS[d.jobId] && d.jobId !== 'gm' ? d.jobId : 'novice'),
    level: Math.max(1, Math.min(MAX_LEVEL, Math.floor(d.level || 1))),
    exp: Math.max(0, d.exp || 0),
    hp: d.hp || 1,
    mp: d.mp || 0,
    gold: Math.max(0, Math.floor(d.gold || 0)),
    diamonds: Math.max(0, Math.floor(d.diamonds || 0)),
    ownedGemItems: Array.isArray(d.ownedGemItems)
      ? [...new Set(d.ownedGemItems.filter((id): id is string => typeof id === 'string' && GEM_SHOP_ITEMS.some((item) => item.id === id && item.category !== 'utility')))]
      : [],
    equippedGemFashion: GEM_SHOP_ITEMS.some((item) => item.id === d.equippedGemFashion && item.category === 'fashion' && d.ownedGemItems?.includes(item.id)) ? d.equippedGemFashion : null,
    equippedGemCompanion: GEM_SHOP_ITEMS.some((item) => item.id === d.equippedGemCompanion && item.category === 'companions' && d.ownedGemItems?.includes(item.id)) ? d.equippedGemCompanion : null,
    lootMagnetUntil: Number.isFinite(d.lootMagnetUntil) ? Math.max(0, d.lootMagnetUntil) : 0,
    inventoryCapacityBonus: Math.max(0, Math.min(60, Math.floor((d.inventoryCapacityBonus || 0) / 20) * 20)),
    inventory,
    storage: sanitizeList(d.storage),
    storageGold: Math.max(0, Math.floor(d.storageGold || 0)),
    equipment: { weapon, armor, shoes, cloak, accessory },
    mapId: MAPS[d.mapId] ? d.mapId : 'town',
    x: Number.isFinite(d.x) ? d.x : (MAPS.town.spawn.x + 0.5) * TILE,
    y: Number.isFinite(d.y) ? d.y : (MAPS.town.spawn.y + 0.5) * TILE,
    uid: d.uid === 0 ? 0 : undefined,
    gm: d.uid === 0,
    god: !!d.god,
    invisible: !!d.invisible,
    speed: d.speed || 1,
    playTime: d.playTime || 0,
    kills: d.kills || 0,
    savedAt: d.savedAt || Date.now(),
    rebirthCount: Math.max(0, Math.floor(d.rebirthCount || 0)),
    rebirthBonus: {
      maxHp: Math.max(0, Math.floor(d.rebirthBonus?.maxHp || 0)),
      maxMp: Math.max(0, Math.floor(d.rebirthBonus?.maxMp || 0)),
      atk: Math.max(0, Math.floor(d.rebirthBonus?.atk || 0)),
      def: Math.max(0, Math.floor(d.rebirthBonus?.def || 0)),
    },
  }
  if (p.hp <= 0) p.hp = getStats(p).maxHp
  startSession(p, `ยินดีต้อนรับกลับ ${p.name}! โหลดความคืบหน้าล่าสุดแล้ว`, true)
}

export function newGame(name: string) {
  const town = MAPS.town
  const p: SaveData = {
    version: 1,
    name: name.trim().slice(0, 16) || 'นักผจญภัย',
    jobId: 'novice',
    level: 1,
    exp: 0,
    hp: 1,
    mp: 1,
    gold: 300,
    diamonds: 0,
    ownedGemItems: [],
    equippedGemFashion: null,
    equippedGemCompanion: null,
    lootMagnetUntil: 0,
    inventoryCapacityBonus: 0,
    inventory: [],
    storage: [],
    storageGold: 0,
    equipment: {
      weapon: { uid: uid(), itemId: 'wooden_stick', qty: 1, plus: 0 },
      armor: { uid: uid(), itemId: 'cloth_armor', qty: 1, plus: 0 },
      shoes: null,
      cloak: null,
      accessory: null,
    },
    mapId: 'town',
    x: (town.spawn.x + 0.5) * TILE,
    y: (town.spawn.y + 0.5) * TILE,
    gm: false,
    god: false,
    invisible: false,
    speed: 1,
    playTime: 0,
    kills: 0,
    savedAt: Date.now(),
  }
  const s = getStats(p)
  p.hp = s.maxHp
  p.mp = s.maxMp
  game.p = p
  addItem('red_potion', 15)
  addItem('blue_potion', 5)
  addItem('return_scroll', 3)
  startSession(p, `ยินดีต้อนรับสู่โลกพิกเซล ${p.name}! ออกไปทางตะวันออกของเมืองเพื่อล่ามอนสเตอร์`, true)
}

export function quitToTitle() {
  saveGame()
  game.p = null
  resetRuntime()
  notify()
}

/* ---------------- update ---------------- */

const KEYMAP: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
}

function moveEntity(map: MapDef, e: { x: number; y: number }, dx: number, dy: number, hw = 4, hh = 3) {
  if (dx && !boxBlocked(map, e.x + dx, e.y, hw, hh)) e.x += dx
  if (dy && !boxBlocked(map, e.x, e.y + dy, hw, hh)) e.y += dy
}

export function update(dt: number) {
  const p = game.p
  if (!p) return
  const map = currentMap()
  game.time += dt
  p.playTime += dt
  game.attackCd -= dt
  game.attackAnim = Math.max(0, game.attackAnim - dt)
  for (const k in game.skillCd) game.skillCd[k] -= dt
  game.combatT += dt

  let mx = 0
  let my = 0
  if (!game.panel)
    for (const k of game.keys) {
      const v = KEYMAP[k]
      if (v) {
        mx += v[0]
        my += v[1]
      }
    }
  game.moving = mx !== 0 || my !== 0
  if (game.moving) {
    const len = Math.hypot(mx, my)
    const sp = getStats().speed * dt
    moveEntity(map, p, (mx / len) * sp, (my / len) * sp)
    game.walkT += dt
    game.facing = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'left' : 'right') : my < 0 ? 'up' : 'down'
  }

  const tx = Math.floor(p.x / TILE)
  const ty = Math.floor(p.y / TILE)
  for (const pt of map.portals) {
    if (tx >= pt.x && tx < pt.x + pt.w && ty >= pt.y && ty < pt.y + pt.h) {
      changeMap(pt.to, pt.tx, pt.ty)
      return
    }
  }

  game.nearNpc = null
  for (const n of map.npcs) {
    if (Math.hypot(n.x * TILE - p.x, n.y * TILE + 8 - p.y) < 30) {
      game.nearNpc = n
      break
    }
  }

  if (game.attackHeld) basicAttack()
  if (game.autoFarm && !game.panel) {
    if (game.autoSkills && currentJob().skills.length) castSkill(game.autoSkillIndex % currentJob().skills.length)
    else basicAttack()
  }
  collectGroundDrops()

  updateMonsters(dt, map)
  updateProjectiles(dt)

  for (const f of game.floats) {
    f.life -= dt
    f.y -= 22 * dt
  }
  game.floats = game.floats.filter((f) => f.life > 0)
  for (const e of game.effects) e.life -= dt
  game.effects = game.effects.filter((e) => e.life > 0)
  if (game.bubble && game.time > game.bubble.until) game.bubble = null

  game.regenT += dt
  if (game.regenT >= 2) {
    game.regenT = 0
    if (game.combatT > 4) {
      const s = getStats()
      const rate = map.safe ? 0.08 : 0.025
      p.hp = Math.min(s.maxHp, p.hp + Math.max(1, Math.floor(s.maxHp * rate)))
      p.mp = Math.min(s.maxMp, p.mp + Math.max(1, Math.floor(s.maxMp * rate)))
    }
  }

  game.saveT += dt
  if (game.saveT >= 10) saveGame()
}

function updateMonsters(dt: number, map: MapDef) {
  const p = player()
  for (const m of game.monsters) {
    if (m.dead) {
      if (game.time >= m.respawnAt) {
        const pt = randomSpawnPoint(map)
        Object.assign(m, { x: pt.x, y: pt.y, homeX: pt.x, homeY: pt.y, hp: m.maxHp, dead: false, provoked: false })
      }
      continue
    }
    m.animT += dt
    m.hitFlash -= dt
    m.attackCd -= dt
    m.lunge = Math.max(0, m.lunge - dt)
    if (map.safe) continue
    const def = MONSTERS[m.defId]
    const dx = p.x - m.x
    const dy = p.y - m.y
    const d = Math.hypot(dx, dy)
    const aggro = (m.provoked || (def.aggro > 0 && d < def.aggro)) && d < 260
    if (aggro) {
      m.provoked = true
      m.flip = dx < 0
      if (d > 14) moveEntity(map, m, (dx / d) * def.speed * dt, (dy / d) * def.speed * dt, 5, 4)
      else if (m.attackCd <= 0) {
        m.attackCd = def.boss ? 2 : 1.4
        m.lunge = 0.15
        hurtPlayer(def.atk)
        if (def.boss && Math.random() < 0.45) {
          addEffect({ type: 'ring', x: p.x, y: p.y - 6, r: 34, color: def.color, max: 0.55 })
          addEffect({ type: 'burst', x: p.x, y: p.y - 6, r: 22, color: '#ff4d6d', max: 0.35 })
          hurtPlayer(def.atk * 0.65)
          addFloat(p.x, p.y - 34, 'BOSS SKILL', '#ff4d6d', 13)
        }
        if (!game.p || game.p.mapId !== map.id) return
      }
    } else {
      m.provoked = false
      m.wanderT -= dt
      if (m.wanderT <= 0) {
        m.wanderT = rand(1.5, 4)
        const hd = Math.hypot(m.homeX - m.x, m.homeY - m.y)
        if (hd > 80) {
          m.vx = (m.homeX - m.x) / hd
          m.vy = (m.homeY - m.y) / hd
        } else if (Math.random() < 0.4) {
          m.vx = 0
          m.vy = 0
        } else {
          const a = rand(0, Math.PI * 2)
          m.vx = Math.cos(a)
          m.vy = Math.sin(a)
        }
      }
      if (m.vx) m.flip = m.vx < 0
      moveEntity(map, m, m.vx * def.speed * 0.45 * dt, m.vy * def.speed * 0.45 * dt, 5, 4)
    }
  }
}

function updateProjectiles(dt: number) {
  const keep: Projectile[] = []
  for (const pr of game.projectiles) {
    if (pr.delay > 0) {
      pr.delay -= dt
      const p = player()
      pr.x = p.x
      pr.y = p.y - 10
      keep.push(pr)
      continue
    }
    const t = game.monsters.find((m) => m.uid === pr.targetUid)
    if (!t || t.dead) continue
    const tx = t.x
    const ty = t.y - 8
    const d = Math.hypot(tx - pr.x, ty - pr.y)
    const step = pr.speed * dt
    if (d <= step + 4) {
      for (const mult of pr.mults) damageMonster(t, mult)
      addEffect({ type: 'spark', x: tx, y: ty, r: 6 + pr.size * 2, color: pr.color, max: 0.2 })
      continue
    }
    pr.x += ((tx - pr.x) / d) * step
    pr.y += ((ty - pr.y) / d) * step
    keep.push(pr)
  }
  game.projectiles = keep
}

export function isWalkablePx(x: number, y: number) {
  return !isSolidPx(currentMap(), x, y)
}
