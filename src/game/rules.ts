import GoBoard from '@sabaki/go-board'
import type { Color, GameSnapshot, Move, Vertex } from './goTypes'

export const other = (color: Color): Color => color === 1 ? -1 : 1
export const coords = (v: Vertex, size = 19) => `${'ABCDEFGHJKLMNOPQRST'[v[0]]}${size - v[1]}`
export const emptyMap = (size: number): (Color | 0)[][] => Array.from({ length: size }, () => Array<Color | 0>(size).fill(0))

export function scoreArea(signMap: (Color | 0)[][], komi = 6.5) {
  const size = signMap.length
  const seen = new Set<string>()
  let black = 0
  let white = komi
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sign = signMap[y][x]
    if (sign === 1) black++
    else if (sign === -1) white++
    else if (!seen.has(`${x},${y}`)) {
      const board = new GoBoard(signMap as any)
      const region = board.getConnectedComponent([x, y], v => board.get(v) === 0)
      const borders = new Set<number>()
      for (const v of region) for (const n of board.getNeighbors(v)) borders.add(board.get(n) || 0)
      region.forEach(v => seen.add(`${v[0]},${v[1]}`))
      if (borders.size === 1 && borders.has(1)) black += region.length
      else if (borders.size === 1 && borders.has(-1)) white += region.length
    }
  }
  return { black, white, diff: black - white }
}

export class GoGame {
  size: number
  board: GoBoard
  turn: Color = 1
  moves: Move[] = []
  passes = 0
  over = false
  result = ''
  illegal = ''
  private initial: GoBoard
  private initialTurn: Color

  constructor(size = 9, setup: { x: number; y: number; color: Color }[] = [], turn: Color = 1) {
    this.size = size
    this.board = GoBoard.fromDimensions(size, size)
    for (const s of setup) if (s.x >= 0 && s.y >= 0 && s.x < size && s.y < size) this.board.set([s.x, s.y], s.color)
    this.initial = this.board.clone()
    this.initialTurn = turn
    this.turn = turn
  }

  reset() {
    this.board = this.initial.clone()
    this.turn = this.initialTurn
    this.moves = []
    this.passes = 0
    this.over = false
    this.result = ''
    this.illegal = ''
  }

  play(vertex: Vertex | null, color = this.turn): { ok: boolean; captured: number; reason?: string } {
    this.illegal = ''
    if (this.over) return { ok: false, captured: 0, reason: '本局已结束' }
    if (vertex === null) {
      this.moves.push({ color, vertex: null, captured: 0, coordinate: '停一手' })
      this.passes++
      this.turn = other(color)
      if (this.passes >= 2) this.finish()
      return { ok: true, captured: 0 }
    }
    const analysis = this.board.analyzeMove(color, vertex)
    if (analysis.overwrite) { this.illegal = '这里已有棋子'; return { ok: false, captured: 0, reason: this.illegal } }
    if (analysis.ko) { this.illegal = '打劫：不能立即回提，请先在别处落子'; return { ok: false, captured: 0, reason: this.illegal } }
    if (analysis.suicide) { this.illegal = '禁入点：这手棋没有气，且不能提子'; return { ok: false, captured: 0, reason: this.illegal } }
    const before = this.board.getCaptures(color)
    try {
      this.board = this.board.makeMove(color, vertex, { preventKo: true, preventOverwrite: true, preventSuicide: true })
    } catch {
      this.illegal = '此手不符合围棋规则'
      return { ok: false, captured: 0, reason: this.illegal }
    }
    const captured = this.board.getCaptures(color) - before
    this.moves.push({ color, vertex, captured, coordinate: coords(vertex, this.size) })
    this.passes = 0
    this.turn = other(color)
    if (this.board.signMap.every(row => row.every(sign => sign !== 0))) this.finish()
    return { ok: true, captured }
  }

  undo(steps = 1) {
    if (!this.moves.length) return false
    const target = Math.max(0, this.moves.length - steps)
    const history = this.moves.slice(0, target)
    this.board = this.initial.clone()
    this.turn = this.initialTurn
    this.moves = []
    this.passes = 0
    this.over = false
    this.result = ''
    for (const m of history) this.play(m.vertex, m.color)
    return true
  }

  finish() {
    this.over = true
    const score = scoreArea(this.board.signMap as (Color | 0)[][])
    const winner = score.black > score.white ? '黑棋' : '白棋'
    this.result = `${winner}胜 ${Math.abs(score.diff).toFixed(1)} 目 · 黑 ${score.black.toFixed(1)} / 白 ${score.white.toFixed(1)}`
  }

  resign(color: Color) {
    this.over = true
    this.result = `${color === 1 ? '白棋' : '黑棋'}中盘胜`
  }

  snapshot(): GameSnapshot {
    return {
      size: this.size,
      board: 0,
      signMap: this.board.signMap.map(row => [...row]) as (Color | 0)[][],
      turn: this.turn,
      captures: { black: this.board.getCaptures(1), white: this.board.getCaptures(-1) },
      moves: [...this.moves], passes: this.passes, over: this.over, result: this.result,
      lastMove: this.moves.at(-1)?.vertex || null, illegal: this.illegal,
    }
  }
}

export function toSgf(game: GoGame, name = '弈境对局') {
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\]/g, '\\]')
  const moves = game.moves.map(m => m.vertex ? `;${m.color === 1 ? 'B' : 'W'}[${String.fromCharCode(97 + m.vertex[0])}${String.fromCharCode(97 + m.vertex[1])}]` : `;${m.color === 1 ? 'B' : 'W'}[]`).join('')
  return `(;GM[1]FF[4]CA[UTF-8]AP[YiJing:1.0]GN[${escape(name)}]SZ[${game.size}]KM[6.5]${moves})`
}
