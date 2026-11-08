export const TILE = 16

export const T = {
  GRASS: 0,
  FLOWER: 1,
  PATH: 2,
  WATER: 3,
  TREE: 4,
  WALL: 5,
  ROOF_RED: 6,
  DOOR: 7,
  FENCE: 8,
  PLAZA: 9,
  FOUNTAIN: 10,
  DARKGRASS: 11,
  BUSH: 12,
  ROCK: 13,
  CAVEFLOOR: 14,
  CAVEWALL: 15,
  VOLCFLOOR: 16,
  LAVA: 17,
  SAND: 18,
  WINDOW: 19,
  PINE: 20,
  CRYSTAL: 21,
  ROOF_BLUE: 22,
  ROOF_PURPLE: 23,
  ROOF_GREEN: 24,
  SIGN: 25,
  MUSHROOMS: 26,
  BONES: 27,
} as const

export type TileId = (typeof T)[keyof typeof T]

export const SOLID = new Set<number>([
  T.WATER,
  T.TREE,
  T.WALL,
  T.ROOF_RED,
  T.ROOF_BLUE,
  T.ROOF_PURPLE,
  T.ROOF_GREEN,
  T.DOOR,
  T.FENCE,
  T.FOUNTAIN,
  T.BUSH,
  T.ROCK,
  T.CAVEWALL,
  T.LAVA,
  T.WINDOW,
  T.PINE,
  T.CRYSTAL,
  T.SIGN,
])

export type Theme = 'town' | 'meadow' | 'forest' | 'cave' | 'volcano'
export type NpcRole = 'shop' | 'enhance' | 'job' | 'storage' | 'gacha' | 'rebirth'

export interface Portal {
  x: number
  y: number
  w: number
  h: number
  to: string
  tx: number
  ty: number
  label: string
}

export interface NpcDef {
  id: string
  name: string
  title: string
  role: NpcRole
  x: number
  y: number
  colors: { hair: string; body: string; legs: string; accent: string; skin?: string; hat?: string }
  greeting: string
}

export interface MapDef {
  id: string
  name: string
  levelLabel: string
  safe: boolean
  theme: Theme
  width: number
  height: number
  base: number
  tiles: Uint8Array
  portals: Portal[]
  spawns: { monsterId: string; count: number }[]
  npcs: NpcDef[]
  spawn: { x: number; y: number }
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Grid {
  tiles: Uint8Array
  constructor(
    public w: number,
    public h: number,
    fill: number,
  ) {
    this.tiles = new Uint8Array(w * h).fill(fill)
  }
  set(x: number, y: number, t: number) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.tiles[y * this.w + x] = t
  }
  get(x: number, y: number) {
    return this.tiles[y * this.w + x]
  }
  rect(x: number, y: number, w: number, h: number, t: number) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t)
  }
  blob(cx: number, cy: number, r: number, t: number, rng: () => number) {
    for (let j = -r - 1; j <= r + 1; j++)
      for (let i = -r - 1; i <= r + 1; i++) {
        const d = Math.sqrt(i * i + j * j) + rng() * 0.9
        if (d <= r) this.set(cx + i, cy + j, t)
      }
  }
  border(t: number, thickness: number) {
    for (let k = 0; k < thickness; k++) {
      this.rect(0, k, this.w, 1, t)
      this.rect(0, this.h - 1 - k, this.w, 1, t)
      this.rect(k, 0, 1, this.h, t)
      this.rect(this.w - 1 - k, 0, 1, this.h, t)
    }
  }
}

function house(g: Grid, x: number, y: number, w: number, roof: number) {
  g.rect(x, y, w, 2, roof)
  g.rect(x, y + 2, w, 2, T.WALL)
  g.set(x + 1, y + 2, T.WINDOW)
  g.set(x + w - 2, y + 2, T.WINDOW)
  g.set(x + Math.floor(w / 2), y + 3, T.DOOR)
}

function buildTown(): MapDef {
  const W = 40
  const H = 28
  const rng = mulberry32(1337)
  const g = new Grid(W, H, T.GRASS)
  for (let i = 0; i < W * H; i++) if (rng() < 0.06) g.tiles[i] = T.FLOWER
  g.border(T.TREE, 2)

  g.rect(2, 13, W - 2, 2, T.PATH)
  g.rect(19, 2, 2, H - 4, T.PATH)
  g.rect(14, 9, 12, 10, T.PLAZA)
  g.rect(19, 13, 2, 2, T.FOUNTAIN)

  house(g, 5, 4, 7, T.ROOF_RED)
  g.rect(8, 8, 1, 5, T.PATH)
  house(g, 28, 4, 7, T.ROOF_BLUE)
  g.rect(31, 8, 1, 5, T.PATH)
  house(g, 5, 18, 7, T.ROOF_PURPLE)
  g.rect(8, 15, 1, 3, T.PATH)
  house(g, 28, 18, 7, T.ROOF_GREEN)
  g.rect(31, 15, 1, 3, T.PATH)

  g.blob(14, 23, 2, T.WATER, rng)
  g.rect(23, 23, 4, 1, T.FENCE)
  g.rect(23, 21, 4, 2, T.FLOWER)
  g.rect(23, 20, 4, 1, T.FENCE)
  for (const [bx, by] of [
    [3, 3],
    [13, 3],
    [25, 3],
    [36, 3],
    [3, 24],
    [36, 24],
    [16, 6],
    [23, 6],
  ])
    g.set(bx, by, T.BUSH)

  g.rect(W - 2, 12, 2, 4, T.PATH)
  g.set(36, 11, T.SIGN)

  return {
    id: 'town',
    name: 'เมืองปราการเริ่มต้น',
    levelLabel: 'เขตปลอดภัย',
    safe: true,
    theme: 'town',
    width: W,
    height: H,
    base: T.GRASS,
    tiles: g.tiles,
    portals: [{ x: W - 1, y: 12, w: 1, h: 4, to: 'meadow', tx: 3, ty: 17, label: 'ทุ่งหญ้าสายลม Lv.1-10' }],
    spawns: [],
    spawn: { x: 20, y: 17 },
    npcs: [
      {
        id: 'merchant',
        name: 'ลุงสมปอง',
        title: 'พ่อค้า',
        role: 'shop',
        x: 8.5,
        y: 9.4,
        colors: { hair: '#5c4033', body: '#c44536', legs: '#4a3728', accent: '#f4d35e', hat: '#8c5a2b' },
        greeting: 'ยินดีต้อนรับ! ของดีราคาถูก มีครบทุกอย่างสำหรับนักผจญภัย',
      },
      {
        id: 'blacksmith',
        name: 'ช่างเหล็กบุญมา',
        title: 'ช่างตีบวก',
        role: 'enhance',
        x: 31.5,
        y: 9.4,
        colors: { hair: '#2b2b2b', body: '#6c757d', legs: '#343a40', accent: '#e76f51', skin: '#c68863' },
        greeting: 'ส่งอาวุธมา ข้าจะทำให้มันแข็งแกร่งขึ้น... ถ้าโชคดีนะ',
      },
      {
        id: 'goddess',
        name: 'ปรมาจารย์อาร์ค',
        title: 'เปลี่ยนอาชีพ',
        role: 'job',
        x: 8.5,
        y: 17.2,
        colors: { hair: '#f1f1f1', body: '#3a0ca3', legs: '#240046', accent: '#ffd60a', hat: '#3a0ca3' },
        greeting: 'เจ้าพร้อมจะก้าวไปสู่เส้นทางใหม่แล้วหรือยัง?',
      },
      {
        id: 'keeper',
        name: 'พี่มณี',
        title: 'คลังเก็บของ',
        role: 'storage',
        x: 31.5,
        y: 17.2,
        colors: { hair: '#8b2635', body: '#2a9d8f', legs: '#264653', accent: '#e9c46a' },
        greeting: 'ฝากของไว้กับฉันได้เลย ปลอดภัยแน่นอนจ้า',
      },
      {
        id: 'gacha',
        name: 'มาดามแคปซูล',
        title: 'ตู้สุ่มชา',
        role: 'gacha',
        x: 22.5,
        y: 13.8,
        colors: { hair: '#f1f1f1', body: '#7b2cbf', legs: '#3c096c', accent: '#ffd166', skin: '#f2c6a0' },
        greeting: 'ยินดีต้อนรับสู่ตู้สุ่มชา ลองเสี่ยงโชคเพื่อรับไอเท็มหายากดูไหม?',
      },
      {
        id: 'rebirth',
        name: 'เทวทูตแห่งการจุติ',
        title: 'จุติ',
        role: 'rebirth',
        x: 17.5,
        y: 13.8,
        colors: { hair: '#ffffff', body: '#e0fbfc', legs: '#98c1d9', accent: '#ffd166', skin: '#f2c6a0' },
        greeting: 'เมื่อเจ้าพร้อม ข้าจะนำทางสู่การจุติและการเริ่มต้นใหม่',
      },
    ],
  }
}

interface WildConfig {
  id: string
  name: string
  levelLabel: string
  theme: Theme
  seed: number
  base: number
  wall: number
  pathTile: number | null
  obstacles: { tile: number; chance: number }[]
  blobs: { tile: number; count: number; r: [number, number] }[]
  decor: { tile: number; chance: number }[]
  west: { to: string; tx: number; ty: number; label: string } | null
  east: { to: string; tx: number; ty: number; label: string } | null
  spawns: { monsterId: string; count: number }[]
}

const WW = 48
const WH = 34
const MID = 17

function buildWild(c: WildConfig): MapDef {
  const rng = mulberry32(c.seed)
  const g = new Grid(WW, WH, c.base)
  for (const b of c.blobs)
    for (let i = 0; i < b.count; i++) {
      const r = b.r[0] + Math.floor(rng() * (b.r[1] - b.r[0] + 1))
      g.blob(4 + Math.floor(rng() * (WW - 8)), 4 + Math.floor(rng() * (WH - 8)), r, b.tile, rng)
    }
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) {
      if (g.get(x, y) !== c.base) continue
      const r = rng()
      let acc = 0
      for (const o of c.obstacles) {
        acc += o.chance
        if (r < acc) {
          g.set(x, y, o.tile)
          break
        }
      }
      if (g.get(x, y) === c.base) {
        const r2 = rng()
        let acc2 = 0
        for (const d of c.decor) {
          acc2 += d.chance
          if (r2 < acc2) {
            g.set(x, y, d.tile)
            break
          }
        }
      }
    }
  let wy = MID
  for (let x = 1; x < WW - 1; x++) {
    if (rng() < 0.25) wy = Math.max(5, Math.min(WH - 6, wy + (rng() < 0.5 ? -1 : 1)))
    if (x > WW - 8) wy += Math.sign(MID - wy)
    g.rect(x, wy - 1, 1, 3, c.pathTile ?? c.base)
  }
  const vx = Math.floor(WW / 2)
  g.rect(vx - 1, 3, 2, WH - 6, c.pathTile ?? c.base)
  g.border(c.wall, 2)

  const portals: Portal[] = []
  if (c.west) {
    g.rect(0, MID - 2, 6, 4, c.pathTile ?? c.base)
    portals.push({ x: 0, y: MID - 2, w: 1, h: 4, ...c.west })
  }
  if (c.east) {
    g.rect(WW - 6, MID - 2, 6, 4, c.pathTile ?? c.base)
    portals.push({ x: WW - 1, y: MID - 2, w: 1, h: 4, ...c.east })
  }

  return {
    id: c.id,
    name: c.name,
    levelLabel: c.levelLabel,
    safe: false,
    theme: c.theme,
    width: WW,
    height: WH,
    base: c.base,
    tiles: g.tiles,
    portals,
    spawns: c.spawns,
    npcs: [],
    spawn: { x: 3, y: MID },
  }
}

export const MAPS: Record<string, MapDef> = {
  town: buildTown(),
  meadow: buildWild({
    id: 'meadow',
    name: 'ทุ่งหญ้าสายลม',
    levelLabel: 'Lv.1-10',
    theme: 'meadow',
    seed: 11,
    base: T.GRASS,
    wall: T.TREE,
    pathTile: T.PATH,
    obstacles: [
      { tile: T.TREE, chance: 0.035 },
      { tile: T.BUSH, chance: 0.02 },
      { tile: T.ROCK, chance: 0.01 },
    ],
    blobs: [{ tile: T.WATER, count: 3, r: [2, 3] }],
    decor: [{ tile: T.FLOWER, chance: 0.08 }],
    west: { to: 'town', tx: 37, ty: 14, label: 'เมืองปราการเริ่มต้น' },
    east: { to: 'forest', tx: 3, ty: 17, label: 'ป่าลึกลับ Lv.10-20' },
    spawns: [
      { monsterId: 'slime', count: 10 },
      { monsterId: 'pink_slime', count: 7 },
      { monsterId: 'mushroom', count: 6 },
      { monsterId: 'rabbit', count: 5 },
    ],
  }),
  forest: buildWild({
    id: 'forest',
    name: 'ป่าลึกลับ',
    levelLabel: 'Lv.10-20',
    theme: 'forest',
    seed: 22,
    base: T.DARKGRASS,
    wall: T.PINE,
    pathTile: T.PATH,
    obstacles: [
      { tile: T.PINE, chance: 0.09 },
      { tile: T.BUSH, chance: 0.03 },
    ],
    blobs: [{ tile: T.WATER, count: 2, r: [2, 3] }],
    decor: [{ tile: T.MUSHROOMS, chance: 0.03 }],
    west: { to: 'meadow', tx: 44, ty: 17, label: 'ทุ่งหญ้าสายลม Lv.1-10' },
    east: { to: 'cave', tx: 3, ty: 17, label: 'ถ้ำมืด Lv.20-35' },
    spawns: [
      { monsterId: 'wolf', count: 11 },
      { monsterId: 'goblin', count: 10 },
      { monsterId: 'goblin_chief', count: 1 },
    ],
  }),
  cave: buildWild({
    id: 'cave',
    name: 'ถ้ำมืด',
    levelLabel: 'Lv.20-35',
    theme: 'cave',
    seed: 33,
    base: T.CAVEFLOOR,
    wall: T.CAVEWALL,
    pathTile: null,
    obstacles: [
      { tile: T.ROCK, chance: 0.04 },
      { tile: T.CAVEWALL, chance: 0.03 },
      { tile: T.CRYSTAL, chance: 0.012 },
    ],
    blobs: [{ tile: T.CAVEWALL, count: 6, r: [1, 2] }],
    decor: [{ tile: T.BONES, chance: 0.02 }],
    west: { to: 'forest', tx: 44, ty: 17, label: 'ป่าลึกลับ Lv.10-20' },
    east: { to: 'volcano', tx: 3, ty: 17, label: 'ภูเขาไฟอัคคี Lv.35-50' },
    spawns: [
      { monsterId: 'bat', count: 11 },
      { monsterId: 'skeleton', count: 10 },
      { monsterId: 'ghost', count: 8 },
    ],
  }),
  volcano: buildWild({
    id: 'volcano',
    name: 'แมพลาวา',
    levelLabel: 'Lv.35-50 • เขตลาวา',
    theme: 'volcano',
    seed: 44,
    base: T.VOLCFLOOR,
    wall: T.CAVEWALL,
    pathTile: null,
    obstacles: [{ tile: T.ROCK, chance: 0.045 }],
    blobs: [{ tile: T.LAVA, count: 7, r: [1, 3] }],
    decor: [{ tile: T.BONES, chance: 0.015 }],
    west: { to: 'cave', tx: 44, ty: 17, label: 'ถ้ำมืด Lv.20-35' },
    east: { to: 'abyss', tx: 3, ty: 17, label: 'ดันเจี้ยนห้วงอเวจี Lv.50+' },
    spawns: [
      { monsterId: 'fire_golem', count: 11 },
      { monsterId: 'demon', count: 9 },
      { monsterId: 'demon_lord', count: 1 },
    ],
  }),
  abyss: buildWild({
    id: 'abyss',
    name: 'ดันเจี้ยนห้วงอเวจี',
    levelLabel: 'Lv.50+ ดันเจี้ยนบอส',
    theme: 'cave',
    seed: 55,
    base: T.CAVEFLOOR,
    wall: T.CAVEWALL,
    pathTile: null,
    obstacles: [
      { tile: T.CAVEWALL, chance: 0.05 },
      { tile: T.CRYSTAL, chance: 0.02 },
      { tile: T.BONES, chance: 0.02 },
    ],
    blobs: [{ tile: T.CAVEWALL, count: 8, r: [1, 3] }],
    decor: [{ tile: T.CRYSTAL, chance: 0.02 }],
    west: { to: 'volcano', tx: 44, ty: 17, label: 'ภูเขาไฟอัคคี Lv.35-50' },
    east: { to: 'sky_ruins', tx: 3, ty: 17, label: 'ซากฟ้าลอยฟ้า Lv.60+' },
    spawns: [
      { monsterId: 'demon', count: 10 },
      { monsterId: 'abyss_knight', count: 6 },
      { monsterId: 'abyss_dragon', count: 1 },
    ],
  }),
  sky_ruins: buildWild({
    id: 'sky_ruins', name: 'ซากฟ้าลอยฟ้า', levelLabel: 'Lv.60-70', theme: 'meadow', seed: 66, base: T.PLAZA, wall: T.ROOF_BLUE, pathTile: T.PATH,
    obstacles: [{ tile: T.ROOF_BLUE, chance: 0.04 }, { tile: T.ROCK, chance: 0.02 }], blobs: [{ tile: T.WATER, count: 2, r: [1, 2] }], decor: [{ tile: T.FLOWER, chance: 0.04 }],
    west: { to: 'abyss', tx: 44, ty: 17, label: 'ดันเจี้ยนห้วงอเวจี Lv.50+' }, east: { to: 'crystal_vale', tx: 3, ty: 17, label: 'หุบเขาคริสตัล Lv.70+' },
    spawns: [{ monsterId: 'abyss_knight', count: 10 }, { monsterId: 'demon_lord', count: 3 }],
  }),
  crystal_vale: buildWild({
    id: 'crystal_vale', name: 'หุบเขาคริสตัล', levelLabel: 'Lv.70-80', theme: 'cave', seed: 77, base: T.CAVEFLOOR, wall: T.CAVEWALL,
    obstacles: [{ tile: T.CRYSTAL, chance: 0.05 }, { tile: T.ROCK, chance: 0.03 }], blobs: [{ tile: T.CRYSTAL, count: 5, r: [1, 3] }], decor: [{ tile: T.CRYSTAL, chance: 0.03 }],
    west: { to: 'sky_ruins', tx: 44, ty: 17, label: 'ซากฟ้าลอยฟ้า Lv.60+' }, east: { to: 'frost_peak', tx: 3, ty: 17, label: 'ยอดเขาเหมันต์ Lv.80+' },
    spawns: [{ monsterId: 'ghost', count: 10 }, { monsterId: 'abyss_dragon', count: 2 }],
  }),
  frost_peak: buildWild({
    id: 'frost_peak', name: 'ยอดเขาเหมันต์', levelLabel: 'Lv.80-90', theme: 'forest', seed: 88, base: T.DARKGRASS, wall: T.PINE,
    obstacles: [{ tile: T.PINE, chance: 0.08 }, { tile: T.ROCK, chance: 0.025 }], blobs: [{ tile: T.WATER, count: 3, r: [1, 2] }], decor: [{ tile: T.BONES, chance: 0.02 }],
    west: { to: 'crystal_vale', tx: 44, ty: 17, label: 'หุบเขาคริสตัล Lv.70+' }, east: { to: 'dream_garden', tx: 3, ty: 17, label: 'สวนฝันนิรันดร์ Lv.90+' },
    spawns: [{ monsterId: 'demon', count: 10 }, { monsterId: 'demon_lord', count: 2 }],
  }),
  dream_garden: buildWild({
    id: 'dream_garden', name: 'สวนฝันนิรันดร์', levelLabel: 'Lv.90-100', theme: 'meadow', seed: 99, base: T.GRASS, wall: T.TREE, pathTile: T.PATH,
    obstacles: [{ tile: T.TREE, chance: 0.05 }, { tile: T.BUSH, chance: 0.04 }], blobs: [{ tile: T.WATER, count: 4, r: [1, 3] }], decor: [{ tile: T.FLOWER, chance: 0.12 }],
    west: { to: 'frost_peak', tx: 44, ty: 17, label: 'ยอดเขาเหมันต์ Lv.80+' }, east: { to: 'celestial_colosseum', tx: 3, ty: 17, label: 'โคลอสเซียมสวรรค์ Lv.100+' },
    spawns: [{ monsterId: 'fire_golem', count: 8 }, { monsterId: 'abyss_knight', count: 4 }],
  }),
  celestial_colosseum: buildWild({
    id: 'celestial_colosseum', name: 'โคลอสเซียมสวรรค์', levelLabel: 'Lv.100+ เขตบอส', theme: 'volcano', seed: 110, base: T.VOLCFLOOR, wall: T.CAVEWALL,
    obstacles: [{ tile: T.ROCK, chance: 0.05 }], blobs: [{ tile: T.LAVA, count: 4, r: [1, 2] }], decor: [{ tile: T.BONES, chance: 0.03 }],
    west: { to: 'dream_garden', tx: 44, ty: 17, label: 'สวนฝันนิรันดร์ Lv.90+' }, east: null,
    spawns: [{ monsterId: 'demon_lord', count: 6 }, { monsterId: 'abyss_dragon', count: 2 }],
  }),
}

export const MAP_ORDER = ['town', 'meadow', 'forest', 'cave', 'volcano', 'abyss', 'sky_ruins', 'crystal_vale', 'frost_peak', 'dream_garden', 'celestial_colosseum']

export function tileAt(map: MapDef, tx: number, ty: number) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return T.CAVEWALL
  return map.tiles[ty * map.width + tx]
}

export function isSolidPx(map: MapDef, px: number, py: number) {
  return SOLID.has(tileAt(map, Math.floor(px / TILE), Math.floor(py / TILE)))
}

export function boxBlocked(map: MapDef, x: number, y: number, hw = 4, hh = 3) {
  return (
    isSolidPx(map, x - hw, y - hh) ||
    isSolidPx(map, x + hw, y - hh) ||
    isSolidPx(map, x - hw, y) ||
    isSolidPx(map, x + hw, y)
  )
}
