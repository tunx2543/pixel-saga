import type { MonsterSprite, WeaponType } from './data'
import { T, TILE, type MapDef } from './maps'

const OUTLINE = '#1a1423'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex)
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)))
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return { c, ctx }
}

function renderTemplate(rows: string[], palette: Record<string, string>, outline = true) {
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const pad = outline ? 1 : 0
  const { c, ctx } = makeCanvas(w + pad * 2, h + pad * 2)
  const filled: boolean[][] = Array.from({ length: h + pad * 2 }, () => Array(w + pad * 2).fill(false))
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      const col = palette[ch]
      if (!col) continue
      filled[y + pad][x + pad] = true
    }
  })
  if (outline) {
    ctx.fillStyle = OUTLINE
    for (let y = 0; y < filled.length; y++)
      for (let x = 0; x < filled[0].length; x++) {
        if (filled[y][x]) continue
        const n =
          filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y]?.[x - 1] || filled[y]?.[x + 1]
        if (n) ctx.fillRect(x, y, 1, 1)
      }
  }
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(x + pad, y + pad, 1, 1)
    }
  })
  return c
}

const cache = new Map<string, HTMLCanvasElement>()
const gmOutfitCache = new Map<string, HTMLImageElement>()

type GmAnimation = 'idle' | 'walk' | 'attack'

export function gmOutfitSprite(dir: Dir, animation: GmAnimation = 'idle'): HTMLImageElement | null {
  const direction = dir === 'down' ? 'south' : dir === 'up' ? 'north' : dir === 'left' ? 'west' : 'east'
  const key = `gm-${animation}-${direction}`
  let image = gmOutfitCache.get(key)
  if (!image) {
    image = new Image()
    image.crossOrigin = 'anonymous'
    const useWalk = animation === 'walk' && direction === 'south'
    const filename = animation === 'attack' ? `attack-${direction}.gif` : useWalk ? 'walk-south.gif' : `outfit-${direction}.png`
    image.src = `/images/characters/gm/${filename}`
    gmOutfitCache.set(key, image)
  }
  return image.complete && image.naturalWidth > 0 ? image : null
}

function cached(key: string, make: () => HTMLCanvasElement) {
  let c = cache.get(key)
  if (!c) {
    c = make()
    cache.set(key, c)
  }
  return c
}

/* ---------------- Humanoids ---------------- */

const HUMAN_FRONT = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '..hhhhhhhh..',
  '..hssssssh..',
  '..sesssses..',
  '..ssssssss..',
  '...ssmmss...',
  '..bbbbbbbb..',
  '.kbbbbbbbbk.',
  '.kbbaaaabbk.',
  '..bbbbbbbb..',
  '..llllllll..',
]
const LEGS_A = ['..lll..lll..', '..lll..lll..', '..ff....ff..']
const LEGS_B = ['..lll...ll..', '..ll....lll.', '..ff.....ff.']
const LEGS_C = ['..ll...lll..', '.lll....ll..', '.ff.....ff..']

const HUMAN_BACK = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '..hhhhhhhh..',
  '..hhhhhhhh..',
  '..hhhhhhhh..',
  '..shhhhhhs..',
  '...ssssss...',
  '..bbbbbbbb..',
  '.kbbbbbbbbk.',
  '.kbbaaaabbk.',
  '..bbbbbbbb..',
  '..llllllll..',
]

const HUMAN_SIDE = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '..hhhhhhhh..',
  '..hhhsssss..',
  '..hhssssse..',
  '...sssssss..',
  '....sssss...',
  '...bbbbbb...',
  '...bbbkbb...',
  '...baaaab...',
  '...bbbbbb...',
  '...llllll...',
]
const SIDE_A = ['...ll..ll...', '...ll..ll...', '...ff..ff...']
const SIDE_B = ['..ll....ll..', '.ll......ll.', '.ff......ff.']

export type Dir = 'down' | 'up' | 'left' | 'right'

export interface HumanColors {
  hair: string
  body: string
  legs: string
  accent: string
  skin?: string
  hat?: string
  horns?: boolean
  eye?: string
}

function weaponPixels(rows: string[], weapon: WeaponType | null, dir: Dir) {
  if (!weapon || dir === 'up') return rows
  const out = rows.map((r) => r.padEnd(13, '.'))
  const put = (x: number, y: number, ch: string) => {
    if (!out[y]) return
    out[y] = out[y].slice(0, x) + ch + out[y].slice(x + 1)
  }
  const x = dir === 'down' ? 11 : 10
  if (weapon === 'sword') {
    for (let y = 2; y <= 8; y++) put(x + 1, y, 'W')
    put(x, 9, 'G')
    put(x + 1, 9, 'G')
    put(x + 2, 9, 'G')
    put(x + 1, 10, 'N')
  } else if (weapon === 'staff') {
    for (let y = 3; y <= 14; y++) put(x + 1, y, 'N')
    put(x + 1, 1, 'O')
    put(x, 2, 'O')
    put(x + 2, 2, 'O')
    put(x + 1, 2, 'O')
  } else if (weapon === 'bow') {
    put(x + 1, 3, 'N')
    put(x + 2, 4, 'N')
    put(x + 2, 5, 'N')
    put(x + 2, 6, 'N')
    put(x + 2, 7, 'N')
    put(x + 2, 8, 'N')
    put(x + 1, 9, 'N')
    for (let y = 4; y <= 8; y++) put(x + 1, y, 'S')
  } else if (weapon === 'dagger') {
    for (let y = 6; y <= 8; y++) put(x + 1, y, 'W')
    put(x + 1, 9, 'G')
  } else if (weapon === 'stick') {
    for (let y = 4; y <= 11; y++) put(x + 1, y, 'N')
  }
  return out
}

export function humanSprite(colors: HumanColors, dir: Dir, frame: number, weapon: WeaponType | null = null, weaponColor = '#ced4da') {
  const key = `h|${JSON.stringify(colors)}|${dir}|${frame}|${weapon}|${weaponColor}`
  return cached(key, () => {
    const side = dir === 'left' || dir === 'right'
    let rows = side ? [...HUMAN_SIDE] : dir === 'up' ? [...HUMAN_BACK] : [...HUMAN_FRONT]
    const legs = side ? (frame % 2 === 1 ? SIDE_B : SIDE_A) : frame === 1 ? LEGS_B : frame === 3 ? LEGS_C : LEGS_A
    rows = [...rows, ...legs]
    if (colors.hat) {
      rows[0] = '...tttttt...'
      rows[1] = '..tttttttt..'
      rows[2] = '.TTTTTTTTTT.'
    }
    if (colors.horns) {
      rows = ['..r......r..', ...rows]
      rows[1] = '..rhhhhhhr..'
    }
    rows = weaponPixels(rows, weapon, side ? 'right' : dir)
    const skin = colors.skin ?? '#f1c27d'
    const palette: Record<string, string> = {
      h: colors.hair,
      s: skin,
      e: colors.eye ?? '#1a1423',
      m: shade(skin, -0.25),
      b: colors.body,
      k: skin,
      a: colors.accent,
      l: colors.legs,
      f: '#2b2118',
      t: colors.hat ?? colors.hair,
      T: shade(colors.hat ?? colors.hair, -0.25),
      r: '#f1e9d2',
      W: weaponColor,
      G: '#e9c46a',
      N: '#7f5539',
      O: weaponColor,
      S: '#f1f1f1',
    }
    let c = renderTemplate(rows, palette)
    if (dir === 'left') {
      const { c: f, ctx } = makeCanvas(c.width, c.height)
      ctx.translate(c.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(c, 0, 0)
      c = f
    }
    return c
  })
}

/* ---------------- Monsters ---------------- */

const MONSTER_TEMPLATES: Partial<Record<MonsterSprite, string[][]>> = {
  slime: [
    [
      '....cccc....',
      '..cccccccc..',
      '.cclcccccccc',
      '.clcccccccc.',
      'cccccccccccc',
      'cccecccceccc',
      'cccecccceccc',
      'cccccmmccccc',
      'dccccccccccd',
      '.dddddddddd.',
    ],
    [
      '............',
      '....cccc....',
      '..cclccccc..',
      '.clcccccccc.',
      'cccecccceccc',
      'cccecccceccc',
      'cccccmmccccc',
      'cccccccccccc',
      'dccccccccccd',
      'dddddddddddd',
    ],
  ],
  mushroom: [
    [
      '...cccccc...',
      '.ccwccccwcc.',
      'cccccccccccc',
      'ccwccccccwcc',
      'dddddddddddd',
      '..ssssssss..',
      '..sesssses..',
      '..ssssssss..',
      '..ssssssss..',
      '...ff..ff...',
    ],
    [
      '............',
      '...cccccc...',
      '.ccwccccwcc.',
      'cccccccccccc',
      'dddddddddddd',
      '..ssssssss..',
      '..sesssses..',
      '..ssssssss..',
      '..ssssssss..',
      '..ff....ff..',
    ],
  ],
  rabbit: [
    [
      '..c.....c...',
      '..cp...cp...',
      '..cp...cp...',
      '..cc...cc...',
      '..ccccccc...',
      '.ccccccccc..',
      '.cecccccec..',
      '.ccccpcccc..',
      '.ccwwwwwcc..',
      '.ccwwwwwcc..',
      '..ccc.ccc...',
      '..ww...ww...',
    ],
    [
      '............',
      '..c.....c...',
      '..cp...cp...',
      '..cc...cc...',
      '..ccccccc...',
      '.ccccccccc..',
      '.cecccccec..',
      '.ccccpcccc..',
      '.ccwwwwwcc..',
      '.ccwwwwwcc..',
      '.ccc...ccc..',
      '.ww.....ww..',
    ],
  ],
  wolf: [
    [
      '............cc..',
      '...........cccc.',
      'c..........ccec.',
      'cc.cccccccccccck',
      '.ccccccccccccccc',
      '.cddddcccccccww.',
      '..cccccccccccc..',
      '..cc.cc...cc.cc.',
      '..cc.cc...cc.cc.',
      '..dd.dd...dd.dd.',
    ],
    [
      '............cc..',
      '...........cccc.',
      '...........ccec.',
      'cc.cccccccccccck',
      'cccccccccccccccc',
      '.cddddcccccccww.',
      '..cccccccccccc..',
      '.cc..cc..cc..cc.',
      'cc....cc.cc...cc',
      'dd....dd.dd...dd',
    ],
  ],
  bat: [
    [
      'd..............d',
      'dd....c..c....dd',
      'ddd...cccc...ddd',
      'dddd.cecceccdddd',
      'ddddddccccdddddd',
      '.ddddccmmccdddd.',
      '..ddd.cccc.ddd..',
      '.......cc.......',
    ],
    [
      '................',
      '......c..c......',
      '......cccc......',
      '.....cecceccc...',
      'dd...dccccd...dd',
      'ddddddcmmcdddddd',
      '.ddddddccdddddd.',
      '..dddd.cc.dddd..',
    ],
  ],
  ghost: [
    [
      '...cccccc...',
      '..cccccccc..',
      '.cccccccccc.',
      '.ccEEccEEcc.',
      '.ccEEccEEcc.',
      '.cccccccccc.',
      '.ccccmmcccc.',
      '.cccccccccc.',
      '.lcccccccccl',
      '.cccccccccc.',
      '.cc.ccc.cc..',
      '.c...c...c..',
    ],
    [
      '............',
      '...cccccc...',
      '..cccccccc..',
      '.cccccccccc.',
      '.ccEEccEEcc.',
      '.ccEEccEEcc.',
      '.cccccccccc.',
      '.ccccmmcccc.',
      'lcccccccccc.',
      '.cccccccccc.',
      '..cc.ccc.cc.',
      '..c...c...c.',
    ],
  ],
  golem: [
    [
      '....dddddddd....',
      '...cccccccccc...',
      '...ccyyccyycc...',
      '...cccccccccc...',
      '....cccoocccc...',
      '.dccccccccccccd.',
      'ccccoccccccccocc',
      'cccccccooccccccc',
      'cccc.cccccccc.cc',
      'ccc..ccooccc..cc',
      'oo...cccccccc.oo',
      '.....ccc..ccc...',
      '.....ccc..ccc...',
      '....dddd..dddd..',
    ],
    [
      '................',
      '....dddddddd....',
      '...cccccccccc...',
      '...ccyyccyycc...',
      '...cccccccccc...',
      '.dccccoocccccd..',
      'cccccccccccccccc',
      'ccccoccooccccocc',
      'cccc.cccccccc.cc',
      'oo...ccooccc..oo',
      '.....cccccccc...',
      '....ccc....ccc..',
      '....ccc....ccc..',
      '...dddd....dddd.',
    ],
  ],
}

export function monsterSprite(sprite: MonsterSprite, color: string, frame: number) {
  const key = `m|${sprite}|${color}|${frame % 2}`
  return cached(key, () => {
    if (sprite === 'goblin') {
      return humanSprite(
        { hair: shade(color, -0.35), body: '#7f5539', legs: '#5c3d2e', accent: '#e9c46a', skin: color, eye: '#ffd60a' },
        'down',
        frame % 2 === 0 ? 0 : 1,
        'stick',
      )
    }
    if (sprite === 'skeleton') {
      return humanSprite(
        { hair: color, body: shade(color, -0.12), legs: shade(color, -0.2), accent: '#6c757d', skin: color, eye: '#d00000' },
        'down',
        frame % 2 === 0 ? 0 : 1,
        'sword',
        '#8d99ae',
      )
    }
    if (sprite === 'demon') {
      return humanSprite(
        { hair: '#14080e', body: color, legs: shade(color, -0.4), accent: '#ffb703', skin: shade(color, 0.15), horns: true, eye: '#ffd60a' },
        'down',
        frame % 2 === 0 ? 0 : 1,
        'staff',
        '#ff6b35',
      )
    }
    const frames = MONSTER_TEMPLATES[sprite]!
    return renderTemplate(frames[frame % frames.length], {
      c: color,
      d: shade(color, -0.3),
      l: shade(color, 0.5),
      w: '#ffffff',
      e: '#1a1423',
      E: '#1a1423',
      m: '#3d0c11',
      p: '#ff8fab',
      s: '#f1e3c8',
      f: '#5c3d2e',
      k: '#1a1423',
      y: '#ffd60a',
      o: '#ffb703',
    })
  })
}

/* ---------------- Tiles ---------------- */

function speckle(ctx: CanvasRenderingContext2D, rng: () => number, base: string, cols: string[], density: number) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, TILE, TILE)
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++)
      if (rng() < density) {
        ctx.fillStyle = cols[Math.floor(rng() * cols.length)]
        ctx.fillRect(x, y, 1, 1)
      }
}

function rngFrom(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const ROOF_COLORS: Record<number, string> = {
  [T.ROOF_RED]: '#b23a48',
  [T.ROOF_BLUE]: '#3a6ea5',
  [T.ROOF_PURPLE]: '#6a4c93',
  [T.ROOF_GREEN]: '#3f7d4e',
}

function drawBase(ctx: CanvasRenderingContext2D, tile: number, rng: () => number) {
  switch (tile) {
    case T.GRASS:
      return speckle(ctx, rng, '#5a9e4b', ['#6bb35a', '#4c8a3f', '#78c267'], 0.12)
    case T.DARKGRASS:
      return speckle(ctx, rng, '#2f6b3a', ['#3a7d45', '#25572f', '#447f4c'], 0.14)
    case T.PATH:
      return speckle(ctx, rng, '#c9a86a', ['#b8955a', '#d9bc84', '#a88850'], 0.16)
    case T.SAND:
      return speckle(ctx, rng, '#e6cf8f', ['#d6bd7c', '#f0dca4'], 0.12)
    case T.PLAZA: {
      speckle(ctx, rng, '#b5b0a6', ['#a8a397', '#c4bfb4'], 0.15)
      ctx.fillStyle = '#8f8a80'
      ctx.fillRect(0, 0, TILE, 1)
      ctx.fillRect(0, 8, TILE, 1)
      ctx.fillRect(0, 0, 1, 8)
      ctx.fillRect(8, 8, 1, 8)
      return
    }
    case T.CAVEFLOOR:
      return speckle(ctx, rng, '#46495f', ['#3b3d52', '#53566e', '#3f4258'], 0.18)
    case T.VOLCFLOOR: {
      speckle(ctx, rng, '#3b2a2a', ['#4a3434', '#2c1f1f', '#523a3a'], 0.18)
      if (rng() < 0.3) {
        ctx.fillStyle = '#ff6b35'
        ctx.fillRect(Math.floor(rng() * 14), Math.floor(rng() * 14), 1, 1)
      }
      return
    }
    default:
      return speckle(ctx, rng, '#5a9e4b', ['#6bb35a', '#4c8a3f'], 0.12)
  }
}

function drawTile(ctx: CanvasRenderingContext2D, tile: number, base: number, variant: number) {
  const rng = rngFrom(tile * 1000 + base * 37 + variant * 7 + 1)
  const p = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  }
  switch (tile) {
    case T.FLOWER: {
      drawBase(ctx, T.GRASS, rng)
      const cols = ['#ffd6e0', '#fff3b0', '#ff5d8f', '#cdb4db', '#ffffff']
      for (let i = 0; i < 3; i++) {
        const x = 2 + Math.floor(rng() * 11)
        const y = 2 + Math.floor(rng() * 11)
        const c = cols[Math.floor(rng() * cols.length)]
        p(x, y - 1, c)
        p(x - 1, y, c)
        p(x + 1, y, c)
        p(x, y + 1, c)
        p(x, y, '#f4a261')
      }
      return
    }
    case T.WATER: {
      p(0, 0, '#3a7bd5', TILE, TILE)
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(rng() * 12)
        const y = Math.floor(rng() * 15)
        p(x, y, '#6aa6ef', 3, 1)
      }
      p(0, 0, '#2f66b3', TILE, 1)
      return
    }
    case T.TREE: {
      drawBase(ctx, base, rng)
      p(6, 11, '#6b4226', 4, 5)
      p(7, 11, '#8a5a3b', 1, 4)
      p(3, 14, 'rgba(0,0,0,0.2)', 10, 2)
      const canopy = [
        [5, 0, 6],
        [3, 1, 10],
        [2, 2, 12],
        [1, 3, 14],
        [1, 4, 14],
        [1, 5, 14],
        [1, 6, 14],
        [2, 7, 12],
        [2, 8, 12],
        [3, 9, 10],
        [5, 10, 6],
      ]
      for (const [x, y, w] of canopy) p(x, y, '#2d6a2e', w, 1)
      p(3, 2, '#3f8f3f', 5, 2)
      p(2, 4, '#3f8f3f', 3, 2)
      p(5, 1, '#5aa95a', 2, 1)
      p(4, 8, '#1e4d20', 9, 1)
      p(5, 9, '#1e4d20', 7, 1)
      return
    }
    case T.PINE: {
      drawBase(ctx, base, rng)
      p(7, 12, '#5c3d2e', 2, 4)
      p(3, 14, 'rgba(0,0,0,0.25)', 10, 2)
      const layers = [
        [7, 0, 2],
        [6, 1, 4],
        [5, 2, 6],
        [6, 3, 4],
        [4, 4, 8],
        [3, 5, 10],
        [5, 6, 6],
        [3, 7, 10],
        [2, 8, 12],
        [1, 9, 14],
        [2, 10, 12],
        [3, 11, 10],
      ]
      for (const [x, y, w] of layers) p(x, y, '#1b4332', w, 1)
      p(6, 2, '#2d6a4f', 2, 2)
      p(5, 5, '#2d6a4f', 3, 1)
      p(4, 8, '#2d6a4f', 3, 2)
      p(10, 9, '#081c15', 4, 2)
      return
    }
    case T.BUSH: {
      drawBase(ctx, base, rng)
      p(2, 13, 'rgba(0,0,0,0.2)', 12, 2)
      p(3, 5, '#2f7a33', 10, 9)
      p(2, 7, '#2f7a33', 12, 5)
      p(4, 4, '#2f7a33', 8, 1)
      p(4, 6, '#46a046', 4, 2)
      p(9, 8, '#46a046', 2, 2)
      p(3, 12, '#1f5222', 10, 1)
      p(6, 7, '#e63946')
      p(10, 10, '#e63946')
      return
    }
    case T.ROCK: {
      drawBase(ctx, base, rng)
      p(2, 13, 'rgba(0,0,0,0.25)', 12, 2)
      p(3, 5, '#8d99ae', 10, 8)
      p(2, 7, '#8d99ae', 12, 5)
      p(5, 4, '#8d99ae', 6, 1)
      p(4, 5, '#adb5bd', 4, 2)
      p(3, 11, '#6c757d', 10, 2)
      p(9, 7, '#6c757d', 1, 3)
      return
    }
    case T.CRYSTAL: {
      drawBase(ctx, T.CAVEFLOOR, rng)
      p(3, 13, 'rgba(0,0,0,0.3)', 10, 2)
      p(7, 2, '#72efdd', 2, 11)
      p(4, 6, '#56cfe1', 2, 7)
      p(10, 5, '#64dfdf', 2, 8)
      p(7, 2, '#e0fbfc', 1, 4)
      p(4, 6, '#e0fbfc', 1, 2)
      return
    }
    case T.CAVEWALL: {
      p(0, 0, base === T.VOLCFLOOR ? '#1f1414' : '#22223b', TILE, TILE)
      for (let i = 0; i < 6; i++) p(Math.floor(rng() * 14), Math.floor(rng() * 14), base === T.VOLCFLOOR ? '#3a2323' : '#343a5a', 2, 2)
      p(0, 14, base === T.VOLCFLOOR ? '#120b0b' : '#15152a', TILE, 2)
      return
    }
    case T.LAVA: {
      p(0, 0, '#e85d04', TILE, TILE)
      for (let i = 0; i < 5; i++) p(Math.floor(rng() * 14), Math.floor(rng() * 14), '#ffb703', 2, 1)
      for (let i = 0; i < 3; i++) p(Math.floor(rng() * 14), Math.floor(rng() * 14), '#9d0208', 2, 2)
      return
    }
    case T.WALL:
    case T.WINDOW:
    case T.DOOR: {
      p(0, 0, '#e9d8a6', TILE, TILE)
      p(0, 5, '#cdb57f', TILE, 1)
      p(0, 11, '#cdb57f', TILE, 1)
      p(0, 0, '#c9b27c', 1, TILE)
      p(15, 0, '#b39a62', 1, TILE)
      if (tile === T.WINDOW) {
        p(3, 3, '#6b4226', 10, 9)
        p(4, 4, '#8ecae6', 8, 7)
        p(4, 4, '#caf0f8', 3, 2)
        p(7, 4, '#6b4226', 1, 7)
        p(4, 7, '#6b4226', 8, 1)
      }
      if (tile === T.DOOR) {
        p(3, 2, '#5c3d2e', 10, 14)
        p(4, 3, '#7f5539', 8, 13)
        p(7, 3, '#5c3d2e', 1, 13)
        p(10, 9, '#f4d35e', 1, 2)
      }
      return
    }
    case T.ROOF_RED:
    case T.ROOF_BLUE:
    case T.ROOF_PURPLE:
    case T.ROOF_GREEN: {
      const c = ROOF_COLORS[tile]
      p(0, 0, c, TILE, TILE)
      for (let y = 0; y < TILE; y += 4) {
        p(0, y + 3, shade(c, -0.3), TILE, 1)
        for (let x = (y / 4) % 2 === 0 ? 0 : 4; x < TILE; x += 8) p(x, y, shade(c, -0.18), 1, 3)
      }
      p(0, 0, shade(c, 0.2), TILE, 1)
      return
    }
    case T.FENCE: {
      drawBase(ctx, base, rng)
      p(0, 6, '#8a5a3b', TILE, 2)
      p(0, 10, '#8a5a3b', TILE, 2)
      p(2, 3, '#a47148', 3, 12)
      p(11, 3, '#a47148', 3, 12)
      p(2, 3, '#c8956b', 3, 1)
      p(11, 3, '#c8956b', 3, 1)
      return
    }
    case T.SIGN: {
      drawBase(ctx, base, rng)
      p(7, 9, '#6b4226', 2, 7)
      p(1, 2, '#6b4226', 14, 8)
      p(2, 3, '#c8956b', 12, 6)
      p(4, 5, '#6b4226', 6, 1)
      p(10, 4, '#6b4226', 1, 3)
      p(11, 5, '#6b4226', 1, 1)
      return
    }
    case T.MUSHROOMS: {
      drawBase(ctx, base, rng)
      p(4, 9, '#f1e3c8', 2, 3)
      p(3, 7, '#e63946', 4, 2)
      p(4, 7, '#ffffff')
      p(10, 11, '#f1e3c8', 2, 2)
      p(9, 9, '#f4a261', 4, 2)
      return
    }
    case T.BONES: {
      drawBase(ctx, base, rng)
      p(3, 8, '#e9e3d5', 8, 1)
      p(2, 7, '#e9e3d5', 2, 3)
      p(10, 7, '#e9e3d5', 2, 3)
      p(9, 11, '#d6d0c0', 3, 2)
      return
    }
    case T.FOUNTAIN:
      return drawBase(ctx, T.PLAZA, rng)
    default:
      return drawBase(ctx, tile, rng)
  }
}

function tileCanvas(tile: number, base: number, variant: number) {
  return cached(`t|${tile}|${base}|${variant}`, () => {
    const { c, ctx } = makeCanvas(TILE, TILE)
    drawTile(ctx, tile, base, variant)
    return c
  })
}

const mapCache = new Map<string, HTMLCanvasElement>()
export function mapCanvas(map: MapDef) {
  let c = mapCache.get(map.id)
  if (c) return c
  const made = makeCanvas(map.width * TILE, map.height * TILE)
  c = made.c
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      const t = map.tiles[y * map.width + x]
      const variant = (x * 7 + y * 13) % 4
      made.ctx.drawImage(tileCanvas(t, map.base, variant), x * TILE, y * TILE)
    }
  mapCache.set(map.id, c)
  return c
}

/* ---------------- Item icons ---------------- */

const ICONS: Record<string, string[]> = {
  potion: ['....kk....', '....ww....', '...kccl...', '..cccccc..', '.ccllcccc.', '.cclccccc.', '.cccccccd.', '.ccccccdd.', '..cccddd..', '...dddd...'],
  sword: ['........ll', '.......lcl', '......lcl.', '.....lcl..', '....lcl...', '.g.lcl....', '..gcl.....', '..gg......', '.n..g.....', 'n.........'],
  staff: ['.......oo.', '......oyyo', '......oyyo', '.......oo.', '......n...', '.....n....', '....n.....', '...n......', '..n.......', '.n........'],
  bow: ['....nn....', '...n..w...', '..n...w...', '.n....w...', '.n....wcc.', '.n....w...', '..n...w...', '...n..w...', '....nn....', '..........'],
  dagger: ['..........', '.......ll.', '......lcl.', '.....lcl..', '....lcl...', '..g.cl....', '...gg.....', '..n.g.....', '.n........', '..........'],
  stick: ['........cc', '.......ccd', '......ccd.', '.....ccd..', '....ccd...', '...ccd....', '..ccd.....', '.ccd......', 'ccd.......', 'cd........'],
  armor: ['.cc....cc.', 'cccc..cccc', 'cclccccccc', '.clcccccc.', '.cccyyccc.', '.ccccccccd', '.ccccccccd', '.cccccccdd', '..ccccddd.', '..........'],
  stone: ['..........', '....ll....', '...lccc...', '..lcccccc.', '.lccwccccd', '.ccccccccd', '..cccccdd.', '...ccddd..', '....dd....', '..........'],
  gel: ['..........', '....cc....', '...cccc...', '..clcccc..', '.cclccccc.', '.ccccccccd', '.ccccccccd', '..ccccccd.', '...dddd...', '..........'],
  fang: ['..........', '..cc......', '..ccc.....', '...ccc....', '...cccc...', '....cccc..', '.....cccd.', '......ccd.', '.......dd.', '..........'],
  bone: ['.cc.......', 'cccc......', '.cccc.....', '...ccc....', '....ccc...', '.....ccc..', '......cccc', '.......ccc', '........c.', '..........'],
  core: ['..........', '...oooo...', '..occcco..', '.occyyco..', '.occyycco.', '.occcccco.', '..occccod.', '...oooo...', '..........', '..........'],
  scroll: ['..........', '.nnnnnnnn.', '.cccccccc.', '.ckkkkkkc.', '.cccccccc.', '.ckkkkcc..', '.cccccccc.', '.nnnnnnnn.', '..........', '..........'],
}

const iconCache = new Map<string, string>()
export function itemIconUrl(icon: string, color: string) {
  const key = `${icon}|${color}`
  const hit = iconCache.get(key)
  if (hit) return hit
  const rows = ICONS[icon] ?? ICONS.stone
  const c = renderTemplate(rows, {
    c: color,
    d: shade(color, -0.35),
    l: shade(color, 0.55),
    w: '#f1f1f1',
    k: '#5c3d2e',
    g: '#e9c46a',
    n: '#7f5539',
    o: shade(color, -0.2),
    y: '#fff3b0',
  })
  const url = c.toDataURL()
  iconCache.set(key, url)
  return url
}
