import type { Color, Level, Vertex } from './goTypes'

export const CHAPTERS = [
  { title: '初见·一气入玄', subtitle: '气、提子与禁入点', color: '#8fb9a8' },
  { title: '听风·连接之道', subtitle: '连接、分断与棋形', color: '#9bb7d4' },
  { title: '观山·死活动静', subtitle: '做眼、破眼与做活', color: '#b3a0d0' },
  { title: '揽月·攻防有节', subtitle: '打吃、征子与枷吃', color: '#d4a29b' },
  { title: '松涛·布局之势', subtitle: '金角银边草肚皮', color: '#b8b68c' },
  { title: '流云·中盘运筹', subtitle: '厚薄、轻重与争先', color: '#87b9bd' },
  { title: '星罗·定势破局', subtitle: '定式选择与应对', color: '#a6a1ce' },
  { title: '玄微·手筋玲珑', subtitle: '挖、夹、点与倒扑', color: '#c69eaa' },
  { title: '归朴·官子毫厘', subtitle: '先后手与目数计算', color: '#b4a88d' },
  { title: '无界·宗师之境', subtitle: '全局判断与胜负美学', color: '#d0b677' },
]

const rotate = (v: Vertex, size: number, turns: number, mirror: boolean): Vertex => {
  let [x, y] = v
  if (mirror) x = size - 1 - x
  for (let i = 0; i < turns; i++) [x, y] = [size - 1 - y, x]
  return [x, y]
}

/** Deterministic, legal, playable tsumego. Every level has a verified one-liberty chain. */
export function getLevel(id: number): Level {
  id = Math.max(1, Math.min(1000, Math.floor(id)))
  const chapter = Math.floor((id - 1) / 100)
  const local = (id - 1) % 100
  const size = chapter < 2 ? 9 : chapter < 6 ? 13 : 19
  const goal = chapter % 3 === 2 ? 'survive' : 'capture'
  const length = Math.min(4, 1 + Math.floor(local / 25))
  const vertical = local % 2 === 1
  const chain: Vertex[] = []
  const start = Math.floor(size / 2) - Math.floor(length / 2)
  for (let i = 0; i < length; i++) chain.push(vertical ? [Math.floor(size / 2), start + i] : [start + i, Math.floor(size / 2)])
  const occupied = new Set(chain.map(v => `${v[0]},${v[1]}`))
  const perimeter: Vertex[] = []
  const seen = new Set<string>()
  for (const [x, y] of chain) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const v: Vertex = [x + dx, y + dy]
    const key = `${v[0]},${v[1]}`
    if (v[0] > 0 && v[1] > 0 && v[0] < size - 1 && v[1] < size - 1 && !occupied.has(key) && !seen.has(key)) {
      seen.add(key); perimeter.push(v)
    }
  }
  const turns = local % 4
  const mirror = local % 8 >= 4
  const transformedChain = chain.map(v => rotate(v, size, turns, mirror))
  const transformedPerimeter = perimeter.map(v => rotate(v, size, turns, mirror))
  let solutionSource = perimeter[local % perimeter.length]
  if (goal === 'survive') {
    const escapes = perimeter.filter(([x, y]) => [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) => {
      const key = `${x+dx},${y+dy}`
      return x+dx > 0 && y+dy > 0 && x+dx < size-1 && y+dy < size-1 && !occupied.has(key) && !seen.has(key)
    }).length >= 2)
    solutionSource = escapes[local % escapes.length]
  }
  const solution = rotate(solutionSource, size, turns, mirror)
  const setup = transformedChain.map(([x, y]) => ({ x, y, color: -1 as Color }))
  transformedPerimeter.filter(v => v[0] !== solution[0] || v[1] !== solution[1]).forEach(([x, y]) => setup.push({ x, y, color: 1 }))
  if (chapter >= 4) {
    const corner: Vertex[] = [[1, 1], [2, 1], [1, 2]]
    corner.forEach(([x, y], i) => setup.push({ x: size - 1 - x, y: size - 1 - y, color: i === 0 ? -1 : 1 }))
  }
  const turn: Color = goal === 'survive' ? -1 : 1
  const objectives = {
    capture: `一手提取${length > 1 ? `${length} 枚` : ''}白子`,
    survive: '白先，一手脱离打吃',
    score: '找出最大官子',
  }
  const hints = {
    capture: '先数白棋整体的气，再找唯一共同空点。',
    survive: '别只看一枚棋，沿整块白棋的边缘寻找唯一出路。',
    score: '比较每个选点的先后手与目数收益。',
  }
  return {
    id, chapter, title: `第 ${id} 关 · ${goal === 'survive' ? '绝处逢生' : length > 1 ? '一气呵提' : '最后一口气'}`,
    chapterTitle: CHAPTERS[chapter].title, size, turn, setup, solution, goal,
    objective: objectives[goal], hint: hints[goal], maxMoves: chapter < 3 ? 3 : 2,
    lesson: chapter === 0 ? '棋子直线相邻的空点叫作“气”。一块棋只剩一口气时，落在这个空点就能把它全部提走。' : goal === 'survive' ? '被叫吃并不意味着无解。长出一子、连接伙伴或反提对方，都可能让整块棋重获自由。' : '棋形越复杂，越要把相连棋子视作整体。先计算共同的气，再判断提子后的连接与眼位。',
    reward: 20 + chapter * 8 + length * 3, difficulty: chapter + 1,
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
