import type { Archetype } from '../api/client'

export type ArchetypeTheme = {
  label: string
  short: string
  tagline: string
  description: string
  primary: string
  ring: string
  text: string
  glow: string
  gradient: string
  iconKey: 'sun' | 'compass' | 'flame' | 'shield'
}

export const ARCHETYPES: Record<Archetype, ArchetypeTheme> = {
  DELEGATE: {
    label: 'DELEGATE',
    short: 'D',
    tagline: 'อิสระ ไว้ใจ ส่งมอบ',
    description: 'มีทั้ง skill และไฟ ปล่อยให้คิดเอง ทำเอง ตัดสินใจเอง',
    primary: '#F59E0B',
    ring: 'ring-amber-400/60',
    text: 'text-amber-300',
    glow: 'rgba(245,158,11,0.55)',
    gradient: 'from-amber-500/30 via-orange-500/10 to-amber-700/30',
    iconKey: 'sun',
  },
  COACH: {
    label: 'COACH',
    short: 'C',
    tagline: 'มีไฟ ต้องสอน',
    description: 'ทะเยอทะยานสูง แต่ skill ยังไม่พอ ต้องการการสอนและ feedback',
    primary: '#3B82F6',
    ring: 'ring-blue-400/60',
    text: 'text-blue-300',
    glow: 'rgba(59,130,246,0.55)',
    gradient: 'from-blue-500/30 via-sky-500/10 to-indigo-700/30',
    iconKey: 'compass',
  },
  INSPIRE_SUPPORT: {
    label: 'INSPIRE',
    short: 'I',
    tagline: 'เก่ง ต้องเติมไฟ',
    description: 'มี skill ครบ แต่หมดไฟ ต้องการแรงบันดาลใจและการรับฟัง',
    primary: '#A855F7',
    ring: 'ring-purple-400/60',
    text: 'text-purple-300',
    glow: 'rgba(168,85,247,0.55)',
    gradient: 'from-purple-500/30 via-fuchsia-500/10 to-violet-700/30',
    iconKey: 'flame',
  },
  TELL: {
    label: 'TELL',
    short: 'T',
    tagline: 'สั่งชัด นำทาง',
    description: 'ยังไม่มี skill และไม่มีไฟ ต้องการคำสั่งและขั้นตอนชัดเจน',
    primary: '#EF4444',
    ring: 'ring-red-400/60',
    text: 'text-red-300',
    glow: 'rgba(239,68,68,0.55)',
    gradient: 'from-red-500/30 via-rose-500/10 to-red-700/30',
    iconKey: 'shield',
  },
}

export function archetypeOf(key: Archetype | null | undefined): ArchetypeTheme | null {
  return key ? ARCHETYPES[key] : null
}
