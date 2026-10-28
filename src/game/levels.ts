import { GoGame, other, scoreArea } from './rules'
import type { Color, GoalType, Level, Vertex } from './goTypes'

export const CHAPTERS = [
  { title: '初见·六法入门', subtitle: '气、提子、逃子、连接与双打吃', color: '#8fb9a8' },
  { title: '听风·棋形骨骼', subtitle: '连接、分断、棋筋与价值选择', color: '#9bb7d4' },
  { title: '观山·死活动静', subtitle: '真眼、假眼、做活与破眼', color: '#b3a0d0' },
  { title: '揽月·追捕有术', subtitle: '征子、枷吃与连续打吃', color: '#d4a29b' },
  { title: '松涛·对杀争先', subtitle: '气数、先后手与捕捉时机', color: '#b8b68c' },
  { title: '流云·弃子手筋', subtitle: '扑、倒扑与以舍为得', color: '#87b9bd' },
  { title: '星罗·综合计算', subtitle: '在更大棋盘中组合运用战术', color: '#a6a1ce' },
  { title: '玄微·强弱辨证', subtitle: '复合威胁、治孤与攻杀', color: '#c69eaa' },
  { title: '归朴·毫厘必争', subtitle: '官子价值与全局目数判断', color: '#b4a88d' },
  { title: '无界·千局一心', subtitle: '全技巧混合与高阶阅读', color: '#d0b677' },
]

const TECHNIQUES = [
  ['capture', '最后一口气'], ['capture-edge', '边角提子'], ['survive', '绝处逢生'],
  ['capture-chain', '一气呵提'], ['connect', '握手成城'], ['double-atari', '一石二鸟'],
  ['cut', '断其归路'], ['capture-choice', '择大而取'], ['escape-connect', '接应出险'],
  ['ladder', '阶梯征子'], ['net', '天罗地网'], ['make-eye', '两眼看生'],
  ['break-eye', '点杀要津'], ['semeai', '对杀抢先'], ['throw-in', '扑入破眼'],
  ['snapback', '倒脱靴'], ['score', '毫厘之选'],
] as const
type Technique = typeof TECHNIQUES[number][0]

const CURVES: Technique[][] = [
  ['capture','capture-edge','survive','capture-chain','connect','double-atari','cut','capture-choice','escape-connect','ladder','net','make-eye','break-eye','semeai','throw-in','snapback','score','connect','double-atari','capture-chain'],
  ['connect','escape-connect','cut','double-atari','capture-choice','connect','cut','survive','double-atari','score'],
  ['make-eye','break-eye','throw-in','survive','make-eye','snapback','break-eye','connect','throw-in','make-eye'],
  ['ladder','net','double-atari','capture-chain','ladder','net','capture-choice','cut','ladder','net'],
  ['semeai','capture-choice','double-atari','survive','semeai','cut','capture-chain','connect','semeai','score'],
  ['throw-in','snapback','break-eye','net','throw-in','semeai','snapback','make-eye','throw-in','score'],
  ['double-atari','cut','ladder','net','make-eye','break-eye','semeai','throw-in','snapback','capture-choice'],
  ['escape-connect','cut','net','ladder','semeai','throw-in','snapback','double-atari','break-eye','connect'],
  ['score','capture-choice','semeai','double-atari','score','break-eye','net','throw-in','score','capture-chain'],
  ['capture-choice','double-atari','cut','ladder','net','make-eye','break-eye','semeai','throw-in','snapback'],
]

interface Pattern {
  technique: Technique
  goal: GoalType
  turn: Color
  setup: { x: number; y: number; color: Color }[]
  solution: Vertex
  target: Vertex[]
  minCaptures?: number
  edge?: boolean
}

const v = (x: number, y: number): Vertex => [x, y]
const same = (a: Vertex, b: Vertex) => a[0] === b[0] && a[1] === b[1]
const key = (a: Vertex) => `${a[0]},${a[1]}`
function stone(setup: Pattern['setup'], at: Vertex, color: Color) {
  if (!setup.some(s => s.x === at[0] && s.y === at[1])) setup.push({ x: at[0], y: at[1], color })
}
function pattern(technique: Technique, goal: GoalType, turn: Color, solution: Vertex, target: Vertex[]): Pattern {
  return { technique, goal, turn, solution, target, setup: [] }
}

function capturePattern(technique: Technique, length: number, edge = false): Pattern {
  const p = pattern(technique, technique === 'capture-choice' ? 'score' : 'capture', 1, v(4, 4), [])
  const chain: Vertex[] = []
  if (edge) {
    for (let i = 0; i < length; i++) chain.push(v(3 + i, 0))
  } else {
    for (let i = 0; i < length; i++) chain.push(v(3 + i, 4))
  }
  chain.forEach(at => { stone(p.setup, at, -1); p.target.push(at) })
  const occupied = new Set(chain.map(key))
  const perimeter: Vertex[] = []
  const seen = new Set<string>()
  for (const [x,y] of chain) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const at = v(x+dx,y+dy)
    if (at[0] < 0 || at[1] < 0 || at[0] > 8 || at[1] > 8 || occupied.has(key(at)) || seen.has(key(at))) continue
    seen.add(key(at)); perimeter.push(at)
  }
  p.solution = perimeter[Math.floor(perimeter.length / 2)]
  perimeter.filter(at => !same(at, p.solution)).forEach(at => stone(p.setup, at, 1))
  p.minCaptures = length
  p.edge = edge
  return p
}

function survivePattern(connect: boolean): Pattern {
  const p = pattern(connect ? 'escape-connect' : 'survive', connect ? 'connect' : 'survive', -1, v(4,5), [v(4,4)])
  stone(p.setup, v(4,4), -1)
  stone(p.setup, v(3,4), 1); stone(p.setup, v(5,4), 1); stone(p.setup, v(4,3), 1)
  if (connect) { stone(p.setup, v(4,6), -1); p.target.push(v(4,6)) }
  return p
}

function connectPattern(): Pattern {
  const p = pattern('connect', 'connect', 1, v(4,4), [v(3,4),v(5,4)])
  stone(p.setup, v(3,4), 1); stone(p.setup, v(5,4), 1)
  stone(p.setup, v(2,4), -1); stone(p.setup, v(6,4), -1)
  stone(p.setup, v(3,3), -1); stone(p.setup, v(5,3), -1)
  return p
}

function doubleAtariPattern(): Pattern {
  const p = pattern('double-atari', 'double-atari', 1, v(4,3), [v(3,3),v(5,3)])
  p.target.forEach(at => stone(p.setup, at, -1))
  stone(p.setup, v(2,3), 1); stone(p.setup, v(3,2), 1)
  stone(p.setup, v(6,3), 1); stone(p.setup, v(5,2), 1)
  return p
}

function cutPattern(): Pattern {
  const p = pattern('cut', 'cut', 1, v(4,3), [v(3,3),v(4,4)])
  p.target.forEach(at => stone(p.setup, at, -1))
  stone(p.setup, v(2,3), 1); stone(p.setup, v(3,2), 1)
  stone(p.setup, v(5,4), 1); stone(p.setup, v(4,5), 1)
  return p
}

function ladderPattern(): Pattern {
  const p = pattern('ladder', 'ladder', 1, v(5,4), [v(4,4)])
  stone(p.setup, v(4,4), -1); stone(p.setup, v(3,4), 1); stone(p.setup, v(4,3), 1)
  stone(p.setup, v(6,3), 1); stone(p.setup, v(6,4), 1)
  return p
}

function netPattern(): Pattern {
  const p = pattern('net', 'net', 1, v(5,5), [v(4,4)])
  stone(p.setup, v(4,4), -1)
  stone(p.setup, v(3,3), 1); stone(p.setup, v(5,3), 1); stone(p.setup, v(3,5), 1)
  return p
}

function eyePattern(make: boolean): Pattern {
  const color: Color = make ? 1 : -1
  const p = pattern(make ? 'make-eye' : 'break-eye', make ? 'make-eye' : 'break-eye', make ? 1 : 1, v(2,1), [v(1,0)])
  const friendly = [v(1,0),v(3,0),v(0,1),v(1,1),v(3,1),v(4,1),v(1,2),v(3,2),v(2,3)]
  friendly.forEach(at => stone(p.setup, at, color))
  const opposing = [v(0,2),v(4,2),v(4,0),v(0,3),v(1,3),v(3,3),v(2,4)]
  opposing.forEach(at => stone(p.setup, at, other(color)))
  p.edge = true
  return p
}

function throwInPattern(snapback: boolean): Pattern {
  const p = pattern(snapback ? 'snapback' : 'throw-in', snapback ? 'snapback' : 'throw-in', 1, v(2,1), [v(1,0)])
  const whites = [v(1,0),v(2,0),v(3,0),v(0,1),v(1,1),v(3,1),v(4,1),v(1,2),v(3,2)]
  whites.forEach(at => stone(p.setup, at, -1))
  stone(p.setup, v(2,2), 1)
  stone(p.setup, v(0,2), 1); stone(p.setup, v(4,2), 1); stone(p.setup, v(4,0), 1)
  p.edge = true
  return p
}

function semeaiPattern(): Pattern {
  const p = pattern('semeai', 'semeai', 1, v(4,3), [v(5,3)])
  stone(p.setup, v(5,3), -1); stone(p.setup, v(6,3), 1); stone(p.setup, v(5,2), 1); stone(p.setup, v(5,4), 1)
  stone(p.setup, v(4,4), 1); stone(p.setup, v(3,4), 1); stone(p.setup, v(4,5), -1); stone(p.setup, v(5,4), -1)
  return p
}

function choicePattern(score: boolean): Pattern {
  const p = pattern(score ? 'score' : 'capture-choice', score ? 'score' : 'capture', 1, v(4,5), [])
  // A three-stone chain is worth more than the single stone elsewhere.
  const chain = [v(3,4),v(4,4),v(5,4)]
  chain.forEach(at => { stone(p.setup, at, -1); p.target.push(at) })
  const black = [v(2,4),v(6,4),v(3,3),v(4,3),v(5,3),v(3,5),v(5,5)]
  black.forEach(at => stone(p.setup, at, 1))
  stone(p.setup, v(1,1), -1); stone(p.setup, v(0,1), 1); stone(p.setup, v(2,1), 1); stone(p.setup, v(1,0), 1)
  p.minCaptures = 3
  return p
}

function basePattern(technique: Technique, chapter: number, tier: number): Pattern {
  const length = Math.min(4, 1 + Math.floor(chapter / 3) + Math.floor(tier / 5))
  switch (technique) {
    case 'capture': return capturePattern(technique, 1)
    case 'capture-edge': return capturePattern(technique, Math.min(3, length), true)
    case 'capture-chain': return capturePattern(technique, Math.max(2, length))
    case 'survive': return survivePattern(false)
    case 'escape-connect': return survivePattern(true)
    case 'connect': return connectPattern()
    case 'double-atari': return doubleAtariPattern()
    case 'cut': return cutPattern()
    case 'ladder': return ladderPattern()
    case 'net': return netPattern()
    case 'make-eye': return eyePattern(true)
    case 'break-eye': return eyePattern(false)
    case 'throw-in': return throwInPattern(false)
    case 'snapback': return throwInPattern(true)
    case 'semeai': return semeaiPattern()
    case 'capture-choice': return choicePattern(false)
    case 'score': return choicePattern(true)
  }
}

function rotate(at: Vertex, turns: number, mirror: boolean): Vertex {
  let [x,y] = at
  if (mirror) x = 8-x
  for (let i=0;i<turns;i++) [x,y] = [8-y,x]
  return [x,y]
}

const GOAL_TEXT: Record<GoalType, { objective: string; hint: string; lesson: string }> = {
  capture: { objective:'提取目标白棋', hint:'把相连棋子看作整体，数它们共同的气。', lesson:'一块棋只剩最后一口气时，落在该空点即可全部提走。' },
  survive: { objective:'让目标棋块脱离打吃', hint:'长出后，整块棋至少要有两口气。', lesson:'逃子不是随便长一手，要比较逃生后的气数与连接。' },
  connect: { objective:'连接目标棋块并确保脱险', hint:'寻找两块棋之间的实接点。', lesson:'实接能共享气，让对方无法轻易分断。' },
  'double-atari': { objective:'一手同时打吃两块白棋', hint:'寻找两块棋共用的气，而不是立即能提子的点。', lesson:'双打吃制造两个同时威胁，对手通常只能救一边。' },
  cut: { objective:'分断两块目标白棋', hint:'观察两块棋之间的联络要点，同时保证自身有气。', lesson:'分断让对手不能共享气，是攻击与围空的基础。' },
  net: { objective:'用枷吃封住目标白棋', hint:'不必紧贴打吃，守住它逃跑方向的前方。', lesson:'枷吃用棋形封锁出路。要预想对方长、冲、反打后的结果。' },
  ladder: { objective:'开始征子，持续打吃目标棋', hint:'让目标只剩一气，并控制它的逃跑方向。', lesson:'征子要求连续打吃。落子前必须检查路径与引征棋。' },
  'make-eye': { objective:'做成两只真眼，让黑棋活棋', hint:'保留已有的眼，再补上另一只眼的要点。', lesson:'两只独立的真眼让棋块永久拥有气。' },
  'break-eye': { objective:'占据要点，使白棋无法做成两眼', hint:'比较眼位形状的中心与分割线。', lesson:'破眼要占对方做眼的要点，而不是只在外围追赶。' },
  'throw-in': { objective:'扑入眼位，破坏白棋活形', hint:'考虑送子之后，对方眼位与气数怎样变化。', lesson:'扑是主动送入一子，以缩小眼位或制造后续打吃。' },
  snapback: { objective:'弃子制造倒扑，回提更多白棋', hint:'先让对方提，再观察提子后的新断点。', lesson:'倒扑利用对方提子后自身气数反而减少的棋形。' },
  semeai: { objective:'在对杀中先手提走目标白棋', hint:'先比较双方气数，再检查是否能直接收气。', lesson:'对杀不仅数自己的气，也要计算对方最强抵抗。' },
  score: { objective:'选择目数收益最大的着手', hint:'比较两处提子的棋子数量与实际得失。', lesson:'同样是一手棋，价值可能不同。先计算，再选择大的。' },
}

export function getLevel(id: number): Level {
  id = Math.max(1, Math.min(1000, Math.floor(id)))
  const chapter = Math.floor((id-1)/100)
  const local = (id-1)%100
  const curve = CURVES[chapter]
  const technique = curve[local%curve.length]
  const tier = Math.floor(local/curve.length)
  const base = basePattern(technique, chapter, tier)
  const turns = tier%4, mirror = Math.floor(tier/4)%2 === 1
  const size = chapter < 4 ? 9 : chapter < 7 ? 13 : 19
  const centered = Math.floor((size-9)/2)
  const anchors: Vertex[] = base.edge ? [v(0,0)] : [v(0,0),v(size-9,0),v(0,size-9),v(size-9,size-9),v(centered,centered)]
  const offset = base.edge
    ? turns === 1 ? v(size-9,0) : turns === 2 ? v(0,size-9) : v(0,0)
    : anchors[tier%anchors.length]
  const place = (at: Vertex): Vertex => { const r=rotate(at,turns,mirror); return [r[0]+offset[0],r[1]+offset[1]] }
  const setup = base.setup.map(s => { const at=place([s.x,s.y]); return {x:at[0],y:at[1],color:s.color} })
  const occupied = new Set(setup.map(s => `${s.x},${s.y}`))
  // Later tiers add distant decoy stones. They never touch the tactical shape,
  // but force the reader to locate the relevant fight instead of memorizing coordinates.
  const decoys: Vertex[] = [v(1,7),v(7,1),v(1,1),v(7,7),v(2,7),v(7,2),v(2,2),v(6,6)]
  for (let i=0;i<Math.min(decoys.length,chapter+tier);i++) {
    const at = decoys[(i+id)%decoys.length]
    if (at[0]>=size || at[1]>=size || occupied.has(key(at))) continue
    if (setup.some(s => Math.abs(s.x-at[0])+Math.abs(s.y-at[1])<3)) continue
    setup.push({x:at[0],y:at[1],color:i%2===0?1:-1}); occupied.add(key(at))
  }
  const text = GOAL_TEXT[base.goal]
  const name = TECHNIQUES.find(([id]) => id===technique)?.[1] || '关键一手'
  return {
    id, chapter, title:`第 ${id} 关 · ${name}`, chapterTitle:CHAPTERS[chapter].title,
    size, turn:base.turn, setup, solution:place(base.solution), target:base.target.map(place),
    goal:base.goal, technique, minCaptures:base.minCaptures,
    objective:text.objective, hint:text.hint, lesson:text.lesson,
    maxMoves:chapter<3?3:2, reward:24+chapter*9+Math.min(18,tier*2), difficulty:chapter+1,
  }
}

function groupAt(game: GoGame, start: Vertex): Vertex[] {
  const color = game.board.get(start)
  if (!color) return []
  const seen = new Set<string>(), queue = [start], group: Vertex[] = []
  while (queue.length) {
    const at = queue.shift()!
    if (seen.has(key(at))) continue
    seen.add(key(at)); group.push(at)
    for (const n of game.board.getNeighbors(at)) if (game.board.get(n)===color && !seen.has(key(n))) queue.push(n)
  }
  return group
}

function eyeCount(game: GoGame, start: Vertex): number {
  const color = game.board.get(start)
  if (!color) return 0
  const group = new Set(groupAt(game,start).map(key)), seen = new Set<string>()
  let eyes = 0
  for (let y=0;y<game.size;y++) for (let x=0;x<game.size;x++) {
    const at=v(x,y)
    if (game.board.get(at)!==0 || seen.has(key(at))) continue
    const region: Vertex[] = [], queue=[at], borders=new Set<number>()
    let touches = false
    while(queue.length) {
      const p=queue.shift()!
      if(seen.has(key(p))) continue
      seen.add(key(p));region.push(p)
      for(const n of game.board.getNeighbors(p)) {
        const sign=game.board.get(n)||0
        if(sign===0 && !seen.has(key(n))) queue.push(n)
        else if(sign) borders.add(sign)
        if(group.has(key(n))) touches=true
      }
    }
    if(touches && borders.size===1 && borders.has(color)) eyes++
  }
  return eyes
}

/** Validate the actual tactical result, not merely whether the clicked point
 * matches a stored coordinate. Equivalent capturing/escaping moves are accepted.
 */
export function isLevelSolved(level: Level, game: GoGame, vertex: Vertex, captured: number): boolean {
  const target = level.target?.[0]
  const targetColor = target ? game.board.get(target) : 0
  switch(level.goal) {
    case 'capture': return captured >= (level.minCaptures || 1)
    case 'survive': return !!target && game.board.getLiberties(target).length > 1
    case 'connect': {
      if(!level.target || level.target.length<2 || !game.board.get(level.target[0])) return false
      const group=new Set(groupAt(game,level.target[0]).map(key))
      return level.target.every(at=>group.has(key(at))) && game.board.getLiberties(level.target[0]).length>1
    }
    case 'double-atari': {
      const seen=new Set<string>();let ataris=0
      for(let y=0;y<game.size;y++)for(let x=0;x<game.size;x++){
        const at=v(x,y)
        if(game.board.get(at)!==-level.turn || seen.has(key(at)))continue
        const group=groupAt(game,at);group.forEach(p=>seen.add(key(p)))
        if(game.board.getLiberties(at).length===1)ataris++
      }
      return ataris>=2
    }
    case 'cut': {
      if(!level.target || level.target.length<2)return false
      const adjacent=level.target.every(at=>Math.abs(at[0]-vertex[0])+Math.abs(at[1]-vertex[1])===1)
      const group=new Set(groupAt(game,level.target[0]).map(key))
      return adjacent && !group.has(key(level.target[1])) && game.board.getLiberties(vertex).length>1
    }
    case 'net': return same(vertex,level.solution) && !!target && !!targetColor && game.board.getLiberties(target).length<=4
    case 'ladder': return !!target && (captured>0 || (!!targetColor && game.board.getLiberties(target).length===1))
    case 'make-eye': return !!target && eyeCount(game,target)>=2
    case 'break-eye': return same(vertex,level.solution) && (!target || eyeCount(game,target)<2)
    case 'throw-in': return same(vertex,level.solution) && !!target && eyeCount(game,target)<2
    case 'snapback': return same(vertex,level.solution) && game.board.getLiberties(vertex).length===1
    case 'semeai': return captured>0 || (!!target && !!targetColor && game.board.getLiberties(target).length===1)
    case 'score': {
      if(captured < (level.minCaptures||1))return false
      const score=scoreArea(game.board.signMap as (Color|0)[][])
      return Number.isFinite(score.diff)
    }
  }
}

export const LESSONS = [
  ['初识围棋', '黑白与天地', '围棋交替落子，黑先白后。棋子落在交叉点，落子后通常不再移动。目标是围地与生存，而非一味吃子。'],
  ['气与提子', '棋盘上的呼吸', '直线相邻的空点是气。整体无气即被提取；斜线相邻不算连接。'],
  ['禁入点', '何处不能落子', '若一手落下后己方无气且不能提对方，就是禁入点。能提子时则可以落入。'],
  ['打劫', '一子不可即提', '劫争避免棋局无限循环。被提劫后须先在别处落一手，才可回提。'],
  ['连接与分断', '棋形的骨骼', '实接最稳，虎、飞、跳各有用途。分断对方前要留意自身断点。'],
  ['眼与做活', '两只真眼', '独立且无法被同时填去的两只眼，让棋块永久拥有气。假眼会在关键时刻被破。'],
  ['打吃与逃跑', '一线的抉择', '只剩一气就是打吃。逃跑要计算长、接、虎与反打后的整块气数。'],
  ['征子', '斜线上的阶梯', '连续打吃形成征子。必须提前检查征子路径上的引征棋。'],
  ['枷吃与门吃', '不必步步叫吃', '用更宽的控制封锁出路。枷吃追求棋形效率，而非紧贴对方。'],
  ['倒扑', '舍弃一子的艺术', '主动送吃一子，让对方提后仍只剩一气，随即回提更多棋子。'],
  ['布局原则', '金角银边草肚皮', '角部最易成空，边次之，中腹最难。开局兼顾实地与外势。'],
  ['占角与挂角', '第一步的方向', '星位重速度，小目偏实地，三三直接取角。挂角是限制对方守角的常见手段。'],
  ['定式', '局部的合理分寸', '定式不是标准答案。根据周围配置选择，避免机械背诵。'],
  ['厚薄与轻重', '看不见的力量', '厚势能支援未来战斗；孤棋要轻灵处理，不要让每颗子都变成包袱。'],
  ['先手与后手', '棋局的主动权', '先手迫使对方回应。保留先手交换，能在中盘积累巨大价值。'],
  ['攻击与治孤', '攻彼顾我', '攻击未必为了吃棋，借攻击围空、补强或争先同样可贵。'],
  ['中盘战斗', '计算与判断', '先读气与断点，再读征子和对杀。每次出手前，先比较双方最强应手。'],
  ['形势判断', '心中有数', '估算双方实地、外势与孤棋负担，决定该拼搏、简明还是收官。'],
  ['打入与侵消', '深入的分寸', '对方模样过大时，打入求活或侵消压缩。选点须留退路。'],
  ['收官基础', '一目也要争', '优先双先，再单先，最后逆收与后手。计算每手的实际目数。'],
  ['终局与数目', '收尽单官', '双方确认无有效手段后终局。弈境采用中国面积规则的简化数子，白贴 6.5 目。'],
  ['复盘方法', '从疑问开始', '先找三个转折，再比较候选点。不要只看胜率，要理解每一步改变了什么。'],
  ['计算训练', '一看二算三比较', '先列候选，再预想最强反击，最后比较结果。每天短练比偶尔长练更有效。'],
  ['宗师心法', '取舍与平衡', '围棋没有孤立的好棋。配合全局、保留变化、懂得舍弃，才是由技入道。'],
] as const
