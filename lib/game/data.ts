export type WeaponType = 'stick' | 'sword' | 'staff' | 'bow' | 'dagger'

export type SkillKind = 'single' | 'aoe-self' | 'aoe-target' | 'multi'

export interface SkillDef {
  id: string
  name: string
  mp: number
  mult: number
  cooldown: number
  kind: SkillKind
  radius?: number
  hits?: number
  color: string
}

export interface JobDef {
  id: string
  name: string
  tier: 0 | 1 | 2
  from: string | null
  reqLevel: number
  cost: number
  description: string
  hpMul: number
  mpMul: number
  atkMul: number
  defMul: number
  speedMul: number
  attackSpeed: number
  crit: number
  range: number
  ranged: boolean
  weaponTypes: WeaponType[]
  colors: { hair: string; body: string; legs: string; accent: string }
  skills: SkillDef[]
}

export const JOBS: Record<string, JobDef> = {
  novice: {
    id: 'novice',
    name: 'ผู้ฝึกหัด',
    tier: 0,
    from: null,
    reqLevel: 1,
    cost: 0,
    description: 'นักผจญภัยมือใหม่ พร้อมเรียนรู้ทุกสิ่ง',
    hpMul: 1,
    mpMul: 1,
    atkMul: 1,
    defMul: 1,
    speedMul: 1,
    attackSpeed: 0.7,
    crit: 0.05,
    range: 22,
    ranged: false,
    weaponTypes: ['stick'],
    colors: { hair: '#6b4226', body: '#8a9a5b', legs: '#5a4632', accent: '#c9b27c' },
    skills: [{ id: 'power', name: 'ฟาดแรง', mp: 5, mult: 1.7, cooldown: 2, kind: 'single', color: '#ffe08a' }],
  },
  swordsman: {
    id: 'swordsman',
    name: 'นักดาบ',
    tier: 1,
    from: 'novice',
    reqLevel: 10,
    cost: 500,
    description: 'นักสู้ระยะประชิด พลังชีวิตและพลังป้องกันสูง',
    hpMul: 1.45,
    mpMul: 0.8,
    atkMul: 1.25,
    defMul: 1.35,
    speedMul: 1,
    attackSpeed: 0.6,
    crit: 0.08,
    range: 24,
    ranged: false,
    weaponTypes: ['sword'],
    colors: { hair: '#3b2a1a', body: '#4a6fa5', legs: '#2f3b52', accent: '#c0c7d1' },
    skills: [
      { id: 'bash', name: 'ฟันกระแทก', mp: 8, mult: 2.3, cooldown: 2, kind: 'single', color: '#ffd166' },
      { id: 'whirl', name: 'ดาบพายุหมุน', mp: 16, mult: 1.6, cooldown: 5, kind: 'aoe-self', radius: 44, color: '#a8dadc' },
    ],
  },
  mage: {
    id: 'mage',
    name: 'นักเวท',
    tier: 1,
    from: 'novice',
    reqLevel: 10,
    cost: 500,
    description: 'ผู้ใช้เวทมนตร์ระยะไกล พลังโจมตีรุนแรง',
    hpMul: 0.85,
    mpMul: 1.9,
    atkMul: 1.5,
    defMul: 0.75,
    speedMul: 1,
    attackSpeed: 0.85,
    crit: 0.05,
    range: 96,
    ranged: true,
    weaponTypes: ['staff'],
    colors: { hair: '#d9d9d9', body: '#5b3f8c', legs: '#3a2a5c', accent: '#f4d35e' },
    skills: [
      { id: 'firebolt', name: 'ลูกไฟ', mp: 10, mult: 2.6, cooldown: 1.5, kind: 'single', color: '#ff7b39' },
      { id: 'meteor', name: 'อุกกาบาต', mp: 26, mult: 2.1, cooldown: 6, kind: 'aoe-target', radius: 52, color: '#ff4d2e' },
    ],
  },
  archer: {
    id: 'archer',
    name: 'นักธนู',
    tier: 1,
    from: 'novice',
    reqLevel: 10,
    cost: 500,
    description: 'นักแม่นธนู โจมตีไกลและรวดเร็ว',
    hpMul: 1,
    mpMul: 1,
    atkMul: 1.3,
    defMul: 0.9,
    speedMul: 1.1,
    attackSpeed: 0.55,
    crit: 0.12,
    range: 112,
    ranged: true,
    weaponTypes: ['bow'],
    colors: { hair: '#c58b3f', body: '#3f7d4e', legs: '#4b3b2a', accent: '#e9c46a' },
    skills: [
      { id: 'double', name: 'ยิงคู่', mp: 9, mult: 1.3, cooldown: 1.8, kind: 'multi', hits: 2, color: '#e9f5db' },
      { id: 'rain', name: 'ฝนธนู', mp: 22, mult: 1.7, cooldown: 6, kind: 'aoe-target', radius: 48, color: '#b7e4c7' },
    ],
  },
  thief: {
    id: 'thief',
    name: 'โจร',
    tier: 1,
    from: 'novice',
    reqLevel: 10,
    cost: 500,
    description: 'ว่องไว คริติคอลสูง เคลื่อนที่เร็ว',
    hpMul: 1.1,
    mpMul: 0.9,
    atkMul: 1.2,
    defMul: 0.95,
    speedMul: 1.3,
    attackSpeed: 0.4,
    crit: 0.25,
    range: 22,
    ranged: false,
    weaponTypes: ['dagger'],
    colors: { hair: '#1f1f1f', body: '#3d3d4f', legs: '#262633', accent: '#b23a48' },
    skills: [
      { id: 'dblatk', name: 'แทงสองครั้ง', mp: 7, mult: 1.2, cooldown: 1.4, kind: 'multi', hits: 2, color: '#e5e5e5' },
      { id: 'backstab', name: 'แทงข้างหลัง', mp: 18, mult: 3.4, cooldown: 4.5, kind: 'single', color: '#ff4d6d' },
    ],
  },
  knight: {
    id: 'knight',
    name: 'อัศวิน',
    tier: 2,
    from: 'swordsman',
    reqLevel: 30,
    cost: 10000,
    description: 'นักรบผู้แข็งแกร่งที่สุด ป้องกันสูงสุด',
    hpMul: 2,
    mpMul: 1,
    atkMul: 1.6,
    defMul: 1.9,
    speedMul: 1.05,
    attackSpeed: 0.55,
    crit: 0.1,
    range: 26,
    ranged: false,
    weaponTypes: ['sword'],
    colors: { hair: '#d4a017', body: '#9aa5b1', legs: '#3c4858', accent: '#e63946' },
    skills: [
      { id: 'bash', name: 'ฟันกระแทก', mp: 8, mult: 2.6, cooldown: 1.8, kind: 'single', color: '#ffd166' },
      { id: 'whirl', name: 'ดาบพายุหมุน', mp: 16, mult: 2, cooldown: 4, kind: 'aoe-self', radius: 52, color: '#a8dadc' },
      { id: 'holy', name: 'ดาบศักดิ์สิทธิ์', mp: 40, mult: 4.5, cooldown: 8, kind: 'aoe-target', radius: 40, color: '#fff3b0' },
    ],
  },
  wizard: {
    id: 'wizard',
    name: 'จอมเวท',
    tier: 2,
    from: 'mage',
    reqLevel: 30,
    cost: 10000,
    description: 'ผู้กุมเวทมนตร์ขั้นสูง ทำลายล้างเป็นวงกว้าง',
    hpMul: 1.05,
    mpMul: 2.6,
    atkMul: 2,
    defMul: 0.9,
    speedMul: 1.05,
    attackSpeed: 0.75,
    crit: 0.07,
    range: 110,
    ranged: true,
    weaponTypes: ['staff'],
    colors: { hair: '#f1f1f1', body: '#1d3557', legs: '#14213d', accent: '#8ecae6' },
    skills: [
      { id: 'firebolt', name: 'ลูกไฟ', mp: 10, mult: 3, cooldown: 1.2, kind: 'single', color: '#ff7b39' },
      { id: 'meteor', name: 'อุกกาบาต', mp: 26, mult: 2.6, cooldown: 5, kind: 'aoe-target', radius: 60, color: '#ff4d2e' },
      { id: 'blizzard', name: 'พายุหิมะ', mp: 50, mult: 3.2, cooldown: 9, kind: 'aoe-self', radius: 90, color: '#bde0fe' },
    ],
  },
  hunter: {
    id: 'hunter',
    name: 'พรานล่า',
    tier: 2,
    from: 'archer',
    reqLevel: 30,
    cost: 10000,
    description: 'นักล่าผู้เชี่ยวชาญ ยิงแม่นยำไร้ที่ติ',
    hpMul: 1.3,
    mpMul: 1.3,
    atkMul: 1.75,
    defMul: 1.1,
    speedMul: 1.2,
    attackSpeed: 0.45,
    crit: 0.18,
    range: 128,
    ranged: true,
    weaponTypes: ['bow'],
    colors: { hair: '#8d5524', body: '#2d6a4f', legs: '#40291a', accent: '#ffb703' },
    skills: [
      { id: 'double', name: 'ยิงสามดอก', mp: 10, mult: 1.3, cooldown: 1.6, kind: 'multi', hits: 3, color: '#e9f5db' },
      { id: 'rain', name: 'ฝนธนู', mp: 22, mult: 2.1, cooldown: 5, kind: 'aoe-target', radius: 56, color: '#b7e4c7' },
      { id: 'sniper', name: 'ยิงทะลวง', mp: 40, mult: 5.5, cooldown: 8, kind: 'single', color: '#ffd60a' },
    ],
  },
  gm: {
    id: 'gm',
    name: 'ผู้ดูแลระบบ',
    tier: 2,
    from: null,
    reqLevel: 1,
    cost: 0,
    description: 'ตัวละครเฉพาะ GM พร้อมพลังและสกิลพิเศษ',
    hpMul: 100,
    mpMul: 100,
    atkMul: 100,
    defMul: 100,
    speedMul: 1.5,
    attackSpeed: 0.12,
    crit: 1,
    range: 140,
    ranged: true,
    weaponTypes: ['staff'],
    colors: { hair: '#fff7b2', body: '#f8c537', legs: '#8a5a00', accent: '#fff3b0', skin: '#ffd8a8', hat: '#f2b705' },
    skills: [],
  },
  assassin: {
    id: 'assassin',
    name: 'นักฆ่า',
    tier: 2,
    from: 'thief',
    reqLevel: 30,
    cost: 10000,
    description: 'เงาแห่งความตาย คริติคอลรุนแรงที่สุด',
    hpMul: 1.4,
    mpMul: 1.1,
    atkMul: 1.65,
    defMul: 1.1,
    speedMul: 1.45,
    attackSpeed: 0.32,
    crit: 0.35,
    range: 24,
    ranged: false,
    weaponTypes: ['dagger'],
    colors: { hair: '#6a040f', body: '#1b1b2f', legs: '#111122', accent: '#9d4edd' },
    skills: [
      { id: 'dblatk', name: 'แทงสามครั้ง', mp: 8, mult: 1.2, cooldown: 1.2, kind: 'multi', hits: 3, color: '#e5e5e5' },
      { id: 'backstab', name: 'แทงข้างหลัง', mp: 18, mult: 4, cooldown: 4, kind: 'single', color: '#ff4d6d' },
      { id: 'shadow', name: 'เงาสังหาร', mp: 45, mult: 3, cooldown: 8, kind: 'aoe-self', radius: 60, color: '#9d4edd' },
    ],
  },
}

export type ItemKind = 'consumable' | 'weapon' | 'armor' | 'material'
export type EquipmentSlot = 'weapon' | 'armor' | 'shoes' | 'cloak' | 'accessory'

export interface ItemDef {
  id: string
  name: string
  kind: ItemKind
  price: number
  icon: string
  color: string
  description: string
  heal?: number
  mana?: number
  atk?: number
  def?: number
  weaponType?: WeaponType
  reqLevel?: number
  tier?: number
  asset?: string
  effect?: boolean
  gmOnly?: boolean
  slot?: EquipmentSlot
}

const weapon = (
  id: string,
  name: string,
  weaponType: WeaponType,
  atk: number,
  price: number,
  tier: number,
  reqLevel: number,
  color: string,
): ItemDef => ({
  id,
  name,
  kind: 'weapon',
  weaponType,
  atk,
  price,
  tier,
  reqLevel,
  icon: weaponType,
  color,
  description: `อาวุธ (${weaponType}) พลังโจมตี +${atk}`,
})

const armor = (id: string, name: string, def: number, price: number, tier: number, reqLevel: number, color: string): ItemDef => ({
  id,
  name,
  kind: 'armor',
  slot: 'armor',
  def,
  price,
  tier,
  reqLevel,
  icon: 'armor',
  color,
  description: `ชุดเกราะ พลังป้องกัน +${def}`,
})

const CATALOG_NAMES = ['รัตติกาล', 'เพลิงฟ้า', 'เขี้ยวจันทรา', 'ผ่าอเวจี', 'เงาพราย', 'ดาวตก', 'โลหิตแดง', 'วายุเงิน', 'พิทักษ์เถ้า', 'ราชันย์ผลึก']
const CATALOG_ASSETS = [
  ...Array.from({ length: 25 }, (_, i) => `assassin${i ? `_${i + 1}` : ''}.png`),
  ...Array.from({ length: 25 }, (_, i) => `pix${i ? `_${i + 1}` : ''}.png`),
  'pixellab-object-03b36157.png',
  'pixellab-object-1f1f412f.png',
  'pixellab-object-5a4d691b.png',
  'pixellab-object-705a0bad.png',
]

const VISUAL_CLASSIFICATION: Record<string, 'dagger' | 'staff' | 'sword' | 'bow'> = {
  'assassin.png': 'staff',
  'assassin_2.png': 'bow',
  'assassin_3.png': 'sword',
  'assassin_4.png': 'sword',
  'assassin_5.png': 'dagger',
  'assassin_6.png': 'dagger',
  'assassin_7.png': 'dagger',
  'assassin_8.png': 'sword',
  'assassin_15.png': 'dagger',
  'assassin_25.png': 'sword',
  'pix.png': 'sword',
  'pix_5.png': 'staff',
  'pix_15.png': 'staff',
  'pix_25.png': 'dagger',
  'pixellab-object-03b36157.png': 'staff',
}

const MAGE_NAMED_ITEMS = new Set(['ราชันผลึก', 'พิทักษ์เถ้า', 'เขี้ยวจันทรา', 'ผ่าอเวจี'])

const catalogItems = Object.fromEntries(CATALOG_ASSETS.map((asset, index) => {
  const baseName = CATALOG_NAMES[index % CATALOG_NAMES.length]
  const isEffect = index >= 50
  const forcedMage = MAGE_NAMED_ITEMS.has(baseName)
  const weaponType = forcedMage ? 'staff' : VISUAL_CLASSIFICATION[asset] ?? (isEffect ? 'staff' : 'sword')
  const weaponLabel = weaponType === 'dagger' ? 'มีด Assassin' : weaponType === 'staff' ? 'คฑา Mage' : weaponType === 'bow' ? 'ธนู Archer' : 'ดาบ Swordsman'
  const tier = isEffect ? 4 : index % 3 + 1
  const atk = 18 + tier * 16 + (index % 5) * 3
  const id = `catalog_${asset.replace('.png', '').replaceAll('-', '_')}`
  const name = `${baseName} ${isEffect ? 'อุปกรณ์อาคม' : weaponLabel} ${String(index + 1).padStart(2, '0')}`
  const item: ItemDef = {
    id,
    name,
    kind: isEffect ? 'armor' : 'weapon',
    slot: isEffect ? (['armor', 'shoes', 'cloak', 'accessory'][index % 4] as EquipmentSlot) : 'weapon',
    weaponType: isEffect ? undefined : weaponType,
    atk: isEffect ? undefined : atk,
    def: isEffect ? 20 + tier * 10 : undefined,
    price: 900 * tier,
    tier,
    reqLevel: tier * 10,
    icon: isEffect ? 'armor' : weaponType,
    asset: `/images/items/catalog/${asset}`,
    effect: isEffect,
    color: isEffect ? '#c084fc' : weaponType === 'dagger' ? '#d00000' : weaponType === 'staff' ? '#8b5cf6' : weaponType === 'bow' ? '#16a34a' : '#f59e0b',
    description: `${isEffect ? 'อุปกรณ์อาคมจากบอส' : `อาวุธสำหรับ ${weaponLabel}`} | ไฟล์: ${asset} | ${isEffect ? `ป้องกัน +${20 + tier * 10}` : `โจมตี +${atk}`}`,
  }
  return [id, item]
})) as Record<string, ItemDef>

const BASE_ITEMS: Record<string, ItemDef> = {
  ...catalogItems,
  red_potion: { id: 'red_potion', name: 'ยาแดง', kind: 'consumable', price: 30, heal: 60, icon: 'potion', color: '#e63946', description: 'ฟื้นฟู HP 60' },
  orange_potion: { id: 'orange_potion', name: 'ยาส้ม', kind: 'consumable', price: 120, heal: 220, icon: 'potion', color: '#f4a261', description: 'ฟื้นฟู HP 220' },
  white_potion: { id: 'white_potion', name: 'ยาขาว', kind: 'consumable', price: 400, heal: 700, icon: 'potion', color: '#f1faee', description: 'ฟื้นฟู HP 700' },
  blue_potion: { id: 'blue_potion', name: 'ยาฟ้า', kind: 'consumable', price: 60, mana: 50, icon: 'potion', color: '#4895ef', description: 'ฟื้นฟู MP 50' },
  purple_potion: { id: 'purple_potion', name: 'ยาม่วง', kind: 'consumable', price: 280, mana: 200, icon: 'potion', color: '#9d4edd', description: 'ฟื้นฟู MP 200' },
  return_scroll: { id: 'return_scroll', name: 'ม้วนคัมภีร์กลับเมือง', kind: 'consumable', price: 50, icon: 'scroll', color: '#f4d35e', description: 'วาร์ปกลับเมืองทันที' },
  enhance_stone: { id: 'enhance_stone', name: 'หินตีบวก', kind: 'material', price: 500, icon: 'stone', color: '#4cc9f0', description: 'ใช้ตีบวกอุปกรณ์ที่ช่างตีบวก' },
  slime_gel: { id: 'slime_gel', name: 'เจลสไลม์', kind: 'material', price: 8, icon: 'gel', color: '#80ed99', description: 'ของดรอปจากสไลม์ ขายได้' },
  mushroom_cap: { id: 'mushroom_cap', name: 'หมวกเห็ด', kind: 'material', price: 15, icon: 'gel', color: '#e76f51', description: 'ของดรอปจากเห็ด ขายได้' },
  wolf_fang: { id: 'wolf_fang', name: 'เขี้ยวหมาป่า', kind: 'material', price: 45, icon: 'fang', color: '#f1faee', description: 'ของดรอปจากหมาป่า ขายได้' },
  goblin_ear: { id: 'goblin_ear', name: 'หูก๊อบลิน', kind: 'material', price: 60, icon: 'fang', color: '#90be6d', description: 'ของดรอปจากก๊อบลิน ขายได้' },
  bone: { id: 'bone', name: 'กระดูก', kind: 'material', price: 90, icon: 'bone', color: '#e9e3d5', description: 'ของดรอปจากโครงกระดูก ขายได้' },
  ectoplasm: { id: 'ectoplasm', name: 'วิญญาณหลอน', kind: 'material', price: 130, icon: 'gel', color: '#caf0f8', description: 'ของดรอปจากผี ขายได้' },
  ember_core: { id: 'ember_core', name: 'แกนเพลิง', kind: 'material', price: 220, icon: 'core', color: '#ff6b35', description: 'ของดรอปจากภูเขาไฟ ขายได้' },
  demon_horn: { id: 'demon_horn', name: 'เขาปีศาจ', kind: 'material', price: 350, icon: 'fang', color: '#9d0208', description: 'ของดรอปจากปีศาจ ขายได้' },

  wooden_stick: weapon('wooden_stick', 'ไม้พลอง', 'stick', 6, 50, 1, 1, '#a47148'),
  oak_club: weapon('oak_club', 'กระบองโอ๊ค', 'stick', 14, 400, 2, 5, '#7f5539'),

  short_sword: weapon('short_sword', 'ดาบสั้น', 'sword', 16, 400, 1, 10, '#adb5bd'),
  steel_sword: weapon('steel_sword', 'ดาบเหล็กกล้า', 'sword', 36, 2500, 2, 15, '#dee2e6'),
  knight_blade: weapon('knight_blade', 'ดาบอัศวิน', 'sword', 72, 9000, 3, 25, '#90e0ef'),
  flame_sword: weapon('flame_sword', 'ดาบเพลิงนรก', 'sword', 125, 25000, 4, 38, '#ff6b35'),

  wood_staff: weapon('wood_staff', 'คทาไม้', 'staff', 15, 400, 1, 10, '#b08968'),
  oak_staff: weapon('oak_staff', 'คทาโอ๊ค', 'staff', 34, 2500, 2, 15, '#9c6644'),
  crystal_staff: weapon('crystal_staff', 'คทาคริสตัล', 'staff', 68, 9000, 3, 25, '#a2d2ff'),
  inferno_staff: weapon('inferno_staff', 'คทาอัคคี', 'staff', 120, 25000, 4, 38, '#e85d04'),
  gm_golden_staff: { id: 'gm_golden_staff', name: 'คฑาทองคำ GM', kind: 'weapon', weaponType: 'staff', atk: 9999999, price: 0, tier: 99, reqLevel: 1, icon: 'staff', color: '#ffd700', description: 'อาวุธเฉพาะ GM — ความเสียหาย 9,999,999' },

  short_bow: weapon('short_bow', 'ธนูสั้น', 'bow', 15, 400, 1, 10, '#bc6c25'),
  long_bow: weapon('long_bow', 'ธนูยาว', 'bow', 35, 2500, 2, 15, '#99582a'),
  hunter_bow: weapon('hunter_bow', 'ธนูพราน', 'bow', 69, 9000, 3, 25, '#606c38'),
  phoenix_bow: weapon('phoenix_bow', 'ธนูฟีนิกซ์', 'bow', 122, 25000, 4, 38, '#f48c06'),

  knife: weapon('knife', 'มีดสั้น', 'dagger', 14, 400, 1, 10, '#ced4da'),
  kris: weapon('kris', 'กริช', 'dagger', 32, 2500, 2, 15, '#e9c46a'),
  shadow_dagger: weapon('shadow_dagger', 'มีดเงา', 'dagger', 64, 9000, 3, 25, '#7b2cbf'),
  demon_fang: weapon('demon_fang', 'เขี้ยวปีศาจ', 'dagger', 115, 25000, 4, 38, '#d00000'),
  abyss_crystal: { id: 'abyss_crystal', name: 'ผลึกอเวจี', kind: 'material', price: 1800, icon: 'core', color: '#8b5cf6', description: 'ผลึกหายากจากดันเจี้ยนห้วงอเวจี', tier: 5 },

  cloth_armor: armor('cloth_armor', 'ชุดผ้า', 5, 100, 1, 1, '#d4a373'),
  leather_armor: armor('leather_armor', 'เกราะหนัง', 15, 1200, 2, 10, '#8b5e34'),
  chain_mail: armor('chain_mail', 'เกราะโซ่', 34, 8000, 3, 22, '#adb5bd'),
  dragon_armor: armor('dragon_armor', 'เกราะมังกร', 70, 24000, 4, 36, '#c1121f'),
}

const IMAGE_READY_BASE_ITEMS: Record<string, ItemDef> = Object.fromEntries(
  Object.entries(BASE_ITEMS).map(([id, item], index) => [
    id,
    item.asset ? item : { ...item, asset: `/images/items/catalog/${CATALOG_ASSETS[index % CATALOG_ASSETS.length]}` },
  ]),
)

const GM_NAME_PREFIXES = ['อัสนี', 'เงาจันทร์', 'เพลิงคราม', 'วายุเงิน', 'ดาราทอง', 'รัตติกาล', 'สุริยคราส', 'มายาพิภพ']
const GM_NAME_SUFFIXES = ['คมดาบ', 'แกนพลัง', 'เขี้ยวอสูร', 'ตราผนึก', 'เศษดาว', 'หัวใจเวท', 'เกล็ดมังกร', 'มงกุฎนิรันดร์']
const GM_NAME_ORDER = [37, 4, 58, 12, 45, 21, 63, 8, 30, 52, 16, 1, 41, 24, 56, 9, 34, 60, 6, 49, 19, 28, 54, 14, 43, 3, 62, 26, 11, 47, 32, 5, 22, 59, 17, 39, 7, 50, 29, 55, 13, 35, 61, 2, 44, 20, 53, 27, 10, 46, 31, 57, 15, 40, 23, 48, 0, 36, 18, 51, 25, 42, 33, 38]
const GM_ITEM_NAMES = GM_NAME_ORDER.map((value) => {
  const prefix = GM_NAME_PREFIXES[value % GM_NAME_PREFIXES.length]
  const suffix = GM_NAME_SUFFIXES[Math.floor(value / GM_NAME_PREFIXES.length)]
  return `${prefix}${suffix}`
})
const GM_ITEM_COUNT = 64
export const GM_ITEMS: Record<string, ItemDef> = Object.fromEntries(
  Array.from({ length: GM_ITEM_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(3, '0')
    const id = `gm888_${number}`
    const item: ItemDef = {
      id,
      name: GM_ITEM_NAMES[index],
      kind: 'material',
      price: 0,
      icon: 'core',
      color: '#f6c453',
      asset: `/images/items/gm888/gm888_${number}.png`,
      description: `ไอเทม GM 888 ลำดับ ${number} — สงวนสำหรับคำสั่งเสกของ GM เท่านั้น`,
      gmOnly: true,
    }
    return [id, item]
  }),
) as Record<string, ItemDef>

export const ITEMS: Record<string, ItemDef> = { ...IMAGE_READY_BASE_ITEMS, ...GM_ITEMS }

export const SHOP_STOCK: string[] = [
  'red_potion',
  'orange_potion',
  'white_potion',
  'blue_potion',
  'purple_potion',
  'return_scroll',
  'enhance_stone',
  'wooden_stick',
  'oak_club',
  'short_sword',
  'steel_sword',
  'wood_staff',
  'oak_staff',
  'short_bow',
  'long_bow',
  'knife',
  'kris',
  'cloth_armor',
  'leather_armor',
]

export type MonsterSprite = 'slime' | 'mushroom' | 'rabbit' | 'wolf' | 'goblin' | 'bat' | 'skeleton' | 'ghost' | 'golem' | 'demon'

export interface MonsterDef {
  id: string
  name: string
  level: number
  hp: number
  atk: number
  def: number
  exp: number
  gold: [number, number]
  speed: number
  aggro: number
  sprite: MonsterSprite
  color: string
  boss?: boolean
  drops: { itemId: string; chance: number }[]
}

export const MONSTERS: Record<string, MonsterDef> = {
  slime: { id: 'slime', name: 'สไลม์', level: 1, hp: 30, atk: 6, def: 1, exp: 8, gold: [2, 6], speed: 22, aggro: 0, sprite: 'slime', color: '#57cc99', drops: [{ itemId: 'slime_gel', chance: 0.5 }, { itemId: 'red_potion', chance: 0.1 }] },
  pink_slime: { id: 'pink_slime', name: 'สไลม์ชมพู', level: 4, hp: 65, atk: 11, def: 3, exp: 18, gold: [5, 12], speed: 26, aggro: 50, sprite: 'slime', color: '#ff8fab', drops: [{ itemId: 'slime_gel', chance: 0.6 }, { itemId: 'red_potion', chance: 0.15 }] },
  mushroom: { id: 'mushroom', name: 'เห็ดพิษ', level: 6, hp: 110, atk: 16, def: 5, exp: 30, gold: [8, 18], speed: 24, aggro: 60, sprite: 'mushroom', color: '#e76f51', drops: [{ itemId: 'mushroom_cap', chance: 0.5 }, { itemId: 'blue_potion', chance: 0.1 }, { itemId: 'enhance_stone', chance: 0.02 }] },
  rabbit: { id: 'rabbit', name: 'กระต่ายป่า', level: 8, hp: 150, atk: 20, def: 6, exp: 42, gold: [10, 22], speed: 40, aggro: 70, sprite: 'rabbit', color: '#e9d8a6', drops: [{ itemId: 'red_potion', chance: 0.2 }, { itemId: 'enhance_stone', chance: 0.03 }] },

  wolf: { id: 'wolf', name: 'หมาป่า', level: 11, hp: 260, atk: 32, def: 10, exp: 70, gold: [15, 35], speed: 46, aggro: 90, sprite: 'wolf', color: '#8d99ae', drops: [{ itemId: 'wolf_fang', chance: 0.45 }, { itemId: 'orange_potion', chance: 0.08 }, { itemId: 'enhance_stone', chance: 0.04 }] },
  goblin: { id: 'goblin', name: 'ก๊อบลิน', level: 14, hp: 380, atk: 42, def: 14, exp: 105, gold: [25, 50], speed: 38, aggro: 90, sprite: 'goblin', color: '#6a994e', drops: [{ itemId: 'goblin_ear', chance: 0.45 }, { itemId: 'steel_sword', chance: 0.01 }, { itemId: 'kris', chance: 0.01 }, { itemId: 'enhance_stone', chance: 0.05 }] },
  goblin_chief: { id: 'goblin_chief', name: 'หัวหน้าก๊อบลิน', level: 18, hp: 1400, atk: 60, def: 20, exp: 420, gold: [120, 260], speed: 36, aggro: 110, sprite: 'goblin', color: '#386641', boss: true, drops: [{ itemId: 'long_bow', chance: 0.1 }, { itemId: 'oak_staff', chance: 0.1 }, { itemId: 'leather_armor', chance: 0.15 }, { itemId: 'enhance_stone', chance: 0.4 }] },

  bat: { id: 'bat', name: 'ค้างคาว', level: 21, hp: 620, atk: 70, def: 22, exp: 190, gold: [35, 70], speed: 55, aggro: 110, sprite: 'bat', color: '#5a189a', drops: [{ itemId: 'orange_potion', chance: 0.15 }, { itemId: 'enhance_stone', chance: 0.06 }] },
  skeleton: { id: 'skeleton', name: 'โครงกระดูก', level: 26, hp: 900, atk: 92, def: 32, exp: 280, gold: [50, 100], speed: 40, aggro: 110, sprite: 'skeleton', color: '#e9e3d5', drops: [{ itemId: 'bone', chance: 0.45 }, { itemId: 'knight_blade', chance: 0.012 }, { itemId: 'chain_mail', chance: 0.012 }, { itemId: 'enhance_stone', chance: 0.07 }] },
  ghost: { id: 'ghost', name: 'วิญญาณหลอน', level: 31, hp: 1200, atk: 115, def: 38, exp: 390, gold: [70, 140], speed: 44, aggro: 120, sprite: 'ghost', color: '#caf0f8', drops: [{ itemId: 'ectoplasm', chance: 0.45 }, { itemId: 'crystal_staff', chance: 0.012 }, { itemId: 'hunter_bow', chance: 0.012 }, { itemId: 'shadow_dagger', chance: 0.012 }, { itemId: 'enhance_stone', chance: 0.08 }] },

  fire_golem: { id: 'fire_golem', name: 'โกเลมเพลิง', level: 37, hp: 2000, atk: 150, def: 55, exp: 620, gold: [100, 200], speed: 34, aggro: 120, sprite: 'golem', color: '#e85d04', drops: [{ itemId: 'ember_core', chance: 0.4 }, { itemId: 'white_potion', chance: 0.1 }, { itemId: 'enhance_stone', chance: 0.1 }] },
  demon: { id: 'demon', name: 'ปีศาจ', level: 43, hp: 2800, atk: 190, def: 68, exp: 900, gold: [150, 300], speed: 48, aggro: 130, sprite: 'demon', color: '#9d0208', drops: [{ itemId: 'demon_horn', chance: 0.4 }, { itemId: 'flame_sword', chance: 0.008 }, { itemId: 'inferno_staff', chance: 0.008 }, { itemId: 'phoenix_bow', chance: 0.008 }, { itemId: 'demon_fang', chance: 0.008 }, { itemId: 'enhance_stone', chance: 0.12 }] },
  demon_lord: { id: 'demon_lord', name: 'ราชาปีศาจเพลิง', level: 50, hp: 15000, atk: 260, def: 90, exp: 6000, gold: [2000, 4000], speed: 42, aggro: 150, sprite: 'demon', color: '#370617', boss: true, drops: [{ itemId: 'dragon_armor', chance: 0.25 }, { itemId: 'flame_sword', chance: 0.1 }, { itemId: 'inferno_staff', chance: 0.1 }, { itemId: 'phoenix_bow', chance: 0.1 }, { itemId: 'demon_fang', chance: 0.1 }, { itemId: 'enhance_stone', chance: 1 }] },
  abyss_knight: { id: 'abyss_knight', name: 'อัศวินห้วงอเวจี', level: 54, hp: 5200, atk: 280, def: 105, exp: 1400, gold: [320, 620], speed: 38, aggro: 145, sprite: 'golem', color: '#5b21b6', drops: [{ itemId: 'abyss_crystal', chance: 0.22 }, { itemId: 'enhance_stone', chance: 0.2 }] },
  abyss_dragon: { id: 'abyss_dragon', name: 'มังกรอเวจี', level: 60, hp: 32000, atk: 420, def: 150, exp: 12000, gold: [6000, 12000], speed: 46, aggro: 180, sprite: 'demon', color: '#24104f', boss: true, drops: [{ itemId: 'abyss_crystal', chance: 1 }, { itemId: 'dragon_armor', chance: 0.35 }, { itemId: 'flame_sword', chance: 0.2 }, { itemId: 'inferno_staff', chance: 0.2 }, { itemId: 'phoenix_bow', chance: 0.2 }, { itemId: 'demon_fang', chance: 0.2 }] },
}

export const MAX_LEVEL = 70
export const MAX_PLUS = 15

export function expToNext(level: number) {
  return Math.floor(25 * Math.pow(level, 1.6)) + 15
}

export function enhanceRate(plus: number) {
  const rates = [1, 1, 1, 0.9, 0.8, 0.65, 0.5, 0.4, 0.3, 0.22, 0.15, 0.1, 0.07, 0.05, 0.03]
  return rates[plus] ?? 0
}

export function enhanceCost(plus: number, tier: number) {
  return {
    gold: Math.floor((plus + 1) * 150 * tier * (1 + plus * 0.25)),
    stones: 1 + Math.floor(plus / 3),
  }
}
