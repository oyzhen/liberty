import type { Color, Vertex } from './goTypes'
import { GoGame, other, scoreArea } from './rules'

function mulberry32(seed: number) {
  return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

export function chooseAiMove(game: GoGame, color: Color, strength = 2): Vertex | null {
  const size = game.size
  const random = mulberry32(game.moves.length * 997 + size * 37 + strength * 101)
  const candidates: { v: Vertex; score: number }[] = []
  const last = game.moves.at(-1)?.vertex
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v: Vertex = [x, y]
    const analysis = game.board.analyzeMove(color, v)
    if (analysis.overwrite || analysis.suicide || analysis.ko) continue
    let score = random() * (strength >= 3 ? 2 : 12)
    const clone = game.board.clone().makeMove(color, v)
    const captured = clone.getCaptures(color) - game.board.getCaptures(color)
    score += captured * (22 + strength * 6)
    const libs = clone.getLiberties(v).length
    score += Math.min(libs, 6) * 2.4
    if (libs === 1) score -= strength >= 2 ? 18 : 3
    const neighbors = game.board.getNeighbors(v)
    const friendly = neighbors.filter(n => game.board.get(n) === color).length
    const enemy = neighbors.filter(n => game.board.get(n) === other(color)).length
    score += friendly * 1.4 + enemy * 2.3
    for (const n of neighbors) if (game.board.get(n) === other(color) && game.board.getLiberties(n).length === 1) score += 18
    if (last) {
      const distance = Math.abs(last[0] - x) + Math.abs(last[1] - y)
      score += Math.max(0, 6 - distance) * (strength >= 2 ? 1.2 : .4)
    }
    const edge = Math.min(x, y, size - 1 - x, size - 1 - y)
    if (game.moves.length < size * 1.5) {
      score += edge === 2 || edge === 3 ? 8 : edge === 0 ? -8 : 1
      const stars = size === 19 ? [3, 9, 15] : size === 13 ? [3, 6, 9] : [2, 4, 6]
      if (stars.includes(x) && stars.includes(y)) score += 7
    } else {
      const center = (size - 1) / 2
      score -= (Math.abs(x - center) + Math.abs(y - center)) * .06
    }
    if (strength >= 4) {
      const before = scoreArea(game.board.signMap as any)
      const after = scoreArea(clone.signMap as any)
      score += color === 1 ? (after.black - before.black) * .8 : (after.white - before.white) * .8
    }
    candidates.push({ v, score })
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  const pool = Math.max(1, 6 - strength)
  return candidates[Math.floor(random() * Math.min(pool, candidates.length))].v
}

export function localMoveComment(game: GoGame, moveIndex: number) {
  const move = game.moves[moveIndex]
  if (!move) return '从这里开始读谱。点击下一步，观察棋子如何影响整块棋的气与空间。'
  if (!move.vertex) return `${move.coordinate}：在暂时没有更大选点时保留变化，也可能是在确认终局。`
  if (move.captured > 0) return `${move.coordinate} 提取 ${move.captured} 子。提子不仅增加实地，也改变了周围的强弱与连接。`
  const [x, y] = move.vertex
  const edge = Math.min(x, y, game.size - 1 - x, game.size - 1 - y)
  if (moveIndex < 8 && edge >= 2 && edge <= 3) return `${move.coordinate} 位于角边要道。开局在三四路落子，通常能兼顾实地与发展。`
  const libs = game.board.getLiberties(move.vertex).length
  if (libs <= 2) return `${move.coordinate} 后棋子气数偏紧。应注意对方的打吃、封锁与断点。`
  return `${move.coordinate} 是一手保持联系的选点。请比较它与相邻大场在围地、出头和厚薄上的差别。`
}
