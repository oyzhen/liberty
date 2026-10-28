import { describe, expect, it } from 'vitest'
import { GoGame, scoreArea, toSgf } from './rules'
import { getLevel } from './levels'
import { chooseAiMove } from './ai'

describe('Go rules', () => {
  it('captures a chain and counts captured stones', () => {
    const game = new GoGame(9, [{x:4,y:4,color:-1},{x:3,y:4,color:1},{x:5,y:4,color:1},{x:4,y:3,color:1}])
    const result = game.play([4,5])
    expect(result.ok).toBe(true)
    expect(result.captured).toBe(1)
    expect(game.board.get([4,4])).toBe(0)
    expect(game.snapshot().captures.black).toBe(1)
  })
  it('rejects overwrite and suicide', () => {
    const game = new GoGame(9, [{x:4,y:4,color:1},{x:3,y:3,color:1},{x:5,y:3,color:1},{x:4,y:2,color:1},{x:4,y:4,color:1}])
    expect(game.play([4,4]).ok).toBe(false)
    const suicide = new GoGame(9, [{x:3,y:4,color:1},{x:5,y:4,color:1},{x:4,y:3,color:1},{x:4,y:5,color:1}], -1)
    expect(suicide.play([4,4]).reason).toContain('禁入点')
  })
  it('finishes after two passes and exports SGF', () => {
    const game = new GoGame(9)
    game.play([2,2]);game.play(null);game.play(null)
    expect(game.over).toBe(true)
    expect(game.result).toContain('目')
    expect(toSgf(game)).toContain('SZ[9]')
  })
  it('undo preserves an initial white turn', () => {
    const game = new GoGame(9, [], -1)
    game.play([4,4]);game.undo()
    expect(game.turn).toBe(-1)
    expect(game.moves).toHaveLength(0)
  })
  it('scores a surrounded empty region', () => {
    const game = new GoGame(9, [{x:1,y:0,color:1},{x:0,y:1,color:1},{x:2,y:1,color:1},{x:1,y:2,color:1}])
    const score = scoreArea(game.board.signMap as any)
    expect(score.black).toBeGreaterThan(4)
  })
})

describe('1000 playable levels', () => {
  it('every solution is legal and fulfills the stated objective', () => {
    for (let id = 1; id <= 1000; id++) {
      const level = getLevel(id)
      const game = new GoGame(level.size, level.setup, level.turn)
      const result = game.play(level.solution)
      expect(result.ok, `level ${id}: ${result.reason}`).toBe(true)
      if (level.goal === 'capture') expect(result.captured, `level ${id}`).toBeGreaterThan(0)
      else expect(game.board.getLiberties(level.setup[0] && [level.setup[0].x,level.setup[0].y]).length, `level ${id}`).toBeGreaterThan(1)
    }
  })
  it('AI only chooses legal moves', () => {
    const game = new GoGame(9)
    game.play([2,2])
    const move = chooseAiMove(game, -1, 3)
    expect(move).not.toBeNull()
    expect(game.play(move).ok).toBe(true)
  })
})
