export type Color = 1 | -1
export type Vertex = [number, number]
export type GameMode = 'campaign' | 'ai' | 'local' | 'review' | 'exam'
export type ViewMode = '2d' | '2.5d' | '3d'
export type GoalType = 'capture' | 'survive' | 'score'

export interface Move {
  color: Color
  vertex: Vertex | null
  captured: number
  coordinate: string
  comment?: string
}

export interface GameSnapshot {
  size: number
  board: Color | 0
  signMap: (Color | 0)[][]
  turn: Color
  captures: { black: number; white: number }
  moves: Move[]
  passes: number
  over: boolean
  result: string
  lastMove: Vertex | null
  illegal: string
}

export interface Level {
  id: number
  chapter: number
  title: string
  chapterTitle: string
  size: number
  turn: Color
  setup: { x: number; y: number; color: Color }[]
  solution: Vertex
  goal: GoalType
  objective: string
  lesson: string
  hint: string
  maxMoves: number
  reward: number
  difficulty: number
}

export interface Stats {
  games: number
  wins: number
  captures: number
  stones: number
  lessons: number
  reviews: number
  streak: number
  exams: number
  hints: number
}

export interface Profile {
  version: 2
  playerKey: string
  name: string
  level: number
  xp: number
  coins: number
  jade: number
  unlocked: number
  completed: number[]
  stars: Record<number, number>
  achievements: string[]
  rating: number
  rank: string
  petName: string
  petXp: number
  petLevel: number
  petMood: number
  theme: string
  view: ViewMode
  music: string
  muted: boolean
  volume: number
  effects: boolean
  coordinates: boolean
  stats: Stats
  daily: { date: string; games: number; puzzles: number; lessons: number }
  lastPlayed: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  reward: number
  progress: (p: Profile) => number
  target: number
}

export interface BoardCallbacks {
  onMove: (vertex: Vertex) => void
  onHover: (vertex: Vertex | null) => void
  onViewChange?: (view: ViewMode) => void
}
