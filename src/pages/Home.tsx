import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  Download,
  Flag,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Medal,
  Menu,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Swords,
  Trophy,
  Undo2,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import * as sgf from "@sabaki/sgf";
import {
  startGame,
  stopGame,
  updateGameBoard,
  setBoardHint,
  setBoardCursor,
  setBoardTargets,
  setBoardView,
  setBoardInteractive,
} from "@/game/boot";
import { GoGame, coords, toSgf } from "@/game/rules";
import { chooseAiMove, localMoveComment } from "@/game/ai";
import { getLevel, isLevelSolved } from "@/game/levels";
import {
  achievementById,
  addXp,
  cloudSave,
  loadProfile,
  rewardPuzzle,
  saveProfile,
} from "@/game/profile";
import { syncAchievements } from "@/game/achievements";
import { AudioSystem } from "@/game/audio";
import type {
  Color,
  GameMode,
  GameSnapshot,
  Move,
  Profile,
  Vertex,
  ViewMode,
} from "@/game/goTypes";
import Panels, { TutorDock, type PanelName } from "@/components/Panels";

const SAMPLE_SGF =
  "(;GM[1]FF[4]CA[UTF-8]GN[弈境·星小目布局示例]SZ[19]KM[6.5];B[pd];W[dd];B[pq];W[dp];B[jp];W[cn];B[qf];W[fc];B[nd];W[qc];B[pc];W[qd];B[qe];W[pb];B[ob];W[qb];B[lc];W[dj];B[hq];W[cf];B[qn];W[cm];B[fq];W[eq];B[fp];W[do])";
type PuzzleStatus = "playing" | "success" | "fail";
type ReviewSource = {
  size: number;
  setup: { x: number; y: number; color: Color }[];
  turn: Color;
  moves: Move[];
};
const navItems: {
  id: PanelName | "game";
  label: string;
  icon: typeof Gamepad2;
}[] = [
  { id: "game", label: "对局", icon: Gamepad2 },
  { id: "campaign", label: "闯关", icon: Mountain },
  { id: "academy", label: "教学", icon: GraduationCap },
  { id: "review", label: "棋谱", icon: BookOpen },
  { id: "exam", label: "考核", icon: Medal },
  { id: "growth", label: "养成", icon: Sparkles },
  { id: "achievements", label: "成就", icon: Trophy },
  { id: "settings", label: "设置", icon: Settings },
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfileState] = useState<Profile>(() => loadProfile());
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const initialLevel = getLevel(profile.unlocked);
  const gameRef = useRef<GoGame>(
    new GoGame(initialLevel.size, initialLevel.setup, initialLevel.turn)
  );
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    gameRef.current.snapshot()
  );
  const [mode, setMode] = useState<GameMode>("campaign");
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [levelId, setLevelId] = useState(initialLevel.id);
  const levelRef = useRef(initialLevel);
  levelRef.current = getLevel(levelId);
  const [panel, setPanel] = useState<PanelName>(null);
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const [puzzleStatus, setPuzzleStatus] = useState<PuzzleStatus>("playing");
  const puzzleRef = useRef(puzzleStatus);
  puzzleRef.current = puzzleStatus;
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState(2);
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const [message, setMessage] = useState("");
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const mistakesRef = useRef(0);
  const attemptsRef = useRef(0);
  const recordedRef = useRef(false);
  const [hover, setHover] = useState<Vertex | null>(null);
  const [cursor, setCursor] = useState<Vertex>(initialLevel.solution);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [reviewSource, setReviewSource] = useState<ReviewSource | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewPlaying, setReviewPlaying] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string[]>([]);
  const audioRef = useRef<AudioSystem | null>(null);
  if (!audioRef.current)
    audioRef.current = new AudioSystem(
      profile.muted,
      profile.volume,
      profile.music
    );

  const notify = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 2600);
  }, []);
  const announceAchievements = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setAchievementToast(ids);
    audioRef.current?.sfx("achievement");
    setTimeout(() => setAchievementToast([]), 4200);
  }, []);
  const setProfile = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfileState(p);
    saveProfile(p);
  }, []);
  const persist = useCallback(
    (p: Profile) => {
      setProfile(p);
      const a = syncAchievements(p);
      if (a.length) {
        setProfile({ ...p });
        announceAchievements(a);
      }
    },
    [setProfile, announceAchievements]
  );
  const commit = useCallback(() => setSnapshot(gameRef.current.snapshot()), []);

  const startLevel = useCallback(
    (id: number) => {
      const level = getLevel(id);
      gameRef.current = new GoGame(level.size, level.setup, level.turn);
      levelRef.current = level;
      setLevelId(id);
      setMode("campaign");
      modeRef.current = "campaign";
      setPuzzleStatus("playing");
      puzzleRef.current = "playing";
      setPaused(false);
      pausedRef.current = false;
      setHintUsed(false);
      setBoardHint(null);
      mistakesRef.current = 0;
      attemptsRef.current = 0;
      recordedRef.current = false;
      setReviewPlaying(false);
      setCursor(level.solution);
      setCursorVisible(false);
      commit();
      setPanel(null);
      notify(`第 ${id} 关 · ${level.objective}`);
    },
    [commit, notify]
  );

  const startMatch = useCallback(
    (matchMode: "ai" | "local" | "exam", size: number, strength: number) => {
      gameRef.current = new GoGame(size);
      setMode(matchMode);
      modeRef.current = matchMode;
      setDifficulty(strength);
      difficultyRef.current = strength;
      setPuzzleStatus("playing");
      puzzleRef.current = "playing";
      setPaused(false);
      pausedRef.current = false;
      recordedRef.current = false;
      setHintUsed(false);
      setBoardHint(null);
      setReviewPlaying(false);
      setCursor([Math.floor(size / 2), Math.floor(size / 2)]);
      setCursorVisible(false);
      commit();
      setPanel(null);
      notify(
        matchMode === "local"
          ? "双人对弈 · 黑棋先行"
          : matchMode === "exam"
            ? "段位考核开始 · 你执黑先行"
            : `人机对弈 · ${["", "启蒙", "入门", "进阶", "高手", "棋士"][strength]}棋力`
      );
    },
    [commit, notify]
  );

  const recordFinishedGame = useCallback(
    (result: string) => {
      if (
        recordedRef.current ||
        modeRef.current === "campaign" ||
        modeRef.current === "review"
      )
        return;
      recordedRef.current = true;
      const p = profileRef.current;
      const won =
        result.startsWith("黑棋") ||
        (result.startsWith("白棋") && modeRef.current === "local");
      p.stats.games++;
      p.daily.games++;
      p.stats.exams += modeRef.current === "exam" ? 1 : 0;
      if (won) p.stats.wins++;
      if (modeRef.current === "exam")
        p.rating = Math.max(600, Math.min(2500, p.rating + (won ? 24 : -14)));
      addXp(p, won ? 70 : 35, won ? 45 : 20);
      const ids = syncAchievements(p);
      setProfile({ ...p });
      announceAchievements(ids);
      void cloudSave(p);
    },
    [announceAchievements, setProfile]
  );

  const handlePlace = useCallback(
    (vertex: Vertex) => {
      if (
        pausedRef.current ||
        puzzleRef.current !== "playing" ||
        modeRef.current === "review" ||
        gameRef.current.over
      )
        return;
      if (
        (modeRef.current === "ai" || modeRef.current === "exam") &&
        gameRef.current.turn === -1
      )
        return;
      const game = gameRef.current,
        result = game.play(vertex);
      if (!result.ok) {
        notify(result.reason || "此处不能落子");
        audioRef.current?.sfx("fail");
        return;
      }
      audioRef.current?.sfx(result.captured ? "capture" : "stone");
      const p = profileRef.current;
      p.stats.captures += result.captured;
      p.stats.stones++;
      commit();
      const moveAchievements = syncAchievements(p);
      setProfile({ ...p });
      announceAchievements(moveAchievements);
      if (modeRef.current === "campaign") {
        const level = levelRef.current;
        const correct = isLevelSolved(level, game, vertex, result.captured);
        if (correct) {
          const ids = rewardPuzzle(
            p,
            level.id,
            mistakesRef.current + (hintUsed ? 1 : 0)
          );
          setProfile({ ...p });
          setPuzzleStatus("success");
          puzzleRef.current = "success";
          audioRef.current?.sfx("success");
          announceAchievements(ids);
          void cloudSave(p);
        } else {
          mistakesRef.current++;
          attemptsRef.current++;
          p.stats.streak = 0;
          if (attemptsRef.current >= level.maxMoves) {
            setPuzzleStatus("fail");
            puzzleRef.current = "fail";
            audioRef.current?.sfx("fail");
          } else {
            game.undo();
            commit();
            notify(
              `这手未完成目标，已退回棋题；还可尝试 ${level.maxMoves - attemptsRef.current} 次`
            );
          }
        }
      } else if (game.over) recordFinishedGame(game.result);
    },
    [
      announceAchievements,
      commit,
      hintUsed,
      notify,
      recordFinishedGame,
      setProfile,
    ]
  );
  const placeRef = useRef(handlePlace);
  placeRef.current = handlePlace;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    startGame(canvas, v => placeRef.current(v), setHover);
    const unlock = () => {
      void audioRef.current?.unlock();
    };
    // Keep listening: mobile browsers may suspend audio again after backgrounding.
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      stopGame();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      audioRef.current?.dispose();
      audioRef.current = null;
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    updateGameBoard(snapshot, profile.theme, profile.view, profile.coordinates);
    setBoardInteractive(
      !paused && puzzleStatus === "playing" && mode !== "review"
    );
  }, [
    snapshot,
    profile.theme,
    profile.view,
    profile.coordinates,
    paused,
    puzzleStatus,
    mode,
  ]);
  useEffect(() => {
    setBoardCursor(cursorVisible ? cursor : null);
  }, [cursor, cursorVisible, snapshot.size]);
  useEffect(() => {
    setBoardTargets(
      mode === "campaign" && hintUsed ? levelRef.current.target || [] : []
    );
  }, [mode, levelId, snapshot.size, hintUsed]);
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.setMuted(profile.muted);
      audio.setVolume(profile.volume);
      audio.setTrack(profile.music);
    }
  }, [profile.muted, profile.volume, profile.music]);

  useEffect(() => {
    if (
      (mode !== "ai" && mode !== "exam") ||
      snapshot.turn !== -1 ||
      snapshot.over ||
      paused ||
      puzzleStatus !== "playing"
    )
      return;
    setThinking(true);
    const timer = setTimeout(
      () => {
        const move = chooseAiMove(gameRef.current, -1, difficultyRef.current);
        const result = gameRef.current.play(move);
        if (!result.ok) {
          setThinking(false);
          notify("AI 应手异常，已保留当前局面");
          return;
        }
        audioRef.current?.sfx(move ? "stone" : "ui");
        if (!move) notify(gameRef.current.over ? "双方连续停一手，开始数子" : "AI 停一手，轮到你行棋");
        setThinking(false);
        commit();
        if (gameRef.current.over) recordFinishedGame(gameRef.current.result);
      },
      Math.max(320, 850 - difficulty * 90)
    );
    return () => clearTimeout(timer);
  }, [
    snapshot,
    mode,
    paused,
    puzzleStatus,
    difficulty,
    commit,
    recordFinishedGame,
  ]);

  const undo = useCallback(() => {
    if (modeRef.current === "review") {
      setReviewIndex(i => Math.max(0, i - 1));
      return;
    }
    const steps =
      modeRef.current === "ai" || modeRef.current === "exam" ? 2 : 1;
    if (gameRef.current.undo(steps)) {
      setPuzzleStatus("playing");
      puzzleRef.current = "playing";
      recordedRef.current = false;
      commit();
      audioRef.current?.sfx("ui");
      notify("已退回上一手");
    }
  }, [commit, notify]);
  const pass = useCallback(() => {
    if (modeRef.current === "campaign") {
      notify("闯关需要完成目标，不能停一手");
      return;
    }
    if (
      modeRef.current === "review" ||
      pausedRef.current ||
      gameRef.current.over
    )
      return;
    gameRef.current.play(null);
    audioRef.current?.sfx("ui");
    commit();
    if (gameRef.current.over) recordFinishedGame(gameRef.current.result);
  }, [commit, notify, recordFinishedGame]);
  const restart = useCallback(() => {
    if (modeRef.current === "campaign") startLevel(levelRef.current.id);
    else if (modeRef.current === "review") setReviewIndex(0);
    else
      startMatch(
        modeRef.current as "ai" | "local" | "exam",
        gameRef.current.size,
        difficultyRef.current
      );
  }, [startLevel, startMatch]);
  const showHint = useCallback(() => {
    if (modeRef.current !== "campaign") {
      notify("观察最后落子，先计算棋块的气与连接");
      return;
    }
    setHintUsed(true);
    setBoardHint(levelRef.current.solution);
    profileRef.current.stats.hints++;
    notify(levelRef.current.hint);
  }, [notify]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        if (panelRef.current) setPanel(null);
        else {
          setPaused(v => !v);
          pausedRef.current = !pausedRef.current;
        }
        return;
      }
      if (e.key.toLowerCase() === "m") {
        const p = { ...profileRef.current, muted: !profileRef.current.muted };
        setProfile(p);
        return;
      }
      if (pausedRef.current || panelRef.current) return;
      const size = gameRef.current.size;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setCursorVisible(true);
        setCursor(prev => {
          const next: [number, number] = [...prev];
          if (e.key === "ArrowLeft") next[0] = Math.max(0, next[0] - 1);
          if (e.key === "ArrowRight") next[0] = Math.min(size - 1, next[0] + 1);
          if (e.key === "ArrowUp") next[1] = Math.max(0, next[1] - 1);
          if (e.key === "ArrowDown") next[1] = Math.min(size - 1, next[1] + 1);
          return next;
        });
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        placeRef.current(cursor);
      }
      if (e.key.toLowerCase() === "p") pass();
      if (e.key.toLowerCase() === "u") undo();
      if (["1", "2", "3"].includes(e.key)) {
        const view: ViewMode =
          e.key === "1" ? "2d" : e.key === "2" ? "2.5d" : "3d";
        setProfile({ ...profileRef.current, view });
        setBoardView(view);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, pass, setProfile, undo]);

  const importSgf = useCallback(
    (text: string) => {
      try {
        const roots = sgf.parse(text);
        if (!roots.length) throw new Error("empty");
        const root = roots[0],
          size = Number(root.data.SZ?.[0] || 19);
        if (![9, 13, 19].includes(size)) throw new Error("size");
        const setup: { x: number; y: number; color: Color }[] = [];
        for (const [key, color] of [
          ["AB", 1],
          ["AW", -1],
        ] as const)
          for (const value of root.data[key] || []) {
            const [x, y] = sgf.parseVertex(value);
            if (x >= 0 && y >= 0) setup.push({ x, y, color });
          }
        const turn: Color = root.data.PL?.[0] === "W" ? -1 : 1;
        const full = new GoGame(size, setup, turn);
        let node = root.children[0];
        while (node) {
          const color: Color = node.data.B
            ? 1
            : node.data.W
              ? -1
              : (0 as Color);
          if (color) {
            const value = (node.data.B || node.data.W)![0];
            const v = value ? sgf.parseVertex(value) : null;
            const result = full.play(v as Vertex | null, color);
            if (!result.ok) throw new Error(result.reason);
          }
          node = node.children[0];
        }
        const source = { size, setup, turn, moves: full.moves };
        setReviewSource(source);
        setReviewIndex(full.moves.length);
        gameRef.current = full;
        setMode("review");
        modeRef.current = "review";
        setPuzzleStatus("playing");
        puzzleRef.current = "playing";
        commit();
        const p = profileRef.current;
        p.stats.reviews++;
        addXp(p, 25, 10);
        const ids = syncAchievements(p);
        setProfile({ ...p });
        announceAchievements(ids);
        return true;
      } catch {
        notify("棋谱无法解析：请检查 SGF 格式、棋盘大小与落子顺序");
        return false;
      }
    },
    [announceAchievements, commit, notify, setProfile]
  );

  useEffect(() => {
    if (mode !== "review" || !reviewSource) return;
    const game = new GoGame(
      reviewSource.size,
      reviewSource.setup,
      reviewSource.turn
    );
    for (const move of reviewSource.moves.slice(0, reviewIndex))
      game.play(move.vertex, move.color);
    gameRef.current = game;
    commit();
  }, [reviewIndex, reviewSource, mode, commit]);
  useEffect(() => {
    if (!reviewPlaying || !reviewSource) return;
    if (reviewIndex >= reviewSource.moves.length) {
      setReviewPlaying(false);
      return;
    }
    const timer = setTimeout(() => setReviewIndex(i => i + 1), 750);
    return () => clearTimeout(timer);
  }, [reviewPlaying, reviewIndex, reviewSource]);

  const exportSgf = useCallback(() => {
    let game = gameRef.current;
    if (mode === "review" && reviewSource) {
      game = new GoGame(
        reviewSource.size,
        reviewSource.setup,
        reviewSource.turn
      );
      reviewSource.moves.forEach(m => game.play(m.vertex, m.color));
    }
    const blob = new Blob([toSgf(game)], { type: "application/x-go-sgf" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "弈境棋谱.sgf";
    a.click();
    URL.revokeObjectURL(url);
    notify("SGF 棋谱已导出");
  }, [mode, notify, reviewSource]);
  const testAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    let next = profileRef.current;
    if (next.muted || next.volume === 0) {
      next = { ...next, muted: false, volume: next.volume || .65 };
      audio.setMuted(false);
      audio.setVolume(next.volume);
      setProfile(next);
    }
    const running = await audio.unlock();
    if (!running) {
      notify("浏览器尚未允许声音，请再次点击试听，并检查设备音量与静音开关");
      return;
    }
    audio.startMusic();
    audio.sfx("success");
    notify("正在播放背景音乐与试听音效");
  }, [notify, setProfile]);
  const askTutor = useCallback(
    async (question: string) => {
      const context = `${snapshot.size}路棋，第${snapshot.moves.length}手，${snapshot.turn === 1 ? "黑" : "白"}先。${mode === "campaign" ? `题目：${levelRef.current.objective}` : ""}`;
      try {
        const response = await fetch("/api/trpc/tutor.ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json: {
              question,
              context,
              moves: snapshot.moves.slice(-12).map(m => m.coordinate),
            },
          }),
        });
        if (!response.ok) throw new Error("unavailable");
        const body = await response.json(),
          answer = body?.result?.data?.json?.answer;
        if (typeof answer === "string") return answer;
        throw new Error("invalid");
      } catch {
        return `本地棋理提示：${mode === "campaign" ? levelRef.current.hint : "先检查双方弱棋的气，再比较角边的大场。不要只看局部，注意厚薄与先后手。"}（大模型助教当前未连接）`;
      }
    },
    [mode, snapshot]
  );

  const level = levelRef.current,
    currentMove = snapshot.moves.at(-1);
  const modeLabel =
    mode === "campaign"
      ? `闯关 ${level.id}/1000`
      : mode === "ai"
        ? "人机对弈"
        : mode === "local"
          ? "双人对弈"
          : mode === "exam"
            ? "段位考核"
            : "棋谱解读";
  const navClick = (id: PanelName | "game") => {
    audioRef.current?.sfx("ui");
    if (id === "game") {
      setPanel(null);
      return;
    }
    setPanel(id);
  };

  return (
    <main
      className={`app theme-${profile.theme} ${profile.effects ? "with-effects" : ""}`}
    >
      <div className="landscape" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="topbar">
        <button className="brand" onClick={() => setPanel(null)}>
          <span className="brand-seal">弈</span>
          <div>
            <h1>弈境</h1>
            <small>一方棋枰 · 千重境界</small>
          </div>
        </button>
        <div className="topbar-center">
          <span className="live-dot" />
          <b>{modeLabel}</b>
          <span>{snapshot.size} 路 · 中国规则</span>
        </div>
        <div className="profile-pill">
          <div className="level-ring">
            <b>{profile.level}</b>
          </div>
          <div>
            <strong>{profile.name}</strong>
            <span>
              {profile.rank} · {profile.xp} 修为
            </span>
          </div>
          <i />
          <div className="currency">
            ◈ <b>{profile.coins}</b>
          </div>
        </div>
        <button className="new-match-btn" onClick={() => setPanel("match")}>
          <Swords size={17} />
          <span>新对局</span>
        </button>
        <button
          className="icon-btn header-help"
          onClick={() => setPanel("help")}
          aria-label="帮助"
        >
          <CircleHelp size={19} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setProfile({ ...profile, muted: !profile.muted })}
          aria-label={profile.muted ? "取消静音" : "静音"}
        >
          {profile.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
      </header>

      <nav className="side-nav" aria-label="主要功能">
        {navItems.map(item => {
          const Icon = item.icon,
            active = item.id === "game" ? panel === null : panel === item.id;
          return (
            <button
              key={item.id}
              className={active ? "active" : ""}
              onClick={() => navClick(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.id === "achievements" &&
                profile.achievements.length > 0 && <i className="nav-dot" />}
            </button>
          );
        })}
      </nav>

      <section className="game-area">
        <div className="board-heading">
          <div>
            <span className="eyebrow">
              {mode === "campaign" ? level.chapterTitle : "此刻 · 专注一手"}
            </span>
            <h2>
              {mode === "campaign"
                ? level.title
                : mode === "review"
                  ? "以谱为师 · 推演变化"
                  : mode === "local"
                    ? "手谈 · 与朋友共下一局"
                    : mode === "exam"
                      ? "定力与计算的双重修习"
                      : "人机手谈 · 落子无悔"}
            </h2>
          </div>
          <div className="view-switch" aria-label="视角切换">
            {(["2d", "2.5d", "3d"] as ViewMode[]).map(v => (
              <button
                className={profile.view === v ? "active" : ""}
                key={v}
                onClick={() => {
                  setProfile({ ...profile, view: v });
                  setBoardView(v);
                }}
              >
                {v === "2d" ? "2D" : v === "2.5d" ? "2.5D" : "3D"}
              </button>
            ))}
          </div>
        </div>
        <div className="board-stage">
          <canvas
            id="game-canvas"
            ref={canvasRef}
            aria-label={`${snapshot.size}路围棋棋盘`}
          />
          <div className="board-vignette" />
          <div className="turn-indicator">
            <i className={snapshot.turn === 1 ? "black" : "white"} />
            <span>
              {mode === "review"
                ? `第 ${reviewIndex} 手`
                : snapshot.over
                  ? "对局结束"
                  : thinking
                    ? "对手正在思考"
                    : `${snapshot.turn === 1 ? "黑" : "白"}棋行棋`}
            </span>
          </div>
          {hover && (
            <div className="hover-coordinate">
              {coords(hover, snapshot.size)}
            </div>
          )}
          {profile.view === "3d" && (
            <div className="orbit-tip">拖动旋转 · 滚轮 / 双指缩放</div>
          )}
        </div>
        <div className="game-controls">
          {mode === "review" ? (
            <>
              <button onClick={() => setReviewIndex(i => Math.max(0, i - 1))}>
                <ChevronLeft size={18} />
                <span>上一手</span>
              </button>
              <button
                className="control-primary"
                onClick={() => setReviewPlaying(!reviewPlaying)}
              >
                {reviewPlaying ? <Pause size={18} /> : <Play size={18} />}
                <span>{reviewPlaying ? "暂停" : "自动打谱"}</span>
              </button>
              <button
                onClick={() =>
                  setReviewIndex(i =>
                    Math.min(reviewSource?.moves.length || 0, i + 1)
                  )
                }
              >
                <ChevronRight size={18} />
                <span>下一手</span>
              </button>
              <button onClick={exportSgf}>
                <Download size={18} />
                <span>导出</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={undo} disabled={!snapshot.moves.length}>
                <Undo2 size={18} />
                <span>悔棋</span>
              </button>
              <button onClick={pass} disabled={snapshot.over}>
                <Flag size={18} />
                <span>停一手</span>
              </button>
              <button onClick={showHint}>
                <Lightbulb size={18} />
                <span>提示</span>
              </button>
              <button onClick={restart}>
                <RotateCcw size={18} />
                <span>重开</span>
              </button>
              <button
                onClick={() => {
                  setPaused(true);
                  pausedRef.current = true;
                }}
              >
                <Pause size={18} />
                <span>暂停</span>
              </button>
            </>
          )}
        </div>
      </section>

      <aside className="game-sidebar">
        {mode === "campaign" ? (
          <section className="objective-card">
            <div className="card-label">
              <Swords size={15} />
              本关目标<span>{level.difficulty} 阶</span>
            </div>
            <h3>{level.objective}</h3>
            <p>{level.lesson}</p>
            <div className="move-budget">
              <span>剩余机会</span>
              <div>
                {Array.from({ length: level.maxMoves }, (_, i) => (
                  <i
                    key={i}
                    className={
                      i < level.maxMoves - attemptsRef.current ? "active" : ""
                    }
                  />
                ))}
              </div>
              <b>
                {Math.max(0, level.maxMoves - attemptsRef.current)} /{" "}
                {level.maxMoves}
              </b>
            </div>
          </section>
        ) : mode === "review" ? (
          <section className="objective-card commentary">
            <div className="card-label">
              <BookOpen size={15} />
              本手解读
            </div>
            <h3>{currentMove ? currentMove.coordinate : "开局"}</h3>
            <p>
              {localMoveComment(gameRef.current, Math.max(0, reviewIndex - 1))}
            </p>
            <span className="local-analysis">本地棋理分析 · 非胜率评估</span>
          </section>
        ) : (
          <section className="objective-card">
            <div className="card-label">
              <Swords size={15} />
              对局任务
            </div>
            <h3>
              {mode === "exam" ? "全力以赴，校准棋力" : "围地与生存，皆为大道"}
            </h3>
            <p>双方连续停一手后自动数子。白棋贴 6.5 目，采用面积计分。</p>
          </section>
        )}

        <section className="players-card">
          <div
            className={`player ${snapshot.turn === 1 && !snapshot.over ? "active" : ""}`}
          >
            <i className="stone-avatar black" />
            <div>
              <b>
                {mode === "local"
                  ? "黑方棋客"
                  : mode === "campaign"
                    ? "你 · 黑棋"
                    : "你"}
              </b>
              <span>提取 {snapshot.captures.black} 子</span>
            </div>
            {snapshot.turn === 1 && <span className="thinking-dots">行棋</span>}
          </div>
          <div className="versus">
            <span>第 {snapshot.moves.length} 手</span>
            <i />
          </div>
          <div
            className={`player ${snapshot.turn === -1 && !snapshot.over ? "active" : ""}`}
          >
            <i className="stone-avatar white" />
            <div>
              <b>
                {mode === "local"
                  ? "白方棋客"
                  : mode === "review"
                    ? "白方"
                    : mode === "campaign"
                      ? "关卡 · 白棋"
                      : `弈境 AI · ${["", "启蒙", "入门", "进阶", "高手", "棋士"][difficulty]}`}
              </b>
              <span>提取 {snapshot.captures.white} 子</span>
            </div>
            {thinking && <span className="thinking-dots">思考中</span>}
          </div>
        </section>

        {mode === "campaign" && (
          <button className="next-lesson" onClick={() => setPanel("academy")}>
            <GraduationCap size={19} />
            <div>
              <b>边学边练</b>
              <span>{level.chapterTitle}</span>
            </div>
            <ChevronRight size={17} />
          </button>
        )}
        {mode !== "review" && (
          <div className="match-shortcuts">
            <button
              className={mode === "ai" ? "active" : ""}
              onClick={() => startMatch("ai", snapshot.size, difficulty)}
            >
              <Bot size={17} />
              人机
            </button>
            <button
              className={mode === "local" ? "active" : ""}
              onClick={() => startMatch("local", snapshot.size, difficulty)}
            >
              <Users size={17} />
              双人
            </button>
            <button onClick={() => setPanel("exam")}>
              <Medal size={17} />
              换棋盘
            </button>
          </div>
        )}
        <section className="daily-mini">
          <div>
            <span>今日修行</span>
            <b>{profile.daily.puzzles}/3 关</b>
          </div>
          <div className="mini-progress">
            <i
              style={{
                width: `${Math.min(100, (profile.daily.puzzles / 3) * 100)}%`,
              }}
            />
          </div>
          <button onClick={() => setPanel("growth")}>
            查看山居 <ChevronRight size={14} />
          </button>
        </section>
        <div className="keyboard-hint">
          方向键选点 <kbd>Enter</kbd> 落子 <kbd>P</kbd> 停一手
        </div>
      </aside>

      <TutorDock
        ask={askTutor}
        context={`${snapshot.size} 路 · 第 ${snapshot.moves.length} 手`}
      />
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      {achievementToast.length > 0 && (
        <div className="achievement-toast">
          <div className="achievement-seal">
            {achievementById(achievementToast[0])?.icon}
          </div>
          <div>
            <span>成就解锁</span>
            <h3>{achievementById(achievementToast[0])?.title}</h3>
            <p>奖励已放入你的山居</p>
          </div>
          <Sparkles size={20} />
        </div>
      )}

      {puzzleStatus !== "playing" && mode === "campaign" && (
        <div className="modal-backdrop result-backdrop">
          <section className={`result-card ${puzzleStatus}`}>
            <div className="result-symbol">
              {puzzleStatus === "success" ? "妙" : "再"}
            </div>
            <span className="eyebrow">
              {puzzleStatus === "success" ? "修习有成" : "再看一手"}
            </span>
            <h2>
              {puzzleStatus === "success"
                ? "好棋，一气呵成"
                : "胜负之外，别有收获"}
            </h2>
            <p>
              {puzzleStatus === "success"
                ? `第 ${level.id} 关完成，获得修为与棋玉。${profile.stars[level.id] === 3 ? "三星通关，计算清晰。" : ""}`
                : level.hint}
            </p>
            {puzzleStatus === "success" && (
              <div className="result-stars">
                {[1, 2, 3].map(n => (
                  <span
                    key={n}
                    className={
                      n <= (profile.stars[level.id] || 1) ? "earned" : ""
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
            <div className="result-rewards">
              <span>
                修为 <b>+{35 + level.chapter * 8}</b>
              </span>
              <span>
                棋玉 <b>+{level.reward}</b>
              </span>
              <span>
                灵宠 <b>+{Math.round((35 + level.chapter * 8) * 0.55)}</b>
              </span>
            </div>
            <div className="panel-actions centered">
              <button className="secondary" onClick={restart}>
                <RotateCcw size={16} />
                再试一次
              </button>
              {puzzleStatus === "success" ? (
                <button
                  className="primary"
                  onClick={() => startLevel(Math.min(1000, level.id + 1))}
                >
                  下一关
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    setPuzzleStatus("playing");
                    puzzleRef.current = "playing";
                    undo();
                  }}
                >
                  返回思考
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {snapshot.over && mode !== "campaign" && mode !== "review" && (
        <div className="modal-backdrop result-backdrop">
          <section className="result-card success">
            <div className="result-symbol">终</div>
            <span className="eyebrow">对局终了</span>
            <h2>{snapshot.result}</h2>
            <p>
              {mode === "exam"
                ? `新的评级为 ${profile.rank} · ${profile.rating} 分。`
                : "复盘比结果更接近进步。去看看关键的几手，或再开一局。"}
            </p>
            <div className="panel-actions centered">
              <button className="secondary" onClick={exportSgf}>
                <Download size={16} />
                保存棋谱
              </button>
              <button className="secondary" onClick={() => setPanel("review")}>
                复盘
              </button>
              <button className="primary" onClick={restart}>
                再来一局
              </button>
            </div>
          </section>
        </div>
      )}

      {paused && (
        <div className="modal-backdrop">
          <section className="pause-card">
            <div className="brand-seal">弈</div>
            <span className="eyebrow">片刻停云</span>
            <h2>棋局已暂停</h2>
            <p>喝一盏茶，回来再看这一方天地。</p>
            <button
              className="primary full"
              onClick={() => {
                setPaused(false);
                pausedRef.current = false;
              }}
            >
              <Play size={17} />
              继续对局
            </button>
            <button
              className="text-btn"
              onClick={() => {
                setPaused(false);
                pausedRef.current = false;
                restart();
              }}
            >
              重新开始
            </button>
          </section>
        </div>
      )}

      <Panels
        panel={panel}
        close={() => setPanel(null)}
        profile={profile}
        setProfile={setProfile}
        startLevel={startLevel}
        startMatch={startMatch}
        importSgf={importSgf}
        exportSgf={exportSgf}
        reviewIndex={reviewIndex}
        reviewLength={reviewSource?.moves.length || 0}
        reviewSeek={i => {
          setReviewIndex(i);
          setMode("review");
          modeRef.current = "review";
        }}
        reviewPlaying={reviewPlaying}
        setReviewPlaying={setReviewPlaying}
        sampleSgf={SAMPLE_SGF}
        notify={notify}
        persist={persist}
        askTutor={askTutor}
        testAudio={testAudio}
      />
    </main>
  );
}
