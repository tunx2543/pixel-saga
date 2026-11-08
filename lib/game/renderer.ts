import { ITEMS, JOBS, MONSTERS } from './data'
import { currentMap, game } from './engine'
import { TILE } from './maps'
import { gmOutfitSprite, humanSprite, mapCanvas, monsterSprite, npcSprite } from './sprites'

const THEME_BG: Record<string, string> = {
  town: '#2d5a27',
  meadow: '#2d5a27',
  forest: '#10291a',
  cave: '#0b0b16',
  volcano: '#140808',
}

const MONSTER_ART: Record<string, string> = {
  poring: '/images/monsters/sheets/poring-sheet.png',
  undead: '/images/monsters/sheets/undead-knight-sheet.png',
  demon: '/images/monsters/sheets/abyss-demon-sheet.png',
  demon_lord: '/images/monsters/sheets/abyss-demon-sheet.png',
  gale_sentinel: '/images/monsters/gale-sentinel/south.png',
}
const artCache = new Map<string, HTMLImageElement>()
const transparentArtCache = new Map<string, HTMLCanvasElement>()
const ASSASSIN_ART: Record<string, string> = {
  down: '/images/characters/assassin/south.png',
  up: '/images/characters/assassin/north.png',
  left: '/images/characters/assassin/west.png',
  right: '/images/characters/assassin/east.png',
}
const ASSASSIN_WALK_ART: Record<string, string> = {
  down: '/images/characters/assassin/walk-south.png',
  up: '/images/characters/assassin/walk-north.png',
  left: '/images/characters/assassin/walk-west.png',
  right: '/images/characters/assassin/walk-east.png',
}
const ASSASSIN_ATTACK_ART: Record<string, string> = {
  down: '/images/characters/assassin/attack-south.png',
  'down-right': '/images/characters/assassin/attack-south-east.png',
  right: '/images/characters/assassin/attack-east.png',
  'up-right': '/images/characters/assassin/attack-north-east.png',
  up: '/images/characters/assassin/attack-north.png',
  'up-left': '/images/characters/assassin/attack-north-west.png',
  left: '/images/characters/assassin/attack-west.png',
  'down-left': '/images/characters/assassin/attack-south-west.png',
}

function assassinArt(dir: string, walking = false, attacking = false) {
  const source = attacking ? ASSASSIN_ATTACK_ART : walking ? ASSASSIN_WALK_ART : ASSASSIN_ART
  const fallback = dir.includes('down') ? 'down' : dir.includes('up') ? 'up' : dir.includes('left') ? 'left' : 'right'
  const src = source[dir] ?? source[fallback]
  const cached = artCache.get(src)
  if (cached) return cached.complete ? cached : null
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  artCache.set(src, image)
  return null
}

const ARCHER_ART: Record<string, string> = {
  down: '/images/characters/archer/idle/south.png',
  'down-right': '/images/characters/archer/idle/south-east.png',
  right: '/images/characters/archer/idle/east.png',
  'up-right': '/images/characters/archer/idle/north-east.png',
  up: '/images/characters/archer/idle/north.png',
  'up-left': '/images/characters/archer/idle/north-west.png',
  left: '/images/characters/archer/idle/west.png',
  'down-left': '/images/characters/archer/idle/south-west.png',
}
const ARCHER_WALK_ART = Object.fromEntries(
  Object.entries(ARCHER_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/walk/')]),
)
const ARCHER_ATTACK_ART = Object.fromEntries(
  Object.entries(ARCHER_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/attack/')]),
)

function archerArt(dir: string, walking = false, attacking = false) {
  const source = attacking ? ARCHER_ATTACK_ART : walking ? ARCHER_WALK_ART : ARCHER_ART
  const fallback = dir.includes('down') ? 'down' : dir.includes('up') ? 'up' : dir.includes('left') ? 'left' : 'right'
  const src = source[dir] ?? source[fallback]
  const cached = artCache.get(src)
  if (cached) return cached.complete ? cached : null
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  artCache.set(src, image)
  return null
}

const MAGE_ART = Object.fromEntries(
  Object.entries(ARCHER_ART).map(([direction, src]) => [direction, src.replace('/characters/archer/idle/', '/characters/mage/idle/')]),
)
const MAGE_WALK_ART = Object.fromEntries(
  Object.entries(MAGE_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/walk/')]),
)
const MAGE_ATTACK_ART = Object.fromEntries(
  Object.entries(MAGE_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/attack/')]),
)
const SWORD_ART = Object.fromEntries(
  Object.entries(ARCHER_ART).map(([direction, src]) => [direction, src.replace('/characters/archer/idle/', '/characters/sword/idle/')]),
)
const SWORD_WALK_ART = Object.fromEntries(
  Object.entries(SWORD_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/walk/')]),
)
const SWORD_ATTACK_ART = Object.fromEntries(
  Object.entries(SWORD_ART).map(([direction, src]) => [direction, src.replace('/idle/', '/attack/')]),
)

function professionArt(
  dir: string,
  jobId: string,
  walking = false,
  attacking = false,
) {
  const maps = jobId === 'mage'
    ? [MAGE_ART, MAGE_WALK_ART, MAGE_ATTACK_ART]
    : [SWORD_ART, SWORD_WALK_ART, SWORD_ATTACK_ART]
  const source = attacking ? maps[2] : walking ? maps[1] : maps[0]
  const fallback = dir.includes('down') ? 'down' : dir.includes('up') ? 'up' : dir.includes('left') ? 'left' : 'right'
  const src = source[dir] ?? source[fallback]
  const cached = artCache.get(src)
  if (cached) return cached.complete ? cached : null
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  artCache.set(src, image)
  return null
}

function removeLightBackground(key: string, image: HTMLImageElement | HTMLCanvasElement) {
  const cached = transparentArtCache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const offscreen = canvas.getContext('2d')
  if (!offscreen) return image
  offscreen.drawImage(image, 0, 0)

  const pixels = offscreen.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = pixels
  const isSheet = !key.startsWith('monster:')
  const columns = isSheet ? 4 : 1
  const rows = isSheet ? 4 : 1
  const cellWidth = width / columns
  const cellHeight = height / rows

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left = Math.floor(column * cellWidth)
      const top = Math.floor(row * cellHeight)
      const right = Math.min(width - 1, Math.ceil((column + 1) * cellWidth) - 1)
      const bottom = Math.min(height - 1, Math.ceil((row + 1) * cellHeight) - 1)
      const histogram = new Map<string, { color: [number, number, number]; count: number }>()
      const sample = (x: number, y: number) => {
        const pixel = (y * width + x) * 4
        if (data[pixel + 3] === 0) return
        const color: [number, number, number] = [data[pixel], data[pixel + 1], data[pixel + 2]]
        const bucket = color.map((channel) => Math.round(channel / 8) * 8).join(',')
        const entry = histogram.get(bucket)
        if (entry) entry.count += 1
        else histogram.set(bucket, { color, count: 1 })
      }
      for (let x = left; x <= right; x += 2) {
        sample(x, top)
        sample(x, bottom)
      }
      for (let y = top + 1; y < bottom; y += 2) {
        sample(left, y)
        sample(right, y)
      }
      const backgroundColors = [...histogram.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, isSheet ? 4 : 2)
        .map(({ color }) => color)
      const matchesBackground = (pixel: number) =>
        backgroundColors.some((color) =>
          Math.max(
            Math.abs(data[pixel] - color[0]),
            Math.abs(data[pixel + 1] - color[1]),
            Math.abs(data[pixel + 2] - color[2]),
          ) <= 18,
        )
      const cellW = right - left + 1
      const cellH = bottom - top + 1
      const visited = new Uint8Array(cellW * cellH)
      const queue: Array<[number, number]> = []
      const enqueue = (x: number, y: number) => {
        if (x < left || x > right || y < top || y > bottom) return
        const index = (y - top) * cellW + (x - left)
        if (visited[index]) return
        const pixel = (y * width + x) * 4
        if (data[pixel + 3] === 0 || !matchesBackground(pixel)) return
        visited[index] = 1
        queue.push([x, y])
      }
      for (let x = left; x <= right; x++) {
        enqueue(x, top)
        enqueue(x, bottom)
      }
      for (let y = top + 1; y < bottom; y++) {
        enqueue(left, y)
        enqueue(right, y)
      }
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const [x, y] = queue[cursor]
        data[(y * width + x) * 4 + 3] = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx !== 0 || dy !== 0) enqueue(x + dx, y + dy)
          }
        }
      }
      for (let x = left; x <= right; x++) {
        data[(top * width + x) * 4 + 3] = 0
        data[(bottom * width + x) * 4 + 3] = 0
      }
      for (let y = top; y <= bottom; y++) {
        data[(y * width + left) * 4 + 3] = 0
        data[(y * width + right) * 4 + 3] = 0
      }
    }
  }

  offscreen.putImageData(pixels, 0, 0)
  transparentArtCache.set(key, canvas)
  return canvas
}

const LAVA_BOSS_ART: Record<string, string> = {
  south: '/images/monsters/lava-boss/south.png',
  'south-east': '/images/monsters/lava-boss/south-east.png',
  east: '/images/monsters/lava-boss/east.png',
  'north-east': '/images/monsters/lava-boss/north-east.png',
  north: '/images/monsters/lava-boss/north.png',
  'north-west': '/images/monsters/lava-boss/north-west.png',
  west: '/images/monsters/lava-boss/west.png',
  'south-west': '/images/monsters/lava-boss/south-west.png',
}

function loadArt(src: string) {
  const cached = artCache.get(src)
  if (cached) return cached.complete ? cached : null
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  artCache.set(src, image)
  return null
}

function lavaBossArt(dir: string, walking: boolean) {
  const fallback = dir.includes('down') ? 'south' : dir.includes('up') ? 'north' : dir.includes('left') ? 'west' : 'east'
  const base = LAVA_BOSS_ART[dir] ?? LAVA_BOSS_ART[fallback]
  const src = walking ? base.replace('/lava-boss/', '/lava-boss/walk-') : base
  return loadArt(src)
}

function monsterArt(defId: string, flip = false) {
  const src = defId === 'gale_sentinel'
    ? `/images/monsters/gale-sentinel/${flip ? 'west' : 'east'}.png`
    : MONSTER_ART[defId]
  if (!src) return null
  return loadArt(src)
}

export function render(ctx: CanvasRenderingContext2D, cw: number, ch: number, dpr: number, font: string) {
  const p = game.p
  if (!p) return
  const map = currentMap()
  const t = game.time
  ctx.imageSmoothingEnabled = false

  const cssW = cw / dpr
  // Pull the camera back slightly so mobile players can see more of the map and nearby enemies.
  const zoom = cssW < 700 ? 1.6 : 2.4
  const s = zoom * dpr
  const viewW = cw / s
  const viewH = ch / s
  const mapW = map.width * TILE
  const mapH = map.height * TILE
  let camX = p.x - viewW / 2
  let camY = p.y - 8 - viewH / 2
  camX = mapW <= viewW ? (mapW - viewW) / 2 : Math.max(0, Math.min(mapW - viewW, camX))
  camY = mapH <= viewH ? (mapH - viewH) / 2 : Math.max(0, Math.min(mapH - viewH, camY))
  camX = Math.round(camX * s) / s
  camY = Math.round(camY * s) / s

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = THEME_BG[map.theme]
  ctx.fillRect(0, 0, cw, ch)
  ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s)
  ctx.drawImage(mapCanvas(map), 0, 0)

  if (map.theme === 'volcano') {
    ctx.fillStyle = `rgba(255,120,0,${0.04 + Math.sin(t * 2) * 0.02})`
    ctx.fillRect(0, 0, mapW, mapH)
  }

  for (const pt of map.portals) {
    const cx = (pt.x + pt.w / 2) * TILE
    const cy = (pt.y + pt.h / 2) * TILE
    const pulse = 0.6 + Math.sin(t * 4) * 0.2
    ctx.fillStyle = `rgba(120, 80, 255, ${0.25 * pulse})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, 14, 34, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(150, 230, 255, ${0.5 * pulse})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, 7, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 6; i++) {
      const a = t * 2 + i
      ctx.fillStyle = i % 2 ? '#e0aaff' : '#caf0f8'
      ctx.fillRect(Math.round(cx + Math.cos(a) * 9), Math.round(cy + Math.sin(a * 1.3) * 26), 1, 1)
    }
  }

  if (map.id === 'town') drawFountain(ctx, 20 * TILE, 14 * TILE, t)

  type Ent = { y: number; draw: () => void }
  const ents: Ent[] = []

  for (const n of map.npcs) {
    const fx = n.x * TILE
    const fy = n.y * TILE + 8
    ents.push({
      y: fy,
      draw: () => {
        shadow(ctx, fx, fy, 6)
        const img = npcSprite(n.id) ?? humanSprite(n.colors, 'down', 0)
        const bob = Math.sin(t * 2 + fx) > 0.6 ? 1 : 0
        const scale = npcSprite(n.id) ? 1.15 : 1
        ctx.drawImage(img, Math.round(fx - (img.width * scale) / 2), Math.round(fy - img.height * scale + bob), img.width * scale, img.height * scale)
      },
    })
  }

  for (const m of game.monsters) {
    if (m.dead) continue
    const def = MONSTERS[m.defId]
    ents.push({
      y: m.y,
      draw: () => {
        const frame = Math.floor(m.animT * 3) % 4
        const bossWalking = Math.floor(m.animT * 3) % 2 === 0
        const lavaBoss = def.id === 'demon_lord' ? lavaBossArt(m.flip ? 'west' : 'east', bossWalking) : null
        const asset = lavaBoss ?? monsterArt(m.defId, m.flip)
        const rawImage = asset ?? monsterSprite(def.sprite, def.color, frame)
        const isDirectionalAsset = lavaBoss !== null
        const img = asset && !isDirectionalAsset ? removeLightBackground(`monsterSheet:${m.defId}`, rawImage) : rawImage
        const sourceWidth = asset && !isDirectionalAsset ? img.width / 4 : img.width
        const sourceHeight = asset && !isDirectionalAsset ? img.height / 4 : img.height
        const targetSize = def.boss ? 56 : 30
        const assetScale = asset ? Math.min(1, targetSize / Math.max(sourceWidth, sourceHeight)) : 1
        const scale = (def.boss ? 1.85 : 1.15) * assetScale
        const w = sourceWidth * scale
        const h = sourceHeight * scale
        shadow(ctx, m.x, m.y, 5 * scale)
        const flying = def.sprite === 'bat' || def.sprite === 'ghost'
        const hover = flying ? Math.round(Math.sin(m.animT * 3) * 2) - 4 : 0
        const walkBob = flying ? 0 : Math.round(Math.sin(m.animT * (def.boss ? 5 : 8)) * (def.boss ? 1.4 : 0.8))
        const attackBob = m.lunge > 0 ? (m.flip ? -3 : 3) : 0
        const lunge = m.lunge > 0 ? (m.flip ? -2 : 2) : 0
        const stride = Math.sin(m.animT * (def.boss ? 5 : 9))
        const squash = 1 + stride * (def.boss ? 0.035 : 0.06)
        const stretch = 1 - stride * (def.boss ? 0.035 : 0.06)
        const attackTilt = m.lunge > 0 ? (m.flip ? -0.12 : 0.12) : stride * 0.025
        ctx.save()
        if (m.hitFlash > 0) ctx.globalAlpha = 0.5
        if (def.sprite === 'ghost') ctx.globalAlpha *= 0.8
        ctx.translate(m.x + lunge + attackBob, m.y - h / 2 + hover + walkBob)
        ctx.rotate(attackTilt)
        ctx.scale(m.flip ? -squash : squash, stretch)
        if (asset && !isDirectionalAsset) {
          ctx.drawImage(img, frame * sourceWidth, 0, sourceWidth, sourceHeight, -w / 2, -h / 2, w, h)
        } else {
          ctx.drawImage(img, -w / 2, -h / 2, w, h)
        }
        ctx.restore()
      },
    })
  }

  for (const other of game.remotePlayers) {
    const otherJob = JOBS[other.classId] ?? JOBS.novice
    ents.push({
      y: other.y,
      draw: () => {
        shadow(ctx, other.x, other.y, 6)
        const assassin = other.classId === 'assassin' ? assassinArt('down') : null
        const img = assassin ?? humanSprite(otherJob.colors, 'down', 0)
        ctx.globalAlpha = 0.92
        ctx.drawImage(img, Math.round(other.x - img.width / 2), Math.round(other.y - img.height))
        ctx.globalAlpha = 1
      },
    })
  }

  for (const other of game.remotePlayers) {
    if (other.mapId !== map.id) continue
    const remoteJob = JOBS[other.jobId] ?? JOBS.novice
    const remoteFrame = other.moving ? Math.floor(t * 8) % 4 : 0
    const remoteAnimation = other.attackAnim > 0 ? 'attack' : other.moving ? 'walk' : 'idle'
    const remoteImg = (other.gm ? gmOutfitSprite(other.facing, remoteAnimation) : null)
      ?? professionArt(other.facing, other.jobId, other.moving, other.attackAnim > 0)
      ?? humanSprite(remoteJob.colors, other.facing, remoteFrame)
    ents.push({
      y: other.y,
      draw: () => {
        shadow(ctx, other.x, other.y, 6)
        if (other.gm) {
          ctx.fillStyle = `rgba(255, 214, 10, ${0.18 + Math.sin(t * 5) * 0.08})`
          ctx.beginPath()
          ctx.ellipse(other.x, other.y, 10, 4, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.drawImage(remoteImg, Math.round(other.x - remoteImg.width / 2), Math.round(other.y - remoteImg.height))
      },
    })
  }

  const job = JOBS[p.jobId]
  const weapon = p.equipment.weapon ? ITEMS[p.equipment.weapon.itemId] : null
  ents.push({
    y: p.y,
    draw: () => {
      shadow(ctx, p.x, p.y, 6)
      const frame = game.moving ? Math.floor(game.walkT * 8) % 4 : 0
      const walkingPose = game.moving && frame % 2 === 0
const animation = game.attackAnim > 0 ? 'attack' : game.moving ? 'walk' : 'idle'
    const customArt = p.gm ? gmOutfitSprite(game.facing, animation) : null
  const img = customArt ?? humanSprite(job.colors, game.facing, frame, weapon?.weaponType ?? null, weapon?.color)
      let ox = 0
      let oy = 0
      if (game.attackAnim > 0) {
        const k = 2
        if (game.facing === 'left') ox = -k
        else if (game.facing === 'right') ox = k
        else if (game.facing === 'up') oy = -k
        else oy = k
      }
      const bob = game.moving && frame % 2 === 1 ? -1 : 0
      ctx.globalAlpha = p.invisible ? 0.18 : 1
      if (p.gm) {
        ctx.fillStyle = `rgba(255, 214, 10, ${0.18 + Math.sin(t * 5) * 0.08})`
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, 10, 4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if ((p.rebirthCount ?? 0) > 0) {
        ctx.save()
        const rebirthTier = Math.min(6, p.rebirthCount ?? 1)
        const pulse = 0.55 + Math.sin(t * (7 + rebirthTier)) * 0.2
        const colors = ['#b9f6ff', '#8fe9ff', '#72c7ff', '#a78bfa', '#f0abfc', '#ffe08a']
        ctx.globalAlpha = pulse
        ctx.strokeStyle = colors[rebirthTier - 1]
        ctx.shadowColor = colors[rebirthTier - 1]
        ctx.shadowBlur = 7 + rebirthTier * 2
        ctx.lineWidth = 1.2 + rebirthTier * 0.18
        for (let bolt = 0; bolt < 2 + rebirthTier; bolt++) {
          const angle = t * (1.2 + rebirthTier * 0.18) + bolt * (Math.PI * 2 / (2 + rebirthTier))
          const startX = p.x + Math.cos(angle) * 8
          const startY = p.y - 15 + Math.sin(angle) * 4
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          for (let step = 1; step <= 4; step++) {
            const distance = step * 4
            ctx.lineTo(startX + Math.cos(angle) * distance + Math.sin(t * 10 + step + bolt) * 2, startY + Math.sin(angle) * distance + (step % 2 ? -2 : 2))
          }
          ctx.stroke()
        }
        ctx.restore()
      }
      ctx.drawImage(img, Math.round(p.x - img.width / 2 + ox), Math.round(p.y - img.height + bob + oy))
      ctx.globalAlpha = 1
    },
  })

  ents.sort((a, b) => a.y - b.y)
  for (const e of ents) e.draw()

  for (const pr of game.projectiles) {
    if (pr.delay > 0) continue
    ctx.fillStyle = pr.color
    ctx.globalAlpha = 0.4
    ctx.fillRect(Math.round(pr.x - pr.size), Math.round(pr.y - pr.size), pr.size * 2 + 1, pr.size * 2 + 1)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(Math.round(pr.x), Math.round(pr.y), 1 + Math.floor(pr.size / 2), 1 + Math.floor(pr.size / 2))
  }

  for (const e of game.effects) {
    const k = 1 - e.life / e.max
    ctx.save()
    ctx.globalAlpha = Math.max(0, e.life / e.max)
    ctx.strokeStyle = e.color
    ctx.fillStyle = e.color
    if (e.type === 'slash') {
      ctx.lineWidth = 2
      ctx.beginPath()
      const a = e.angle ?? 0
      ctx.arc(e.x, e.y, e.r * (0.6 + k * 0.4), a, a + Math.PI * 0.9)
      ctx.stroke()
    } else if (e.type === 'ring') {
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r * (0.3 + k * 0.7), 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha *= 0.2
      ctx.fill()
    } else if (e.type === 'burst') {
      ctx.globalAlpha *= 0.45
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r * (0.4 + k * 0.6), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = Math.max(0, e.life / e.max)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        ctx.fillRect(Math.round(e.x + Math.cos(a) * e.r * k), Math.round(e.y + Math.sin(a) * e.r * k), 2, 2)
      }
    } else if (e.type === 'spark') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.fillRect(Math.round(e.x + Math.cos(a) * e.r * k), Math.round(e.y + Math.sin(a) * e.r * k), 1, 1)
      }
    } else if (e.type === 'levelup') {
      ctx.globalAlpha *= 0.35
      ctx.fillRect(e.x - 8, e.y - 40 * (0.3 + k), 16, 40 * (0.3 + k))
      ctx.globalAlpha = Math.max(0, e.life / e.max)
      for (let i = 0; i < 12; i++) {
        const px = e.x + Math.sin(i * 2.3) * 12
        const py = e.y - ((k * 50 + i * 7) % 50)
        ctx.fillRect(Math.round(px), Math.round(py), 1, 2)
      }
    }
    ctx.restore()
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)

  if (map.theme === 'cave' || map.theme === 'forest' || map.theme === 'volcano') {
    const sx = (p.x - camX) * s
    const sy = (p.y - 8 - camY) * s
    const inner = (map.theme === 'cave' ? 50 : 110) * s
    const outer = (map.theme === 'cave' ? 150 : 260) * s
    const g = ctx.createRadialGradient(sx, sy, inner, sx, sy, outer)
    const dark = map.theme === 'cave' ? 'rgba(3,3,12,0.88)' : map.theme === 'forest' ? 'rgba(5,20,10,0.45)' : 'rgba(30,0,0,0.5)'
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, dark)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cw, ch)
  }

  const toS = (wx: number, wy: number) => [(wx - camX) * s, (wy - camY) * s] as const
  const text = (str: string, x: number, y: number, color: string, size = 10, align: CanvasTextAlign = 'center') => {
    ctx.font = `${Math.round(size * dpr * (zoom / 3) * 1.2)}px ${font}`
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 3 * dpr
    ctx.strokeStyle = 'rgba(10,8,20,0.9)'
    ctx.lineJoin = 'round'
    ctx.strokeText(str, x, y)
    ctx.fillStyle = color
    ctx.fillText(str, x, y)
  }

  for (const pt of map.portals) {
    const [x, y] = toS((pt.x + pt.w / 2) * TILE + (pt.x === 0 ? 14 : -14), (pt.y - 0.3) * TILE)
    text(pt.label, x, y, '#caf0f8', 9)
  }

  for (const n of map.npcs) {
    const [x, y] = toS(n.x * TILE, n.y * TILE + 8 - 22)
    text(`[${n.title}]`, x, y - 13 * dpr, '#f2c94c', 9)
    text(n.name, x, y, '#ffffff', 10)
    if (game.nearNpc?.id === n.id && !game.panel) {
      const [bx, by] = toS(n.x * TILE, n.y * TILE + 14)
      text('กด E เพื่อคุย', bx, by + 8 * dpr, '#7ae582', 9)
    }
  }

  for (const m of game.monsters) {
    if (m.dead) continue
    const def = MONSTERS[m.defId]
    const h = (def.boss ? 28 : 16) + (def.sprite === 'bat' || def.sprite === 'ghost' ? 4 : 0)
    const [x, y] = toS(m.x, m.y - h)
    const color = def.boss ? '#ff6b6b' : def.level > p.level + 5 ? '#ff8fa3' : def.level < p.level - 5 ? '#a0a0a0' : '#ffffff'
    text(`${def.boss ? '★ ' : ''}${def.name} Lv.${def.level}`, x, y - 8 * dpr, color, def.boss ? 10 : 8)
    if (m.hp < m.maxHp || def.boss) {
      const bw = (def.boss ? 40 : 18) * s
      const bh = 2 * s
      ctx.fillStyle = 'rgba(10,8,20,0.9)'
      ctx.fillRect(x - bw / 2 - dpr, y - dpr, bw + 2 * dpr, bh + 2 * dpr)
      ctx.fillStyle = '#3a0d12'
      ctx.fillRect(x - bw / 2, y, bw, bh)
      ctx.fillStyle = '#e5484d'
      ctx.fillRect(x - bw / 2, y, bw * Math.max(0, m.hp / m.maxHp), bh)
    }
  }

  for (const other of game.remotePlayers) {
    if (other.mapId !== map.id) continue
    const [x, y] = toS(other.x, other.y - 24)
    if (other.gm) text('[GM]', x, y - 12 * dpr, '#ffd60a', 8)
    text(`${other.displayName} [${String(other.uid).padStart(5, '0')}] Lv.${other.level}`, x, y, other.gm ? '#ffd60a' : '#8be9fd', 9)
  }

  {
    const [x, y] = toS(p.x, p.y - 24)
    text(`${p.name} [${String(p.uid ?? 1).padStart(5, '0')}]`, x, y, p.gm ? '#ffd60a' : '#ffffff', 10)
    if (p.gm) text('[GM]', x, y - 12 * dpr, '#ffd60a', 8)
    if (game.bubble) {
      ctx.font = `${Math.round(11 * dpr * (zoom / 3) * 1.2)}px ${font}`
      const tw = Math.min(ctx.measureText(game.bubble.text).width, 260 * dpr)
      const by = y - (p.gm ? 34 : 24) * dpr
      ctx.fillStyle = 'rgba(255,250,235,0.95)'
      ctx.fillRect(x - tw / 2 - 6 * dpr, by - 10 * dpr, tw + 12 * dpr, 20 * dpr)
      ctx.fillStyle = 'rgba(10,8,20,0.9)'
      ctx.fillRect(x - 2 * dpr, by + 10 * dpr, 4 * dpr, 3 * dpr)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#1a1423'
      ctx.fillText(game.bubble.text, x, by, 260 * dpr)
    }
  }

  for (const f of game.floats) {
    const [x, y] = toS(f.x, f.y)
    ctx.globalAlpha = Math.min(1, f.life / f.max + 0.2)
    text(f.text, x, y, f.color, f.size)
    ctx.globalAlpha = 1
  }
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawFountain(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  ctx.fillStyle = '#7d7a72'
  ctx.beginPath()
  ctx.ellipse(cx, cy, 17, 13, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#a19d92'
  ctx.beginPath()
  ctx.ellipse(cx, cy - 1, 16, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3a7bd5'
  ctx.beginPath()
  ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(170, 215, 255, 0.7)'
  ctx.lineWidth = 1
  const r = (t * 6) % 10
  ctx.beginPath()
  ctx.ellipse(cx, cy, 3 + r, 2 + r * 0.7, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#8f8a80'
  ctx.fillRect(cx - 2, cy - 12, 4, 12)
  ctx.fillStyle = '#c4bfb4'
  ctx.fillRect(cx - 4, cy - 13, 8, 2)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t
    const k = (t * 1.5 + i * 0.13) % 1
    ctx.fillStyle = i % 2 ? '#caf0f8' : '#90e0ef'
    ctx.fillRect(Math.round(cx + Math.cos(a) * 8 * k), Math.round(cy - 14 + k * k * 12 - Math.sin(k * Math.PI) * 6), 1, 1)
  }
}
