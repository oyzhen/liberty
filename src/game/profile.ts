import type { Profile } from './goTypes'
import { ACHIEVEMENTS, syncAchievements } from './achievements'
import { getLevel } from './levels'

const KEY = 'yijing.profile.v2'
const today = () => new Date().toISOString().slice(0, 10)
const uid = () => globalThis.crypto?.randomUUID?.() || `yj-${Date.now()}-${Math.floor(Math.random() * 1e8)}`

export function defaultProfile(): Profile {
  return {
    version: 2, playerKey: uid(), name: '云间棋客', level: 1, xp: 0, coins: 180, jade: 12,
    unlocked: 1, completed: [], stars: {}, achievements: [], rating: 1200, rank: '初识',
    petName: '团子', petXp: 0, petLevel: 1, petMood: 82, theme: 'ink', view: '2.5d', music: 'guqin',
    muted: false, volume: .65, effects: true, coordinates: true,
    stats: { games: 0, wins: 0, captures: 0, stones: 0, lessons: 0, reviews: 0, streak: 0, exams: 0, hints: 0 },
    daily: { date: today(), games: 0, puzzles: 0, lessons: 0 }, lastPlayed: today(),
  }
}

export function loadProfile(): Profile {
  const fallback = defaultProfile()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<Profile>
    if (value.version !== 2 || typeof value.playerKey !== 'string') return fallback
    const merged = { ...fallback, ...value, stats: { ...fallback.stats, ...value.stats }, daily: { ...fallback.daily, ...value.daily } }
    if (merged.daily.date !== today()) merged.daily = { date: today(), games: 0, puzzles: 0, lessons: 0 }
    return merged
  } catch { return fallback }
}

export function saveProfile(profile: Profile) {
  try { localStorage.setItem(KEY, JSON.stringify(profile)) } catch { /* local fallback can be unavailable */ }
}

export function addXp(profile: Profile, xp: number, coins = 0) {
  profile.xp += xp
  profile.coins += coins
  profile.petXp += Math.max(1, Math.round(xp * .55))
  profile.petMood = Math.min(100, profile.petMood + 2)
  profile.level = 1 + Math.floor(Math.sqrt(profile.xp / 80))
  profile.petLevel = 1 + Math.floor(Math.sqrt(profile.petXp / 55))
  profile.rank = rankForRating(profile.rating)
  profile.lastPlayed = today()
}

export function rankForRating(rating: number) {
  if (rating >= 2200) return '业余 6 段'
  if (rating >= 2050) return '业余 5 段'
  if (rating >= 1900) return '业余 4 段'
  if (rating >= 1750) return '业余 3 段'
  if (rating >= 1600) return '业余 2 段'
  if (rating >= 1500) return '业余 1 段'
  const kyu = Math.max(1, Math.min(25, 25 - Math.floor((rating - 600) / 36)))
  return `${kyu} 级`
}

export function rewardPuzzle(profile: Profile, level: number, mistakes: number) {
  if (!profile.completed.includes(level)) profile.completed.push(level)
  profile.completed.sort((a, b) => a - b)
  profile.unlocked = Math.min(1000, Math.max(profile.unlocked, level + 1))
  profile.stars[level] = Math.max(profile.stars[level] || 0, mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1)
  profile.stats.streak++
  profile.daily.puzzles++
  const data = getLevel(level)
  addXp(profile, 35 + data.chapter * 8, data.reward)
  return syncAchievements(profile)
}

export function achievementById(id: string) { return ACHIEVEMENTS.find(a => a.id === id) }

let availability: Promise<boolean> | null = null
async function cloudAvailable(): Promise<boolean> {
  if (!availability) availability = fetch('/api/trpc/progress.status').then(async r => r.ok ? Boolean((await r.json())?.result?.data?.json?.available) : false).catch(() => false)
  return availability
}

export async function cloudSave(profile: Profile): Promise<boolean> {
  saveProfile(profile)
  try {
    if (!await cloudAvailable()) return false
    const response = await fetch('/api/trpc/progress.save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ json: { playerKey: profile.playerKey, data: JSON.stringify(profile) } }) })
    return response.ok
  } catch { return false }
}

export async function cloudLoad(playerKey: string): Promise<Profile | null> {
  try {
    if (!await cloudAvailable()) return null
    const response = await fetch(`/api/trpc/progress.load?input=${encodeURIComponent(JSON.stringify({ json: { playerKey } }))}`)
    if (!response.ok) return null
    const body = await response.json()
    const data = body?.result?.data?.json?.data
    if (typeof data !== 'string') return null
    const parsed = JSON.parse(data)
    return parsed.version === 2 ? parsed : null
  } catch { return null }
}
