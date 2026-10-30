import { GoGame } from "./rules";
import type { Color, Vertex } from "./goTypes";

export type AcademyGoal =
  | "play"
  | "points"
  | "capture"
  | "escape"
  | "connect"
  | "illegal"
  | "ko"
  | "eyes"
  | "cut"
  | "double-atari";

export interface AcademyStone {
  x: number;
  y: number;
  color: Color;
}

export interface AcademyLesson {
  id: number;
  title: string;
  subtitle: string;
  mission: string;
  story: string;
  buddy: string;
  minutes: number;
  size: number;
  turn: Color;
  setup: AcademyStone[];
  preMoves?: { color: Color; vertex: Vertex }[];
  goal: AcademyGoal;
  solution: Vertex;
  targets: Vertex[];
  minCaptures?: number;
  explanation: string[];
  remember: string;
  instruction: string;
  hint: string;
  success: string;
  demoLiberties?: Vertex;
  demoTerritory?: Vertex[];
  quiz: {
    question: string;
    options: string[];
    answer: number;
    explanations: string[];
  };
}

const v = (x: number, y: number): Vertex => [x, y];
const stones = (color: Color, points: Vertex[]): AcademyStone[] =>
  points.map(([x, y]) => ({ x, y, color }));
const B = (points: Vertex[]) => stones(1, points);
const W = (points: Vertex[]) => stones(-1, points);

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 1,
    title: "棋子的新家",
    subtitle: "认识交叉点与黑白轮流",
    mission: "帮第一颗小棋子找到家",
    story: "棋灵团子刚来到棋盘村。这里的“房子”不是方格，而是线条相遇的交叉点。",
    buddy: "别急，先随便选一个空交叉点，放下你的第一颗棋子！",
    minutes: 2,
    size: 5,
    turn: 1,
    setup: [],
    goal: "play",
    solution: v(2, 2),
    targets: [],
    explanation: [
      "棋子要落在线与线相交的地方，不能睡在方格中央。落下以后，通常不再移动。",
      "黑棋先走，白棋再走，双方每次在空交叉点落下一子，轮流进行。",
    ],
    remember: "棋子住交叉点，黑先白后轮流下。",
    instruction: "在任意一个空交叉点落下黑棋，让团子安家。",
    hint: "棋盘中央就是一个好位置，边角也可以。",
    success: "第一颗棋子安家成功！你已经会下棋的第一步了。",
    quiz: {
      question: "下面哪个位置可以落子？",
      options: ["方格正中央", "空着的交叉点", "已经有棋子的交叉点"],
      answer: 1,
      explanations: [
        "方格中央没有线条相交，不是棋子的家。",
        "答对了！棋子落在空交叉点上。",
        "一个交叉点只能住一颗棋子，要另找空点。",
      ],
    },
  },
  {
    id: 2,
    title: "小棋子要呼吸",
    subtitle: "认识“气”：上下左右才算",
    mission: "找出小棋子的四个呼吸口",
    story: "棋子也需要呼吸。与它上下左右直接相连的空交叉点，叫作“气”。",
    buddy: "斜着可碰不到它！点亮中间黑棋的四口气吧。",
    minutes: 3,
    size: 5,
    turn: 1,
    setup: B([v(2, 2)]),
    goal: "points",
    solution: v(1, 2),
    targets: [v(1, 2), v(3, 2), v(2, 1), v(2, 3)],
    explanation: [
      "看一颗棋子上下左右的相邻点：空着几个，就有几口气。棋盘中央单独的棋子通常有四口气。",
      "斜角虽然离得近，但没有线直接相连，所以不算气。边和角上的棋子，气会更少。",
    ],
    remember: "气在上下左右，斜角不算；气是空点。",
    instruction: "依次点击黑棋的四口气。找齐后就能完成任务。",
    hint: "从黑棋出发，沿横线和竖线各走一格。",
    success: "四口气全部找到了！小棋子现在呼吸顺畅。",
    demoLiberties: v(2, 2),
    quiz: {
      question: "棋盘中央的一颗独立黑棋，有几口气？",
      options: ["两口", "三口", "四口"],
      answer: 2,
      explanations: [
        "还漏掉了两个方向。沿着黑棋的横线、竖线再数一次。",
        "这是棋子落在边上的常见气数，中央还有更多空间。",
        "答对了！上下左右各一口，一共四口气。",
      ],
    },
  },
  {
    id: 3,
    title: "堵住最后一口气",
    subtitle: "没有气的棋子会被提走",
    mission: "完成第一次提子",
    story: "白棋只剩一个呼吸口了。堵住它，白棋就会离开棋盘，成为你的战利品。",
    buddy: "先数白棋的气，再落在唯一的空点上。别只围着它转哦！",
    minutes: 3,
    size: 5,
    turn: 1,
    setup: [...W([v(2, 2)]), ...B([v(1, 2), v(3, 2), v(2, 1)])],
    goal: "capture",
    solution: v(2, 3),
    targets: [v(2, 2)],
    minCaptures: 1,
    explanation: [
      "一块棋的气全部被对方占住，它就会立刻被提走。提子不是把棋子移开，而是按规则收走。",
      "图中白棋上方、左方、右方都有黑棋，只剩下方一口气。黑棋落在那里就能提子。",
    ],
    remember: "对方没气就提走；最后一口气是关键。",
    instruction: "落下黑棋，堵住白棋最后一口气，把它提出棋盘。",
    hint: "白棋下方还空着一个交叉点。",
    success: "提子成功！你找到了最后一口气，也完成了第一次包围。",
    demoLiberties: v(2, 2),
    quiz: {
      question: "一颗白棋的气全被黑棋堵住，会发生什么？",
      options: ["白棋原地翻面", "白棋被提走", "双方各停一手"],
      answer: 1,
      explanations: [
        "围棋棋子不会翻面，黑白也不会改变。",
        "答对了！没有气的棋子要立刻从棋盘上拿掉。",
        "不需要停手，堵住最后一口气的那一手已经完成提子。",
      ],
    },
  },
  {
    id: 4,
    title: "危险，快跑！",
    subtitle: "认识打吃，并学会逃跑",
    mission: "救出只剩一口气的黑棋",
    story:
      "团子被白棋围得只剩一口气，这叫“打吃”。轮到你了，快帮它向空旷处延长！",
    buddy: "逃不是乱跳。落在最后一口气上，看看它的呼吸是不是变多了。",
    minutes: 3,
    size: 5,
    turn: 1,
    setup: [...B([v(2, 2)]), ...W([v(1, 2), v(3, 2), v(2, 1)])],
    goal: "escape",
    solution: v(2, 3),
    targets: [v(2, 2)],
    explanation: [
      "一块棋只剩一口气时，就叫“打吃”，意思是对方下一手可能把它提走。",
      "把自己的棋向空处长一手，通常能增加气数。图中黑棋向下长后，会重新拥有三口气。",
    ],
    remember: "只剩一气叫打吃；向空处长，可以逃跑。",
    instruction: "在黑棋最后一口气上落子，让它脱离打吃。",
    hint: "黑棋下方还空着，向下长一手。",
    success: "救援成功！黑棋从一口气变成三口气，暂时安全了。",
    demoLiberties: v(2, 2),
    quiz: {
      question: "你的棋被打吃时，最需要先做什么？",
      options: ["检查怎样增加它的气", "马上停一手", "把棋子移到别处"],
      answer: 0,
      explanations: [
        "答对了！常见逃法是向空处长一手，也可以连接伙伴或反提对方。",
        "停手不会增加气，对方下一手就能提走它。",
        "落子后不能随意移动，要用新的一手帮助它。",
      ],
    },
  },
  {
    id: 5,
    title: "伙伴牵起手",
    subtitle: "连接后共享气，更有力量",
    mission: "把两颗黑棋连成一队",
    story:
      "两颗黑棋隔着一条小路。让它们牵起手，就能变成一整块棋，一起共享呼吸口。",
    buddy: "找两颗黑棋中间的空点。连起来以后，就不要再把它们分开数气啦！",
    minutes: 3,
    size: 5,
    turn: 1,
    setup: [
      ...B([v(1, 2), v(3, 2)]),
      ...W([v(0, 2), v(4, 2), v(1, 1), v(3, 1)]),
    ],
    goal: "connect",
    solution: v(2, 2),
    targets: [v(1, 2), v(3, 2)],
    explanation: [
      "上下左右直接相连的同色棋子是一块棋。它们共享气，也会一起被提走。",
      "图中落在两颗黑棋中间，就把它们实接成一队。伙伴越多，往往越容易保住气。",
    ],
    remember: "相连就是一块棋，共享气，也同生共死。",
    instruction: "落在两颗黑棋之间，把它们连接成一整块。",
    hint: "答案就在两颗黑棋正中间。",
    success: "牵手成功！三颗黑棋现在是一块棋，可以一起呼吸。",
    quiz: {
      question: "两颗黑棋实接以后，它们的气怎样计算？",
      options: ["各算各的", "合在一起数", "气数自动变成四"],
      answer: 1,
      explanations: [
        "它们已经是一整块棋，不能再分开计算。",
        "答对了！把整块棋周围的空点合起来数，重复的点只数一次。",
        "气数由周围空点决定，不是固定变成四。",
      ],
    },
  },
  {
    id: 6,
    title: "神秘的禁入点",
    subtitle: "没有气又不能提子，就不能下",
    mission: "找出白棋不能落子的地方",
    story:
      "棋盘村出现了一间“没有空气的小屋”。白棋进去后没有气，也吃不到黑棋，所以规则不允许这手棋。",
    buddy: "试着点击黑棋包围的中心。被规则拦下，这次反而是你答对了！",
    minutes: 4,
    size: 5,
    turn: -1,
    setup: B([v(1, 2), v(3, 2), v(2, 1), v(2, 3)]),
    goal: "illegal",
    solution: v(2, 2),
    targets: [v(2, 2)],
    explanation: [
      "如果一手棋落下后，自己和相连伙伴都没有气，而且也不能提走对方，这个点就是禁入点。",
      "注意：如果这手能提走对方，提子后自己就会有气，那是可以下的，不是禁入点。",
    ],
    remember: "无气且不能提子，才是禁入点。",
    instruction: "点击中央空点，亲自验证为什么白棋不能下在这里。",
    hint: "黑棋围成的中心，就是本次要验证的禁入点。",
    success: "验证成功！这手会被规则拦下，因为它无气可呼吸，也不能提子。",
    quiz: {
      question: "哪种情况属于禁入点？",
      options: [
        "落下后自己有气",
        "落下后能提走对方",
        "落下后自己无气，也不能提子",
      ],
      answer: 2,
      explanations: [
        "有气就可以正常呼吸，这手通常是合法的。",
        "能提子就不是禁入点，因为提完后会出现新的气。",
        "答对了！两个条件必须同时成立。",
      ],
    },
  },
  {
    id: 7,
    title: "不能马上抢回来",
    subtitle: "认识打劫：先找劫材",
    mission: "通过“回提试验”认识打劫",
    story:
      "黑白双方正好能互相提回一子。如果允许立刻抢回，就会无限循环，所以“劫”规则会来暂停这场拉锯。",
    buddy: "黑棋刚提走一子。试着马上回原位提回来，看看规则怎样保护棋局。",
    minutes: 4,
    size: 5,
    turn: 1,
    setup: [
      ...B([v(1, 2), v(3, 2), v(2, 1)]),
      ...W([v(2, 2), v(1, 3), v(3, 3), v(2, 4)]),
    ],
    preMoves: [{ color: 1, vertex: v(2, 3) }],
    goal: "ko",
    solution: v(2, 2),
    targets: [v(2, 2)],
    explanation: [
      "当双方可以反复提回同一颗棋子时，就会形成“劫”。刚被提的一方不能立刻在原位回提。",
      "正确思路是先在别处下一手，制造对方必须回应的威胁，这叫“找劫材”。等棋形变化后，才可能回提。",
    ],
    remember: "打劫不能立即回提，先在别处找劫材。",
    instruction: "试着立即点击原位回提。发现“劫”规则，就完成本课试验。",
    hint: "黑棋刚刚提子的位置，就是现在要尝试的回提点。",
    success: "发现打劫！这一手现在被禁止，避免了无限来回提子。",
    quiz: {
      question: "遇到打劫，刚被提的一方应该怎么办？",
      options: ["立刻原位回提", "先在别处找劫材", "直接结束整盘棋"],
      answer: 1,
      explanations: [
        "这正是劫规则暂时禁止的动作。",
        "答对了！先在别处制造威胁，之后才可能有回提机会。",
        "打劫只是局部战斗，不需要因此结束整盘棋。",
      ],
    },
  },
  {
    id: 8,
    title: "建造两座安全屋",
    subtitle: "两只真眼让一块棋活起来",
    mission: "补好第二只眼，让黑棋做活",
    story:
      "一块大棋要长久安全，可以建造两个彼此分开的“小房间”。它们叫作眼，两只真眼让对手无法同时堵住。",
    buddy: "黑棋已经有一只眼。补上中间的关键点，就能隔出第二只眼！",
    minutes: 4,
    size: 5,
    turn: 1,
    setup: [
      ...B([
        v(1, 0),
        v(3, 0),
        v(0, 1),
        v(1, 1),
        v(3, 1),
        v(4, 1),
        v(1, 2),
        v(3, 2),
        v(2, 3),
      ]),
      ...W([v(0, 2), v(4, 2), v(4, 0), v(0, 3), v(1, 3), v(3, 3), v(2, 4)]),
    ],
    goal: "eyes",
    solution: v(2, 1),
    targets: [v(1, 0)],
    explanation: [
      "被一整块同色棋围住的空点可以形成眼。两个彼此分开的真眼，会让整块棋始终保有气。",
      "图中黑棋落在中央，就把上方和下方各隔出一只眼。这样的黑棋已经成为活棋。",
    ],
    remember: "两只独立真眼，是活棋的安全保证。",
    instruction: "落在黑棋中央的空点，补出两只真眼。",
    hint: "要补的点在整队黑棋的正中央，能把两只眼隔开。",
    success: "两座安全屋建好了！黑棋拥有两只真眼，成功做活。",
    quiz: {
      question: "为什么两只真眼能让一块棋活下来？",
      options: ["棋子会变成白色", "对方无法同时填满两只眼", "这块棋可以移动"],
      answer: 1,
      explanations: [
        "眼不会改变棋子的颜色。",
        "答对了！对方不能一手同时进入两处无气点，因此无法提走这块棋。",
        "活棋仍然不会移动，安全来自棋形与规则。",
      ],
    },
  },
  {
    id: 9,
    title: "切断伙伴的路",
    subtitle: "分断，让对手不能共享气",
    mission: "把两块白棋分成两队",
    story:
      "两块白棋正准备牵手。抢住它们之间的要点，就能切断联络，让它们各自寻找气。",
    buddy: "别只盯着一颗白棋。找两块白棋都想经过的交叉点！",
    minutes: 4,
    size: 5,
    turn: 1,
    setup: [
      ...W([v(2, 2), v(3, 3)]),
      ...B([v(1, 2), v(2, 1), v(4, 3), v(3, 4)]),
    ],
    goal: "cut",
    solution: v(3, 2),
    targets: [v(2, 2), v(3, 3)],
    explanation: [
      "对方棋子没有直接相连时，抢占联络要点，可以让它们难以合成一块，这叫分断。",
      "图中黑棋同时贴近两块白棋，又给自己留下两口气。分断之后，就可以分别施加压力。",
    ],
    remember: "连接能共享气；分断能削弱对手。",
    instruction: "落在两块白棋之间的联络要点，把它们分断。",
    hint: "答案同时与两块白棋上下左右相邻。",
    success: "分断成功！两块白棋不能共享气，你掌握了进攻的第一步。",
    quiz: {
      question: "分断对手的主要作用是什么？",
      options: ["让棋子改变颜色", "让对手不能共享气", "让自己的棋子移动两格"],
      answer: 1,
      explanations: [
        "分断只改变棋块关系，不会改变颜色。",
        "答对了！不能共享气的两块棋，需要各自照顾自己的安全。",
        "棋子不会移动，分断靠的是落下新的一子。",
      ],
    },
  },
  {
    id: 10,
    title: "一手制造两个警报",
    subtitle: "双打吃，让对手顾此失彼",
    mission: "同时打吃两块白棋",
    story:
      "两块白棋都想从同一个路口呼吸。黑棋占住那里，就能同时拉响两个“只剩一口气”的警报。",
    buddy: "寻找两块白棋共用的气。一手两个打吃，对手通常只能救一边！",
    minutes: 4,
    size: 5,
    turn: 1,
    setup: [
      ...W([v(1, 2), v(3, 2)]),
      ...B([v(0, 2), v(1, 1), v(4, 2), v(3, 1)]),
    ],
    goal: "double-atari",
    solution: v(2, 2),
    targets: [v(1, 2), v(3, 2)],
    explanation: [
      "一手棋同时让两块对方棋各只剩一口气，叫作双打吃。对方通常无法一手救下两边。",
      "这里两块白棋共用中央的气。黑棋落在中央后，两块白棋都只剩下方一口气。",
    ],
    remember: "找两块棋共用的气，一手打吃两边。",
    instruction: "落在两块白棋共用的气上，完成双打吃。",
    hint: "两块白棋正中间的空点，就是共用的气。",
    success: "双警报拉响！两块白棋同时被打吃，你制造了双重威胁。",
    demoLiberties: v(1, 2),
    quiz: {
      question: "双打吃最厉害的地方是什么？",
      options: ["可以连续走两手", "一手同时威胁两块棋", "可以移动对方棋子"],
      answer: 1,
      explanations: [
        "仍然是一人一手，只是这一手制造了两个威胁。",
        "答对了！对方通常只能救一块，另一块可能被提。",
        "你的棋子不会移动对方棋子，提子也必须符合气的规则。",
      ],
    },
  },
  {
    id: 11,
    title: "围地寻宝",
    subtitle: "胜负不只比吃子，更比围地",
    mission: "找出黑棋围住的两目地",
    story:
      "棋盘不只是吃子的战场，也是圈地的地图。用活棋围住空点，那里就会变成你的领地。",
    buddy: "左上角有两个被黑棋包围的空点。把它们都找出来，收下两目宝藏！",
    minutes: 3,
    size: 5,
    turn: 1,
    setup: B([v(2, 0), v(0, 1), v(1, 1), v(2, 1)]),
    goal: "points",
    solution: v(0, 0),
    targets: [v(0, 0), v(1, 0)],
    explanation: [
      "被一方活棋围住、只与这一方棋子相邻的空点，是这一方的地。每一个这样的空点通常算一目。",
      "终局会比较双方活棋、围住的空点以及贴目。吃子能帮助围地，但吃得最多不一定就赢。",
    ],
    remember: "围住的空点也是目；赢棋比的是全局。",
    instruction: "点击左上角两个被黑棋围住的空点，找出这两目地。",
    hint: "两个空点并排躺在棋盘最上边的左角。",
    success: "找到两目宝藏！你已经知道，围棋不是只比吃子。",
    demoTerritory: [v(0, 0), v(1, 0)],
    quiz: {
      question: "一盘棋里，吃子很多就一定能赢吗？",
      options: ["一定能", "不一定，还要看围地与全局", "只要没提子就输"],
      answer: 1,
      explanations: [
        "吃子只是手段之一，不能单独决定胜负。",
        "答对了！终局要比较活棋、围住的空点和贴目。",
        "不提子也可能围到很多地，同样可能获胜。",
      ],
    },
  },
  {
    id: 12,
    title: "毕业任务：选大的",
    subtitle: "综合运用气、提子与价值判断",
    mission: "选择价值更大的提子",
    story:
      "最后的毕业试炼来了：棋盘上有一处能提一颗子，另一处能提三颗子。真正的小棋士会比较后再选择。",
    buddy: "两处都能提子，但价值不同。先数目标有多少颗，再决定这一手！",
    minutes: 5,
    size: 9,
    turn: 1,
    setup: [
      ...W([v(3, 4), v(4, 4), v(5, 4), v(1, 1)]),
      ...B([
        v(2, 4),
        v(6, 4),
        v(3, 3),
        v(4, 3),
        v(5, 3),
        v(3, 5),
        v(5, 5),
        v(0, 1),
        v(2, 1),
        v(1, 0),
      ]),
    ],
    goal: "capture",
    solution: v(4, 5),
    targets: [v(3, 4), v(4, 4), v(5, 4)],
    minCaptures: 3,
    explanation: [
      "综合运用今天学到的方法：先找气，再判断能否提子，最后比较两处棋的价值。",
      "中间三颗白棋已经连成一块，只剩最后一口气。提走它们，比提左上角单独的一颗白棋收获更大。",
    ],
    remember: "先计算，再选择；同样一手棋，价值可以不同。",
    instruction: "找到能一次提走三颗白棋的点，完成毕业任务。",
    hint: "观察中间横向相连的三颗白棋，它们下方还有最后一口气。",
    success: "毕业任务完成！你已经掌握入门十二课，可以开始九路棋的第一局了。",
    demoLiberties: v(4, 4),
    quiz: {
      question: "一手能提一颗子，另一手能提三颗子，其他条件相近时怎么选？",
      options: ["通常优先提三颗", "随便选，价值完全相同", "必须停一手"],
      answer: 0,
      explanations: [
        "答对了！先计算，再比较，通常优先选择收获更大的着手。",
        "同样是一手棋，提子数量和后续价值可能很不一样。",
        "有更有价值的合法着手时，没有必要因为犹豫而停手。",
      ],
    },
  },
];

export function createAcademyGame(lesson: AcademyLesson): GoGame {
  const game = new GoGame(lesson.size, lesson.setup, lesson.turn);
  for (const move of lesson.preMoves || []) {
    const result = game.play(move.vertex, move.color);
    if (!result.ok)
      throw new Error(`课程 ${lesson.id} 的演示棋形无效：${result.reason}`);
  }
  return game;
}

const key = (at: Vertex) => `${at[0]},${at[1]}`;
const same = (a: Vertex, b: Vertex) => key(a) === key(b);

export function academyGroup(game: GoGame, start: Vertex): Vertex[] {
  const color = game.board.get(start);
  if (!color) return [];
  const seen = new Set<string>();
  const queue = [start];
  const group: Vertex[] = [];
  while (queue.length) {
    const at = queue.shift()!;
    if (seen.has(key(at))) continue;
    seen.add(key(at));
    group.push(at);
    for (const neighbor of game.board.getNeighbors(at)) {
      if (game.board.get(neighbor) === color && !seen.has(key(neighbor)))
        queue.push(neighbor);
    }
  }
  return group;
}

export function academyEyeCount(game: GoGame, start: Vertex): number {
  const color = game.board.get(start);
  if (!color) return 0;
  const group = new Set(academyGroup(game, start).map(key));
  const seen = new Set<string>();
  let eyes = 0;
  for (let y = 0; y < game.size; y++)
    for (let x = 0; x < game.size; x++) {
      const at = v(x, y);
      if (game.board.get(at) !== 0 || seen.has(key(at))) continue;
      const queue = [at];
      const borders = new Set<number>();
      let touches = false;
      while (queue.length) {
        const point = queue.shift()!;
        if (seen.has(key(point))) continue;
        seen.add(key(point));
        for (const neighbor of game.board.getNeighbors(point)) {
          const sign = game.board.get(neighbor) || 0;
          if (sign === 0 && !seen.has(key(neighbor))) queue.push(neighbor);
          else if (sign) borders.add(sign);
          if (group.has(key(neighbor))) touches = true;
        }
      }
      if (touches && borders.size === 1 && borders.has(color)) eyes++;
    }
  return eyes;
}

export function isAcademySolved(
  lesson: AcademyLesson,
  game: GoGame,
  vertex: Vertex,
  result: { ok: boolean; captured: number; reason?: string }
): boolean {
  if (lesson.goal === "illegal")
    return (
      !result.ok &&
      same(vertex, lesson.solution) &&
      Boolean(result.reason?.includes("禁入点"))
    );
  if (lesson.goal === "ko")
    return (
      !result.ok &&
      same(vertex, lesson.solution) &&
      Boolean(result.reason?.includes("打劫"))
    );
  if (!result.ok) return false;
  if (lesson.goal === "play") return true;
  if (lesson.goal === "capture")
    return result.captured >= (lesson.minCaptures || 1);
  const target = lesson.targets[0];
  if (lesson.goal === "escape")
    return Boolean(
      target &&
      game.board.get(target) &&
      game.board.getLiberties(target).length > 1
    );
  if (lesson.goal === "connect") {
    if (!target || !game.board.get(target)) return false;
    const group = new Set(academyGroup(game, target).map(key));
    return (
      lesson.targets.every(at => group.has(key(at))) &&
      game.board.getLiberties(target).length > 1
    );
  }
  if (lesson.goal === "eyes")
    return Boolean(
      target && game.board.get(target) && academyEyeCount(game, target) >= 2
    );
  if (lesson.goal === "cut") {
    if (lesson.targets.length < 2) return false;
    const adjacent = lesson.targets.every(
      at => Math.abs(at[0] - vertex[0]) + Math.abs(at[1] - vertex[1]) === 1
    );
    const group = new Set(academyGroup(game, lesson.targets[0]).map(key));
    return (
      adjacent &&
      !group.has(key(lesson.targets[1])) &&
      game.board.getLiberties(vertex).length > 1
    );
  }
  if (lesson.goal === "double-atari") {
    const seen = new Set<string>();
    let ataris = 0;
    for (let y = 0; y < game.size; y++)
      for (let x = 0; x < game.size; x++) {
        const at = v(x, y);
        if (game.board.get(at) !== -lesson.turn || seen.has(key(at))) continue;
        const group = academyGroup(game, at);
        group.forEach(point => seen.add(key(point)));
        if (game.board.getLiberties(at).length === 1) ataris++;
      }
    return ataris >= 2;
  }
  return false;
}

export function academyMistake(
  lesson: AcademyLesson,
  game: GoGame,
  vertex: Vertex,
  result: { ok: boolean; captured: number; reason?: string }
): string {
  if (!result.ok)
    return result.reason || "这一点现在不能下，请换一个空交叉点。";
  if (lesson.goal === "capture") {
    return result.captured > 0
      ? `这手只提走了 ${result.captured} 颗棋子，本课要寻找价值更大的三子棋块。`
      : "这手没有提子。先数目标白棋的气，找到它最后剩下的空点。";
  }
  if (lesson.goal === "escape")
    return "目标黑棋仍然很危险。落在它最后一口气上，长出后才会增加气数。";
  if (lesson.goal === "connect")
    return "两颗黑棋还没有牵手。要落在它们共同相邻的空点，才能合成一块。";
  if (lesson.goal === "eyes")
    return "这手还没有分出两只独立的眼。观察整队黑棋中央的分隔要点。";
  if (lesson.goal === "cut")
    return "两块白棋仍能联络，或者你的落点没有贴近两块棋。找它们共同相邻的要点。";
  if (lesson.goal === "double-atari")
    return "还没有同时打吃两块白棋。寻找它们共同使用的那一口气。";
  return `这一手落在 ${String.fromCharCode(65 + vertex[0])}${game.size - vertex[1]}，但还没有完成本课目标。${lesson.hint}`;
}
