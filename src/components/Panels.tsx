import { useState } from "react";
import {
  X,
  Lock,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Play,
  Pause,
  BookOpen,
  Sparkles,
  Cloud,
  RefreshCw,
  Volume2,
  Eye,
  MousePointer2,
  Keyboard,
  Smartphone,
  Trophy,
  Gift,
  MessageCircle,
  Send,
} from "lucide-react";
import { ACHIEVEMENTS } from "@/game/achievements";
import { CHAPTERS, LESSONS, getLevel } from "@/game/levels";
import type { Profile, ViewMode } from "@/game/goTypes";

export type PanelName =
  | "match"
  | "campaign"
  | "academy"
  | "review"
  | "exam"
  | "growth"
  | "achievements"
  | "settings"
  | "help"
  | null;

interface PanelProps {
  panel: PanelName;
  close: () => void;
  profile: Profile;
  setProfile: (p: Profile) => void;
  startLevel: (id: number) => void;
  startMatch: (
    mode: "ai" | "local" | "exam",
    size: number,
    difficulty: number
  ) => void;
  importSgf: (text: string) => boolean;
  exportSgf: () => void;
  reviewIndex: number;
  reviewLength: number;
  reviewSeek: (index: number) => void;
  reviewPlaying: boolean;
  setReviewPlaying: (v: boolean) => void;
  sampleSgf: string;
  notify: (message: string) => void;
  persist: (p: Profile) => void;
  askTutor: (question: string) => Promise<string>;
  testAudio: () => void;
}

const themes = [
  ["ink", "国风墨青", "#102c2b"],
  ["dream", "梦幻星紫", "#6e5191"],
  ["classical", "古典沉檀", "#704b32"],
  ["modern", "现代留白", "#bac3c4"],
  ["tech", "未来科技", "#16647c"],
  ["aesthetic", "唯美烟粉", "#9d6675"],
  ["forest", "森系苔绿", "#315f45"],
  ["night", "静谧夜蓝", "#303b68"],
  ["vermilion", "故宫朱砂", "#934b3c"],
  ["celadon", "宋韵青瓷", "#629c8d"],
  ["snow", "雪山霁色", "#9eb5c1"],
  ["golden", "盛世鎏金", "#a57a2c"],
  ["sakura", "樱花物语", "#b87489"],
];

function Shell({
  title,
  eyebrow,
  close,
  children,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className={`panel ${wide ? "panel-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="panel-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={close} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </section>
    </div>
  );
}

export default function Panels(props: PanelProps) {
  const { panel, close, profile } = props;
  const [chapter, setChapter] = useState(
    Math.floor((profile.unlocked - 1) / 100)
  );
  const [lesson, setLesson] = useState(Math.min(23, profile.stats.lessons));
  const [size, setSize] = useState(9);
  const [difficulty, setDifficulty] = useState(2);
  const [matchType, setMatchType] = useState<"ai" | "local">("ai");
  const [sgf, setSgf] = useState(props.sampleSgf);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [cloudKey, setCloudKey] = useState(profile.playerKey);
  const level = getLevel(lesson * 40 + 1);
  const ratingProgress = Math.min(
    100,
    Math.max(0, (profile.rating - 600) / 16)
  );
  const unlockedAchievements = new Set(profile.achievements);
  if (!panel) return null;

  if (panel === "match")
    return (
      <Shell title="新开一局" eyebrow="人机手谈 · 双人同枰" close={close}>
        <div className="difficulty-list">
          {[
            ["ai", "人机对弈", "与五档棋力 AI 切磋"],
            ["local", "双人对弈", "在同一设备交替落子"],
          ].map(([id, name, desc]) => (
            <button
              key={id}
              className={matchType === id ? "active" : ""}
              onClick={() => setMatchType(id as "ai" | "local")}
            >
              <b>{name}</b>
              <span>{desc}</span>
            </button>
          ))}
        </div>
        <label className="field-label">棋盘大小</label>
        <div className="segmented">
          {[9, 13, 19].map(n => (
            <button
              className={size === n ? "active" : ""}
              onClick={() => setSize(n)}
              key={n}
            >
              {n} 路
              {n === 9 ? " · 约 10 分钟" : n === 13 ? " · 进阶" : " · 完整对局"}
            </button>
          ))}
        </div>
        {matchType === "ai" && (
          <>
            <label className="field-label" style={{ marginTop: 22 }}>
              AI 棋力
            </label>
            <div className="difficulty-list">
              {[
                ["启蒙", "轻松落子", 1],
                ["入门", "基础计算", 2],
                ["进阶", "稳健攻守", 3],
                ["高手", "局部强化", 4],
                ["棋士", "全局判断", 5],
              ].map(([name, desc, n]) => (
                <button
                  key={name}
                  className={difficulty === n ? "active" : ""}
                  onClick={() => setDifficulty(Number(n))}
                >
                  <b>{name}</b>
                  <span>{desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="rules-note">
          <h3>对局规则</h3>
          <p>
            你执黑先行，白棋贴 6.5 目。双方连续停一手后自动采用面积规则数子。9
            路适合碎片时间，13 路适合进阶，19 路适合完整布局与中盘。
          </p>
        </div>
        <button
          className="primary full"
          style={{ marginTop: 22 }}
          onClick={() => {
            props.startMatch(matchType, size, difficulty);
            close();
          }}
        >
          开始手谈
        </button>
      </Shell>
    );

  if (panel === "campaign")
    return (
      <Shell title="千局修行" eyebrow="1000 关 · 十境渐进" close={close} wide>
        <div className="campaign-summary">
          <div>
            <strong>{profile.completed.length}</strong>
            <span>已通关</span>
          </div>
          <div>
            <strong>
              {Object.values(profile.stars).reduce((a, b) => a + b, 0)}
            </strong>
            <span>收集星数</span>
          </div>
          <div>
            <strong>{Math.floor(profile.completed.length / 100)}</strong>
            <span>已入境</span>
          </div>
          <p>每一关都可重复研习。三星条件：不使用提示且一次答对。</p>
        </div>
        <div className="chapter-tabs">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.title}
              className={chapter === i ? "active" : ""}
              onClick={() => setChapter(i)}
            >
              <i style={{ background: c.color }} />第{i + 1}境
            </button>
          ))}
        </div>
        <div className="chapter-title">
          <div>
            <span>第 {chapter + 1} 境</span>
            <h3>{CHAPTERS[chapter].title}</h3>
            <p>{CHAPTERS[chapter].subtitle}</p>
          </div>
          <div className="chapter-progress">
            <b>
              {
                profile.completed.filter(
                  id => Math.floor((id - 1) / 100) === chapter
                ).length
              }{" "}
              / 100
            </b>
            <span>
              <i
                style={{
                  width: `${profile.completed.filter(id => Math.floor((id - 1) / 100) === chapter).length}%`,
                }}
              />
            </span>
          </div>
        </div>
        <div className="level-grid">
          {Array.from({ length: 100 }, (_, i) => {
            const id = chapter * 100 + i + 1,
              locked = id > profile.unlocked,
              stars = profile.stars[id] || 0;
            return (
              <button
                key={id}
                disabled={locked}
                className={`${locked ? "locked" : ""} ${stars ? "done" : ""} ${id === profile.unlocked ? "current" : ""}`}
                onClick={() => {
                  props.startLevel(id);
                  close();
                }}
                aria-label={`第${id}关${locked ? "未解锁" : ""}`}
              >
                {locked ? <Lock size={13} /> : <b>{i + 1}</b>}
                <span>
                  {[1, 2, 3].map(n => (
                    <Star
                      key={n}
                      size={9}
                      fill={n <= stars ? "currentColor" : "none"}
                      className={n <= stars ? "earned" : ""}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Shell>
    );

  if (panel === "academy")
    return (
      <Shell
        title="弈境书院"
        eyebrow="从零入门 · 24 课系统研习"
        close={close}
        wide
      >
        <div className="academy-layout">
          <aside className="lesson-list">
            {LESSONS.map((l, i) => (
              <button
                key={l[0]}
                className={lesson === i ? "active" : ""}
                onClick={() => setLesson(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{l[0]}</b>
                  <small>{l[1]}</small>
                </div>
                {i < profile.stats.lessons && <Check size={15} />}
              </button>
            ))}
          </aside>
          <article className="lesson-content">
            <span className="lesson-number">
              LESSON {String(lesson + 1).padStart(2, "0")}
            </span>
            <h3>{LESSONS[lesson][0]}</h3>
            <h4>{LESSONS[lesson][1]}</h4>
            <p>{LESSONS[lesson][2]}</p>
            <div className="lesson-wisdom">
              <BookOpen size={20} />
              <p>{level.lesson}</p>
            </div>
            <div className="lesson-example">
              <span>本课修习目标</span>
              <b>{level.objective}</b>
              <p>{level.hint}</p>
            </div>
            <div className="panel-actions">
              <button
                className="secondary"
                onClick={() => setLesson(Math.max(0, lesson - 1))}
              >
                <ChevronLeft size={16} />
                上一课
              </button>
              <button
                className="primary"
                onClick={() => {
                  props.startLevel(level.id);
                  const p = {
                    ...profile,
                    stats: {
                      ...profile.stats,
                      lessons: Math.max(profile.stats.lessons, lesson + 1),
                    },
                    daily: {
                      ...profile.daily,
                      lessons: profile.daily.lessons + 1,
                    },
                  };
                  props.persist(p);
                  close();
                }}
              >
                进入实战练习
                <ChevronRight size={16} />
              </button>
            </div>
          </article>
        </div>
      </Shell>
    );

  if (panel === "review")
    return (
      <Shell
        title="棋谱解读"
        eyebrow="SGF 打谱 · 变化分析 · AI 讲棋"
        close={close}
        wide
      >
        <div className="review-layout">
          <div className="review-editor">
            <label>粘贴 SGF 棋谱，或选择本地文件</label>
            <textarea
              value={sgf}
              onChange={e => setSgf(e.target.value)}
              spellCheck={false}
            />
            <div className="panel-actions">
              <label className="secondary file-btn">
                <Upload size={16} />
                导入 .sgf
                <input
                  type="file"
                  accept=".sgf,.txt"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) setSgf(await file.text());
                  }}
                />
              </label>
              <button
                className="primary"
                onClick={() => {
                  if (props.importSgf(sgf)) {
                    props.notify("棋谱已载入，使用棋盘下方按钮打谱");
                    close();
                  }
                }}
              >
                开始解读
              </button>
            </div>
            <button
              className="text-btn"
              onClick={() => setSgf(props.sampleSgf)}
            >
              载入示例棋谱
            </button>
          </div>
          <div className="review-guide">
            <span className="eyebrow">读谱方法</span>
            <h3>
              不只记住每一步，
              <br />
              更要理解为什么。
            </h3>
            <ol>
              <li>
                <b>看气与连接</b>
                <span>落子前后，双方棋块发生了什么？</span>
              </li>
              <li>
                <b>看地与势</b>
                <span>这手棋获得实地，还是构筑外势？</span>
              </li>
              <li>
                <b>寻找转折点</b>
                <span>尝试比较另一个候选点的变化。</span>
              </li>
            </ol>
            <div className="ai-note">
              <Sparkles size={18} />
              <p>
                点击棋盘旁的「问
                AI」可结合当前局面提问。大模型不可用时，仍可使用本地棋理提示。
              </p>
            </div>
          </div>
        </div>
        {props.reviewLength > 0 && (
          <div className="review-player">
            <button
              className="icon-btn"
              onClick={() =>
                props.reviewSeek(Math.max(0, props.reviewIndex - 1))
              }
            >
              <ChevronLeft />
            </button>
            <button
              className="primary"
              onClick={() => props.setReviewPlaying(!props.reviewPlaying)}
            >
              {props.reviewPlaying ? <Pause size={17} /> : <Play size={17} />}
              {props.reviewPlaying ? "暂停" : "自动打谱"}
            </button>
            <button
              className="icon-btn"
              onClick={() =>
                props.reviewSeek(
                  Math.min(props.reviewLength, props.reviewIndex + 1)
                )
              }
            >
              <ChevronRight />
            </button>
            <input
              aria-label="棋谱手数"
              type="range"
              min="0"
              max={props.reviewLength}
              value={props.reviewIndex}
              onChange={e => props.reviewSeek(Number(e.target.value))}
            />
            <b>
              {props.reviewIndex} / {props.reviewLength}
            </b>
            <button className="secondary" onClick={props.exportSgf}>
              <Download size={16} />
              导出
            </button>
          </div>
        )}
      </Shell>
    );

  if (panel === "exam")
    return (
      <Shell
        title="段位评级考核"
        eyebrow="以棋会友 · 也为更好的自己"
        close={close}
      >
        <div className="rank-hero">
          <span>当前棋力</span>
          <h3>{profile.rank}</h3>
          <b>{profile.rating} 分</b>
          <div>
            <i style={{ width: `${ratingProgress}%` }} />
          </div>
          <p>
            完成考核对局后根据胜负与棋力差动态调整。本评级仅用于弈境内部修习，不等同于官方段位证书。
          </p>
        </div>
        <div className="exam-rules">
          <div>
            <b>01</b>
            <span>选择 9 / 13 / 19 路棋盘</span>
          </div>
          <div>
            <b>02</b>
            <span>挑战对应强度 AI</span>
          </div>
          <div>
            <b>03</b>
            <span>双方停一手后数子定胜负</span>
          </div>
        </div>
        <label className="field-label">考核棋盘</label>
        <div className="segmented">
          {[9, 13, 19].map(n => (
            <button
              className={size === n ? "active" : ""}
              onClick={() => setSize(n)}
              key={n}
            >
              {n} 路
            </button>
          ))}
        </div>
        <label className="field-label">考核强度</label>
        <div className="difficulty-list">
          {[
            ["入门", "适合初学", 1],
            ["进阶", "稳健计算", 3],
            ["棋士", "全局判断", 5],
          ].map(([name, desc, n]) => (
            <button
              key={name}
              className={difficulty === n ? "active" : ""}
              onClick={() => setDifficulty(Number(n))}
            >
              <b>{name}</b>
              <span>{desc}</span>
            </button>
          ))}
        </div>
        <button
          className="primary full"
          onClick={() => {
            props.startMatch("exam", size, difficulty);
            close();
          }}
        >
          开始考核
        </button>
      </Shell>
    );

  if (panel === "growth") {
    const petStage =
      profile.petLevel >= 10
        ? "山海灵兽"
        : profile.petLevel >= 5
          ? "凌云灵宠"
          : "围棋小灵";
    const petNext = Math.pow(profile.petLevel, 2) * 55;
    const feed = () => {
      if (profile.coins < 20) {
        props.notify("棋玉不足，完成闯关即可获得");
        return;
      }
      const p = {
        ...profile,
        coins: profile.coins - 20,
        petXp: profile.petXp + 28,
        petMood: Math.min(100, profile.petMood + 12),
      };
      p.petLevel = 1 + Math.floor(Math.sqrt(p.petXp / 55));
      props.persist(p);
      props.notify(`${profile.petName} 很开心，灵力 +28`);
    };
    return (
      <Shell
        title="灵犀山居"
        eyebrow="养成 · 陪伴 · 每日修行"
        close={close}
        wide
      >
        <div className="growth-layout">
          <div className="pet-card">
            <div
              className={`pet-aura stage-${Math.min(3, Math.floor(profile.petLevel / 4))}`}
            >
              <div className="pet">
                <i className="ear left" />
                <i className="ear right" />
                <div className="pet-face">
                  <b />
                  <b />
                  <span>ᴗ</span>
                </div>
                <i className="pet-tail" />
              </div>
            </div>
            <span className="eyebrow">
              {petStage} · LV.{profile.petLevel}
            </span>
            <h3>{profile.petName}</h3>
            <p>“今日也想陪你下一局。慢慢来，棋会听见耐心。”</p>
            <div className="pet-stats">
              <label>
                灵力{" "}
                <b>
                  {profile.petXp} / {petNext}
                </b>
              </label>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, (profile.petXp / petNext) * 100)}%`,
                  }}
                />
              </div>
              <label>
                心情 <b>{profile.petMood}%</b>
              </label>
              <div>
                <i style={{ width: `${profile.petMood}%` }} />
              </div>
            </div>
            <div className="panel-actions centered">
              <button className="primary" onClick={feed}>
                <Gift size={16} />
                投喂 · 20 棋玉
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const name = prompt("给灵宠起个名字", profile.petName);
                  if (name?.trim())
                    props.persist({
                      ...profile,
                      petName: name.trim().slice(0, 8),
                    });
                }}
              >
                改名
              </button>
            </div>
          </div>
          <div className="daily-card">
            <span className="eyebrow">TODAY</span>
            <h3>今日修行</h3>
            <p>每天一点点，数日之后自会不同。</p>
            {[
              ["完成 1 场对局", profile.daily.games, 1],
              ["通过 3 道棋题", profile.daily.puzzles, 3],
              ["研习 1 节课程", profile.daily.lessons, 1],
            ].map(([name, value, target]) => (
              <div className="daily-task" key={String(name)}>
                <div>
                  <b>{name}</b>
                  <span>
                    {Math.min(Number(value), Number(target))} / {target}
                  </span>
                </div>
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, (Number(value) / Number(target)) * 100)}%`,
                    }}
                  />
                </div>
                {Number(value) >= Number(target) && <Check size={17} />}
              </div>
            ))}
            <div className="growth-inventory">
              <div>
                <b>{profile.coins}</b>
                <span>棋玉</span>
              </div>
              <div>
                <b>{profile.jade}</b>
                <span>灵石</span>
              </div>
              <div>
                <b>{profile.level}</b>
                <span>修行等级</span>
              </div>
            </div>
            <div className="unlock-note">
              <Sparkles size={18} />
              <span>
                灵宠 5 级解锁专属落子光效，10
                级解锁山海形态。成长由真实对局、学习和闯关共同驱动。
              </span>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (panel === "achievements")
    return (
      <Shell
        title="成就图鉴"
        eyebrow={`${profile.achievements.length} / ${ACHIEVEMENTS.length} 已点亮`}
        close={close}
        wide
      >
        <div className="achievement-overview">
          <Trophy size={28} />
          <div>
            <h3>每一步，都值得纪念</h3>
            <p>成就自动解锁，奖励棋玉与修为；无需手动领取。</p>
          </div>
          <b>
            {Math.round(
              (profile.achievements.length / ACHIEVEMENTS.length) * 100
            )}
            %
          </b>
        </div>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map(a => {
            const done = unlockedAchievements.has(a.id),
              value = Math.min(a.target, a.progress(profile));
            return (
              <article key={a.id} className={done ? "unlocked" : ""}>
                <div className="achievement-seal">
                  {done ? a.icon : <Lock size={18} />}
                </div>
                <div>
                  <h4>{a.title}</h4>
                  <p>{a.description}</p>
                  <div className="mini-progress">
                    <i style={{ width: `${(value / a.target) * 100}%` }} />
                  </div>
                  <span>
                    {value} / {a.target} · 奖励 {a.reward} 棋玉
                  </span>
                </div>
                {done && <Check size={18} />}
              </article>
            );
          })}
        </div>
      </Shell>
    );

  if (panel === "settings")
    return (
      <Shell
        title="雅集设置"
        eyebrow="13 种主题 · 三种视角 · 个性声景"
        close={close}
        wide
      >
        <div className="settings-section">
          <h3>界面主题</h3>
          <div className="theme-grid">
            {themes.map(([id, name, color]) => (
              <button
                key={id}
                className={profile.theme === id ? "active" : ""}
                onClick={() => props.persist({ ...profile, theme: id })}
              >
                <i style={{ background: color }} />
                <span>{name}</span>
                {profile.theme === id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-columns">
          <div className="settings-section">
            <h3>棋盘视角</h3>
            <div className="segmented">
              {(["2d", "2.5d", "3d"] as ViewMode[]).map(v => (
                <button
                  className={profile.view === v ? "active" : ""}
                  key={v}
                  onClick={() => props.persist({ ...profile, view: v })}
                >
                  {v === "2d"
                    ? "2D 平面"
                    : v === "2.5d"
                      ? "2.5D 雅致"
                      : "3D 沉浸"}
                </button>
              ))}
            </div>
            <h3>背景音乐</h3>
            <div className="music-list">
              {[
                ["guqin", "流水古琴"],
                ["rain", "竹雨禅音"],
                ["starlight", "星河夜曲"],
                ["breeze", "林间清风"],
              ].map(([id, name]) => (
                <button
                  className={profile.music === id ? "active" : ""}
                  key={id}
                  onClick={() => props.persist({ ...profile, music: id })}
                >
                  <Volume2 size={16} />
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <h3>操作与效果</h3>
            <label className="range-label">
              音量 <b>{Math.round(profile.volume * 100)}%</b>
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={profile.volume}
                onChange={e =>
                  props.persist({ ...profile, volume: Number(e.target.value) })
                }
              />
            </label>
            <button className="secondary full" onClick={props.testAudio}>
              <Play size={16} />
              试听声音
            </button>
            <label className="toggle-row">
              显示棋盘坐标
              <input
                type="checkbox"
                checked={profile.coordinates}
                onChange={e =>
                  props.persist({ ...profile, coordinates: e.target.checked })
                }
              />
            </label>
            <label className="toggle-row">
              落子与成就动效
              <input
                type="checkbox"
                checked={profile.effects}
                onChange={e =>
                  props.persist({ ...profile, effects: e.target.checked })
                }
              />
            </label>
            <label className="toggle-row">
              静音
              <input
                type="checkbox"
                checked={profile.muted}
                onChange={e =>
                  props.persist({ ...profile, muted: e.target.checked })
                }
              />
            </label>
          </div>
        </div>
        <div className="cloud-save">
          <Cloud size={24} />
          <div>
            <h3>云端修行存档</h3>
            <p>
              使用修行码在不同设备恢复进度。本地会自动保存；云服务不可用时不会影响对局。
            </p>
          </div>
          <input
            aria-label="修行码"
            value={cloudKey}
            onChange={e => setCloudKey(e.target.value)}
          />
          <button
            className="secondary"
            onClick={async () => {
              const { cloudLoad } = await import("@/game/profile");
              const p = await cloudLoad(cloudKey.trim());
              if (p) {
                props.setProfile(p);
                props.notify("云端存档已恢复");
              } else props.notify("未找到云存档，已保留当前进度");
            }}
          >
            <RefreshCw size={16} />
            恢复
          </button>
          <button
            className="primary"
            onClick={async () => {
              const { cloudSave } = await import("@/game/profile");
              props.notify(
                (await cloudSave({ ...profile, playerKey: cloudKey.trim() }))
                  ? "已同步到云端"
                  : "云服务暂不可用，进度已保存在本机"
              );
            }}
          >
            立即同步
          </button>
        </div>
      </Shell>
    );

  if (panel === "help")
    return (
      <Shell title="如何落子" eyebrow="鼠标 · 键盘 · 触摸" close={close}>
        <div className="help-grid">
          <div>
            <MousePointer2 />
            <h3>鼠标</h3>
            <p>点击交叉点落子；3D 模式拖动旋转，滚轮缩放。</p>
          </div>
          <div>
            <Keyboard />
            <h3>键盘</h3>
            <p>方向键移动，Enter 落子，P 停一手，U 悔棋，Esc 暂停，M 静音。</p>
          </div>
          <div>
            <Smartphone />
            <h3>触摸</h3>
            <p>轻点落子；3D 模式单指旋转，双指缩放。所有按钮均适合触控。</p>
          </div>
        </div>
        <div className="rules-note">
          <h3>快速入门</h3>
          <p>
            黑先白后，交替把棋子落在交叉点。相连棋子的空点叫“气”，无气则被提走。双方连续停一手后数子，白棋贴
            6.5 目。入门建议先玩 9 路，从第 1 关学习“气”。
          </p>
        </div>
      </Shell>
    );

  return null;
}

export function TutorDock({
  ask,
  context,
}: {
  ask: (q: string) => Promise<string>;
  context: string;
}) {
  const [open, setOpen] = useState(false),
    [q, setQ] = useState(""),
    [answer, setAnswer] = useState(""),
    [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer(await ask(q.trim()));
    setLoading(false);
  };
  return (
    <div className={`tutor-dock ${open ? "open" : ""}`}>
      {open && (
        <div className="tutor-box">
          <header>
            <div>
              <Sparkles size={16} />
              <b>灵犀 AI 助教</b>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </header>
          <p className="tutor-context">已结合当前局面 · {context}</p>
          <div className="tutor-answer">
