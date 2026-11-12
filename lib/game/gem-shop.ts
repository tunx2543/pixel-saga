export type GemShopCategory = 'fashion' | 'companions' | 'utility'
export type GemArtMotion = 'float' | 'pulse' | 'wings' | 'orbit' | 'sparkle' | 'bounce'

export interface GemShopItem {
  id: string
  name: string
  category: GemShopCategory
  price: number
  rarity: string
  description: string
  ability: string
  motion: GemArtMotion
  colors: { primary: string; secondary: string; accent: string }
  pixels: string[]
}

export const GEM_SHOP_ITEMS: GemShopItem[] = [
  {
    id: 'aurora_cat_hood',
    name: 'หมวกแมวออโรรา',
    category: 'fashion',
    price: 499,
    rarity: 'หายาก',
    description: 'หมวกแมวถักไหมพรม แต้มดาวพิกเซลที่ปลายหู',
    ability: 'เอฟเฟกต์ตัวอย่าง: หูหมวกกระดิกเบา ๆ และมีประกายเมื่อเดิน',
    motion: 'bounce',
    colors: { primary: '#f0abfc', secondary: '#c084fc', accent: '#fef08a' },
    pixels: ['..11..', '.1221.', '122221', '123321', '123321', '.1..1.', '.1..1.', '......'],
  },
  {
    id: 'sunfire_aura',
    name: 'ออร่าเพลิงสุริยัน',
    category: 'fashion',
    price: 2499,
    rarity: 'อีปิก',
    description: 'เปลวไฟสีทองไล่เฉดล้อมตัว พร้อมวงแหวนแสงที่พื้น',
    ability: 'เอฟเฟกต์ตัวอย่าง: เปลวไฟวนรอบตัวและทิ้งประกายสั้น ๆ',
    motion: 'pulse',
    colors: { primary: '#fb923c', secondary: '#ef4444', accent: '#fde68a' },
    pixels: ['...3....', '..232...', '.23232..', '2323232.', '32323232', '.232323.', '..2323..', '...3....'],
  },
  {
    id: 'nebula_dragon_wings',
    name: 'ปีกมังกรเนบิวลา',
    category: 'fashion',
    price: 7999,
    rarity: 'ตำนาน',
    description: 'ปีกผลึกขนาดใหญ่ ไล่สีม่วงครามและมีดาวเคลื่อนในปีก',
    ability: 'เอฟเฟกต์ตัวอย่าง: ขยับปีกเป็นจังหวะ พร้อมละอองดาวตามหลัง',
    motion: 'wings',
    colors: { primary: '#a78bfa', secondary: '#4f46e5', accent: '#67e8f9' },
    pixels: ['1....1..', '21..12..', '321123..', '.32123..', '..3232..', '..232...', '.12.21..', '1....1..'],
  },
  {
    id: 'moonlight_firefly',
    name: 'ภูตหิ่งห้อยมูนไลท์',
    category: 'companions',
    price: 899,
    rarity: 'หายาก',
    description: 'ภูตตัวจิ๋วลอยตามหลัง ส่องแสงนวลในแผนที่มืด',
    ability: 'เอฟเฟกต์ตัวอย่าง: เดินตามและช่วยเก็บดรอปของเจ้าของในระยะใกล้',
    motion: 'float',
    colors: { primary: '#67e8f9', secondary: '#22d3ee', accent: '#fef08a' },
    pixels: ['...33...', '..3223..', '.321123.', '32111223', '32111223', '.321123.', '..3..3..', '........'],
  },
  {
    id: 'gem_raccoon',
    name: 'แรคคูนพ่อค้าอัญมณี',
    category: 'companions',
    price: 2999,
    rarity: 'อีปิก',
    description: 'แรคคูนสะพายกระเป๋าผ้าและถือผลึกสีฟ้า',
    ability: 'เอฟเฟกต์ตัวอย่าง: วิ่งไปเก็บดรอปของเจ้าของในระยะปานกลาง',
    motion: 'bounce',
    colors: { primary: '#94a3b8', secondary: '#475569', accent: '#38bdf8' },
    pixels: ['..1111..', '.122221.', '12233221', '12233221', '.122221.', '.1.33.1.', '1..33..1', '...11...'],
  },
  {
    id: 'aurora_cloud_dragon',
    name: 'มังกรเมฆาออโรรา',
    category: 'companions',
    price: 9999,
    rarity: 'มายา',
    description: 'สัตว์ขี่มังกรเมฆาตัวใหญ่ มีเขาคริสตัลและแผงคอแสงเหนือ',
    ability: 'เอฟเฟกต์ตัวอย่าง: พาหนะเคลื่อนที่เร็วขึ้นและช่วยเก็บดรอปของเจ้าของ',
    motion: 'orbit',
    colors: { primary: '#5eead4', secondary: '#818cf8', accent: '#f0abfc' },
    pixels: ['..1..1..', '.121.121.', '122212221', '123222321', '.1222221.', '..12221..', '.1.2.2.1.', '...1.1...'],
  },
  {
    id: 'town_warp_tome',
    name: 'คัมภีร์วาร์ปกลับเมือง',
    category: 'utility',
    price: 299,
    rarity: 'ทั่วไป',
    description: 'คัมภีร์พับมุม ประทับตราประตูเมืองด้วยหมึกเรืองแสง',
    ability: 'เอฟเฟกต์ตัวอย่าง: วาร์ปกลับเมืองทันทีเมื่อกดใช้',
    motion: 'float',
    colors: { primary: '#c4b5fd', secondary: '#7c3aed', accent: '#fde68a' },
    pixels: ['.11111..', '1222221.', '1233321.', '1222321.', '1222221.', '1222221.', '.11111..', '........'],
  },
  {
    id: 'starlight_loot_magnet',
    name: 'แม่เหล็กดูดของแสงดาว',
    category: 'utility',
    price: 1499,
    rarity: 'อีปิก',
    description: 'แกนแม่เหล็กคู่สีฟ้า มีวงแหวนพลังงานหมุนรอบ',
    ability: 'เอฟเฟกต์ตัวอย่าง: ดูดดรอปของเจ้าของเข้าหาในช่วงเวลาจำกัด',
    motion: 'orbit',
    colors: { primary: '#38bdf8', secondary: '#2563eb', accent: '#f0abfc' },
    pixels: ['.1....1.', '11.22.11', '.123321.', '...33...', '...33...', '.123321.', '11.22.11', '.1....1.'],
  },
  {
    id: 'astral_bag_expansion',
    name: 'กระเป๋าดวงดาว +20 ช่อง',
    category: 'utility',
    price: 5999,
    rarity: 'ตำนาน',
    description: 'กระเป๋าหนังขอบทอง ปักแผนที่กลุ่มดาวทั้งใบ',
    ability: 'เอฟเฟกต์ตัวอย่าง: เพิ่มช่องเก็บของถาวร 20 ช่อง',
    motion: 'sparkle',
    colors: { primary: '#f59e0b', secondary: '#92400e', accent: '#67e8f9' },
    pixels: ['..1111..', '.122221.', '12222221', '12333321', '12333321', '12222221', '.122221.', '..1111..'],
  },
]

export const GEM_SHOP_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'fashion', label: 'แฟชั่น & เอฟเฟกต์' },
  { id: 'companions', label: 'สัตว์เลี้ยง & พาหนะ' },
  { id: 'utility', label: 'อำนวยความสะดวก' },
] as const
