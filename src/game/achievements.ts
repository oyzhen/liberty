import type { Achievement, Profile } from "./goTypes";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-stone",
    title: "落子有声",
    description: "完成第一次有效落子",
    icon: "●",
    reward: 20,
    target: 1,
    progress: p => p.stats.stones,
  },
  {
    id: "first-win",
    title: "旗开得胜",
    description: "赢得第一场对局",
    icon: "胜",
    reward: 60,
    target: 1,
    progress: p => p.stats.wins,
  },
  {
    id: "ten-levels",
    title: "渐入佳境",
    description: "通过 10 个闯关",
    icon: "拾",
    reward: 100,
    target: 10,
    progress: p => p.completed.length,
  },
  {
    id: "fifty-levels",
    title: "五十而知棋",
    description: "通过 50 个闯关",
    icon: "悟",
    reward: 250,
    target: 50,
    progress: p => p.completed.length,
  },
  {
    id: "hundred-levels",
    title: "百里挑一",
    description: "通过 100 个闯关",
    icon: "百",
    reward: 600,
    target: 100,
    progress: p => p.completed.length,
  },
  {
    id: "five-hundred",
    title: "行至半山",
    description: "通过 500 个闯关",
    icon: "岳",
    reward: 1500,
    target: 500,
    progress: p => p.completed.length,
  },
  {
    id: "all-levels",
    title: "千局无界",
    description: "完成全部 1000 关",
    icon: "境",
    reward: 5000,
    target: 1000,
    progress: p => p.completed.length,
  },
  {
    id: "capture-10",
    title: "提子入门",
    description: "累计提取 10 枚棋子",
    icon: "提",
    reward: 50,
    target: 10,
    progress: p => p.stats.captures,
  },
  {
    id: "capture-100",
    title: "攻守有度",
    description: "累计提取 100 枚棋子",
    icon: "破",
    reward: 200,
    target: 100,
    progress: p => p.stats.captures,
  },
  {
    id: "streak-3",
    title: "连中三元",
    description: "连续答对 3 道棋题",
    icon: "三",
    reward: 90,
    target: 3,
    progress: p => p.stats.streak,
  },
  {
    id: "streak-10",
    title: "算无遗策",
    description: "连续答对 10 道棋题",
    icon: "算",
    reward: 300,
    target: 10,
    progress: p => p.stats.streak,
  },
  {
    id: "lessons-5",
    title: "温故知新",
    description: "完成 5 节课程",
    icon: "书",
    reward: 120,
    target: 5,
    progress: p => p.stats.lessons,
  },
  {
    id: "lessons-all",
    title: "学贯古今",
    description: "完成全部 12 节互动入门课",
    icon: "典",
    reward: 800,
    target: 12,
    progress: p => p.stats.lessons,
  },
  {
    id: "first-review",
    title: "复盘者",
    description: "完成一次棋谱解读",
    icon: "谱",
    reward: 80,
    target: 1,
    progress: p => p.stats.reviews,
  },
  {
    id: "first-exam",
    title: "段位启程",
    description: "完成首次段位考核",
    icon: "段",
    reward: 100,
    target: 1,
    progress: p => p.stats.exams,
  },
  {
    id: "rank-1d",
    title: "入段之礼",
    description: "评级达到业余 1 段",
    icon: "壹",
    reward: 500,
    target: 1,
    progress: p => (p.rating >= 1600 ? 1 : 0),
  },
  {
    id: "pet-5",
    title: "灵犀相伴",
    description: "灵宠成长到 5 级",
    icon: "灵",
    reward: 160,
    target: 5,
    progress: p => p.petLevel,
  },
  {
    id: "pet-10",
    title: "山海同游",
    description: "灵宠成长到 10 级",
    icon: "游",
    reward: 500,
    target: 10,
    progress: p => p.petLevel,
  },
  {
    id: "no-hint",
    title: "二十突破",
    description: "累计通过 20 个关卡",
    icon: "思",
    reward: 150,
    target: 20,
    progress: p => p.completed.length,
  },
  {
    id: "games-10",
    title: "以棋会友",
    description: "完成 10 场对局",
    icon: "友",
    reward: 180,
    target: 10,
    progress: p => p.stats.games,
  },
];

export function syncAchievements(profile: Profile): string[] {
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (
      !profile.achievements.includes(a.id) &&
      a.progress(profile) >= a.target
    ) {
      profile.achievements.push(a.id);
      profile.coins += a.reward;
      profile.xp += Math.round(a.reward / 2);
      unlocked.push(a.id);
    }
  }
  return unlocked;
}
