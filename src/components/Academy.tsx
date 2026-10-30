import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Flag,
  Lightbulb,
  Lock,
  MousePointer2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import {
  ACADEMY_LESSONS,
  academyMistake,
  createAcademyGame,
  isAcademySolved,
  type AcademyLesson,
} from "@/game/academy";
import { addXp } from "@/game/profile";
import { coords, type GoGame } from "@/game/rules";
import type { GameSnapshot, Profile, Vertex } from "@/game/goTypes";
import type { SfxId } from "@/game/audio";

type Step = 0 | 1 | 2;
type Feedback = { type: "success" | "error" | "info"; text: string } | null;

interface AcademyProps {
  profile: Profile;
  persist: (profile: Profile) => void;
  startFirstMatch: () => void;
  sfx: (id: SfxId) => void;
}

const pointKey = (point: Vertex) => `${point[0]},${point[1]}`;
const includesPoint = (points: Vertex[], point: Vertex) =>
  points.some(at => pointKey(at) === pointKey(point));
const firstOpenLesson = (profile: Profile) =>
  Math.min(11, Math.max(0, Math.min(12, profile.stats.lessons)));

function StoneBuddy({
  mood,
  text,
}: {
  mood: "calm" | "thinking" | "happy";
  text: string;
}) {
  return (
    <div className={`academy-buddy academy-buddy-${mood}`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <defs>
          <radialGradient id="buddy-stone" cx="32%" cy="24%" r="76%">
            <stop offset="0" stopColor="#65716d" />
            <stop offset="0.42" stopColor="#293532" />
            <stop offset="1" stopColor="#111a18" />
          </radialGradient>
        </defs>
        <ellipse cx="36" cy="63" rx="23" ry="5" fill="rgba(0,0,0,.2)" />
        <circle
          cx="36"
          cy="35"
          r="27"
          fill="url(#buddy-stone)"
          stroke="rgba(255,255,255,.2)"
        />
        <path
          d="M20 20c7-9 22-12 31-3"
          fill="none"
          stroke="rgba(255,255,255,.18)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {mood === "happy" ? (
          <>
            <path
              d="M25 33q4 5 8 0M40 33q4 5 8 0"
              fill="none"
              stroke="#eef5ed"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M29 43q7 9 14 0"
              fill="none"
              stroke="#eef5ed"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="29" cy="34" r="2.2" fill="#eef5ed" />
            <circle cx="44" cy="34" r="2.2" fill="#eef5ed" />
            <path
              d={mood === "thinking" ? "M31 45q5-3 10 0" : "M30 43q6 6 12 0"}
              fill="none"
              stroke="#eef5ed"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          </>
        )}
        <path
          d="M57 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
          fill="var(--accent-strong)"
        />
      </svg>
      <div>
        <b>棋灵团子</b>
        <p>{text}</p>
      </div>
    </div>
  );
}

function AcademyBoard({
  lesson,
  game,
  snapshot,
  interactive,
  selected,
  hint,
  solved,
  onPoint,
}: {
  lesson: AcademyLesson;
  game: GoGame;
  snapshot: GameSnapshot;
  interactive: boolean;
  selected: Vertex[];
  hint: boolean;
  solved: boolean;
  onPoint: (point: Vertex) => void;
}) {
  const padding = 36;
  const gap = (320 - padding * 2) / (lesson.size - 1);
  const xy = (point: Vertex) => ({
    x: padding + point[0] * gap,
    y: padding + point[1] * gap,
  });
  const liberties =
    lesson.demoLiberties && game.board.get(lesson.demoLiberties)
      ? game.board.getLiberties(lesson.demoLiberties)
      : [];
  const demoPoints = lesson.demoTerritory || liberties;
  const showSolution = interactive && hint && lesson.goal !== "points";
  const starPoints: Vertex[] =
    lesson.size === 5
      ? [[2, 2]]
      : [
          [2, 2],
          [6, 2],
          [2, 6],
          [6, 6],
          [4, 4],
        ];

  return (
    <div
      className={`academy-board-wrap ${interactive ? "is-interactive" : ""}`}
    >
      <svg
        className="academy-board"
        viewBox="0 0 320 320"
        role="group"
        aria-label={`${lesson.title}小棋盘`}
      >
        <defs>
          <radialGradient id="academy-black-stone" cx="32%" cy="25%" r="76%">
            <stop offset="0" stopColor="#68716c" />
            <stop offset="0.38" stopColor="#2c3431" />
            <stop offset="1" stopColor="#101614" />
          </radialGradient>
          <radialGradient id="academy-white-stone" cx="32%" cy="24%" r="78%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.58" stopColor="#e8e7de" />
            <stop offset="1" stopColor="#b8bcb2" />
          </radialGradient>
          <filter
            id="academy-stone-shadow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity=".32" />
          </filter>
        </defs>
        <rect
          x="7"
          y="7"
          width="306"
          height="306"
          rx="20"
          className="academy-board-bg"
        />
        <rect
          x="18"
          y="18"
          width="284"
          height="284"
          rx="12"
          className="academy-board-inner"
        />
        {demoPoints.map((point, index) => {
          const { x, y } = xy(point);
          return (
            <circle
              key={`demo-${pointKey(point)}`}
              cx={x}
              cy={y}
              r={gap * 0.31}
              className={
                lesson.demoTerritory ? "academy-territory" : "academy-liberty"
              }
              style={{ animationDelay: `${index * 0.12}s` }}
            />
          );
        })}
        {Array.from({ length: lesson.size }, (_, index) => {
          const at = padding + index * gap;
          return (
            <g key={`line-${index}`} className="academy-grid-line">
              <line x1={padding} y1={at} x2={320 - padding} y2={at} />
              <line x1={at} y1={padding} x2={at} y2={320 - padding} />
            </g>
          );
        })}
        {starPoints.map(point => {
          const { x, y } = xy(point);
          return (
            <circle
              key={`star-${pointKey(point)}`}
              cx={x}
              cy={y}
              r="2.2"
              className="academy-star-point"
            />
          );
        })}
        {lesson.targets.map(point => {
          if (
            !interactive &&
            lesson.goal !== "capture" &&
            lesson.goal !== "escape" &&
            lesson.goal !== "eyes"
          )
            return null;
          if (snapshot.signMap[point[1]][point[0]] === 0) return null;
          const { x, y } = xy(point);
          return (
            <circle
              key={`target-${pointKey(point)}`}
              cx={x}
              cy={y}
              r={gap * 0.4}
              className="academy-target-ring"
            />
          );
        })}
        {snapshot.signMap.map((row, y) =>
          row.map((sign, x) => {
            if (!sign) return null;
            const point: Vertex = [x, y];
            const { x: cx, y: cy } = xy(point);
            const last =
              snapshot.lastMove &&
              pointKey(snapshot.lastMove) === pointKey(point);
            return (
              <g
                key={`stone-${x}-${y}`}
                className="academy-stone"
                filter="url(#academy-stone-shadow)"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={gap * 0.41}
                  fill={
                    sign === 1
                      ? "url(#academy-black-stone)"
                      : "url(#academy-white-stone)"
                  }
                  stroke={
                    sign === 1 ? "rgba(255,255,255,.14)" : "rgba(20,35,29,.25)"
                  }
                  strokeWidth="1"
                />
                {last && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="3.2"
                    fill={sign === 1 ? "#eef3e9" : "#26332d"}
                  />
                )}
              </g>
            );
          })
        )}
        {selected.map((point, index) => {
          const { x, y } = xy(point);
          return (
            <g
              key={`selected-${pointKey(point)}`}
              className="academy-point-found"
            >
              <circle cx={x} cy={y} r={gap * 0.25} />
              <text x={x} y={y + 4} textAnchor="middle">
                {index + 1}
              </text>
            </g>
          );
        })}
        {(showSolution || (interactive && hint && lesson.goal === "points")) &&
          (lesson.goal === "points" ? lesson.targets : [lesson.solution]).map(
            point => {
              if (includesPoint(selected, point)) return null;
              const { x, y } = xy(point);
              return (
                <circle
                  key={`hint-${pointKey(point)}`}
                  cx={x}
                  cy={y}
                  r={gap * 0.34}
                  className="academy-hint-ring"
                />
              );
            }
          )}
        {!interactive &&
          ["illegal", "ko"].includes(lesson.goal) &&
          (() => {
            const { x, y } = xy(lesson.solution);
            return (
              <g className="academy-question-mark">
                <circle cx={x} cy={y} r={gap * 0.32} />
                <text x={x} y={y + 6} textAnchor="middle">
                  ?
                </text>
              </g>
            );
          })()}
        {Array.from({ length: lesson.size }, (_, y) =>
          Array.from({ length: lesson.size }, (_, x) => {
            const point: Vertex = [x, y];
            const center = xy(point);
            const sign = snapshot.signMap[y][x];
            const activate = () => {
              if (interactive && !solved) onPoint(point);
            };
            return (
              <g
                key={`point-${x}-${y}`}
                className="academy-hit"
                transform={`translate(${center.x} ${center.y})`}
                role={interactive && !solved ? "button" : undefined}
                tabIndex={interactive && !solved ? 0 : undefined}
                aria-label={
                  interactive
                    ? `${coords(point, lesson.size)} 交叉点${sign ? "，已有棋子" : "，空点"}`
                    : undefined
                }
                data-testid={`academy-point-${x}-${y}`}
                onClick={activate}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activate();
                  }
                }}
              >
                <circle r={Math.max(17, gap * 0.43)} />
              </g>
            );
          })
        )}
      </svg>
      <span className="academy-board-caption">
        {interactive
          ? `${snapshot.turn === 1 ? "黑棋" : "白棋"}视角 · 点击交叉点操作`
          : `${lesson.size} 路示意图 · 观察棋形`}
      </span>
    </div>
  );
}

export default function Academy({
  profile,
  persist,
  startFirstMatch,
  sfx,
}: AcademyProps) {
  const [lessonIndex, setLessonIndex] = useState(() =>
    firstOpenLesson(profile)
  );
  const lesson = ACADEMY_LESSONS[lessonIndex];
  const gameRef = useRef<GoGame | null>(null);
  if (!gameRef.current) gameRef.current = createAcademyGame(lesson);
  const [snapshot, setSnapshot] = useState(() => gameRef.current!.snapshot());
  const [step, setStep] = useState<Step>(0);
  const [maxStep, setMaxStep] = useState<Step>(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [selected, setSelected] = useState<Vertex[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [, redraw] = useState(0);
  const completed = Math.min(12, Math.max(0, profile.stats.lessons));
  const rewardXp = 20 + lesson.id * 2;

  useEffect(() => {
    gameRef.current = createAcademyGame(lesson);
    setSnapshot(gameRef.current.snapshot());
    setStep(0);
    setMaxStep(0);
    setQuizChoice(null);
    setSelected([]);
    setFeedback(null);
    setHint(false);
    setSolved(false);
    setEarned(0);
    redraw(value => value + 1);
  }, [lessonIndex]);

  const goToStep = (next: Step) => {
    setStep(next);
    setMaxStep(current => Math.max(current, next) as Step);
    setFeedback(null);
    sfx("ui");
  };

  const finishPractice = () => {
    setSolved(true);
    setFeedback({ type: "success", text: lesson.success });
    const firstCompletion = lesson.id > profile.stats.lessons;
    if (firstCompletion) {
      const next: Profile = {
        ...profile,
        stats: {
          ...profile.stats,
          lessons: Math.max(profile.stats.lessons, lesson.id),
        },
        daily: { ...profile.daily, lessons: profile.daily.lessons + 1 },
      };
      addXp(next, rewardXp, 8 + lesson.id);
      persist(next);
      setEarned(rewardXp);
      sfx("achievement");
    } else {
      setEarned(0);
      sfx("success");
    }
  };

  const handlePoint = (point: Vertex) => {
    if (solved) return;
    const game = gameRef.current!;
    if (lesson.goal === "points") {
      if (game.board.get(point) !== 0) {
        setFeedback({
          type: "error",
          text: "这里已经住着棋子。气与地都要找空着的交叉点。",
        });
        sfx("fail");
        return;
      }
      if (includesPoint(selected, point)) {
        setFeedback({
          type: "info",
          text: "这个点已经点亮了，继续找剩下的目标。",
        });
        return;
      }
      if (includesPoint(lesson.targets, point)) {
        const next = [...selected, point];
        setSelected(next);
        setFeedback({
          type: "info",
          text: `找到了 ${next.length} / ${lesson.targets.length} 个目标，继续观察！`,
        });
        sfx("ui");
        if (next.length === lesson.targets.length) finishPractice();
      } else {
        const diagonal =
          lesson.id === 2 &&
          Math.abs(point[0] - 2) === 1 &&
          Math.abs(point[1] - 2) === 1;
        setFeedback({
          type: "error",
          text: diagonal
            ? "这里是斜角。虽然离得近，但没有线直接相连，所以不算气。"
            : lesson.id === 11
              ? "这个空点没有被黑棋完全围住，还不算黑棋的地。宝藏藏在左上角。"
              : "这一点不是小棋子的呼吸口。只看与黑棋上下左右直接相邻的空点。",
        });
        sfx("fail");
      }
      return;
    }

    const result = game.play(point);
    const success = isAcademySolved(lesson, game, point, result);
    setSnapshot(game.snapshot());
    if (success) {
      finishPractice();
      return;
    }
    const message = academyMistake(lesson, game, point, result);
    if (result.ok) {
      game.undo();
      setSnapshot(game.snapshot());
      redraw(value => value + 1);
    }
    setFeedback({ type: "error", text: message });
    sfx("fail");
  };

  const resetPractice = () => {
    gameRef.current = createAcademyGame(lesson);
    setSnapshot(gameRef.current.snapshot());
    setSelected([]);
    setFeedback(null);
    setHint(false);
    setSolved(false);
    setEarned(0);
    redraw(value => value + 1);
    sfx("ui");
  };

  const selectLesson = (index: number) => {
    if (index > completed) return;
    const nextLesson = ACADEMY_LESSONS[index];
    gameRef.current = createAcademyGame(nextLesson);
    setSnapshot(gameRef.current.snapshot());
    setLessonIndex(index);
    sfx("ui");
  };

  const buddyMood = solved
    ? "happy"
    : feedback?.type === "error"
      ? "thinking"
      : "calm";
  const buddyText = feedback?.text || lesson.buddy;

  return (
    <div className="academy-shell">
      <header className="academy-adventure">
        <div className="academy-progress-copy">
          <span>
            <Sparkles size={15} /> 棋灵成长之旅
          </span>
          <b>{completed} / 12 课</b>
        </div>
        <div
          className="academy-progress-track"
          aria-label={`课程完成 ${completed} / 12`}
        >
          <i style={{ width: `${(completed / 12) * 100}%` }} />
        </div>
        <span className="academy-reward-note">
          <Star size={14} /> 首次通关可培养团子
        </span>
      </header>

      <div className="academy-layout">
        <aside className="lesson-list" aria-label="十二节互动入门课">
          {ACADEMY_LESSONS.map((item, index) => {
            const done = index < completed;
            const locked = index > completed;
            return (
              <button
                key={item.id}
                className={`${index === lessonIndex ? "active" : ""} ${done ? "done" : ""} ${locked ? "locked" : ""}`}
                onClick={() => selectLesson(index)}
                disabled={locked}
                aria-current={index === lessonIndex ? "step" : undefined}
              >
                <span className="lesson-map-number">
                  {done ? (
                    <Check size={15} />
                  ) : (
                    String(item.id).padStart(2, "0")
                  )}
                </span>
                <div>
                  <b>{item.title}</b>
                  <small>{item.subtitle}</small>
                </div>
                {locked ? (
                  <Lock size={14} />
                ) : done ? (
                  <Star size={14} className="earned" />
                ) : (
                  <Play size={14} />
                )}
              </button>
            );
          })}
        </aside>

        <article className="academy-stage">
          <header className="academy-mission-head">
            <div>
              <span className="lesson-number">
                任务 {String(lesson.id).padStart(2, "0")} · 约 {lesson.minutes}{" "}
                分钟
              </span>
              <h3>{lesson.title}</h3>
              <p>{lesson.mission}</p>
            </div>
            <div className="academy-xp">
              <Star size={17} />
              <span>首通奖励</span>
              <b>+{rewardXp} XP</b>
            </div>
          </header>

          <nav className="academy-steps" aria-label="本课学习步骤">
            {[
              ["看一看", BookOpen],
              ["想一想", Brain],
              ["试一试", MousePointer2],
            ].map(([label, Icon], index) => {
              const currentStep = index as Step;
              const StepIcon = Icon as typeof BookOpen;
              return (
                <button
                  key={label as string}
                  className={step === currentStep ? "active" : ""}
                  disabled={currentStep > maxStep}
                  onClick={() => goToStep(currentStep)}
                >
                  <span>
                    {step > currentStep || (currentStep === 2 && solved) ? (
                      <Check size={14} />
                    ) : (
                      <StepIcon size={14} />
                    )}
                  </span>
                  {label as string}
                </button>
              );
            })}
          </nav>

          <StoneBuddy mood={buddyMood} text={buddyText} />

          {step === 0 && (
            <div className="academy-learn-grid">
              <AcademyBoard
                lesson={lesson}
                game={gameRef.current}
                snapshot={snapshot}
                interactive={false}
                selected={[]}
                hint={false}
                solved={false}
                onPoint={() => {}}
              />
              <div className="academy-copy">
                <span className="academy-story">{lesson.story}</span>
                {lesson.explanation.map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
                <div className="academy-remember">
                  <Lightbulb size={19} />
                  <div>
                    <b>一句话记住</b>
                    <p>{lesson.remember}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="academy-learn-grid academy-quiz-grid">
              <AcademyBoard
                lesson={lesson}
                game={gameRef.current}
                snapshot={snapshot}
                interactive={false}
                selected={[]}
                hint={false}
                solved={false}
                onPoint={() => {}}
              />
              <div className="academy-quiz">
                <span className="academy-section-label">团子的随堂提问</span>
                <h4>{lesson.quiz.question}</h4>
                <div className="academy-options">
                  {lesson.quiz.options.map((option, index) => {
                    const chosen = quizChoice === index;
                    const correct = chosen && index === lesson.quiz.answer;
                    const wrong = chosen && index !== lesson.quiz.answer;
                    return (
                      <button
                        key={option}
                        className={`${chosen ? "chosen" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                        onClick={() => {
                          setQuizChoice(index);
                          sfx(
                            index === lesson.quiz.answer ? "success" : "fail"
                          );
                        }}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        <b>{option}</b>
                        {correct && <Check size={18} />}
                      </button>
                    );
                  })}
                </div>
                {quizChoice !== null && (
                  <div
                    className={`academy-quiz-feedback ${quizChoice === lesson.quiz.answer ? "success" : "error"}`}
                    role="status"
                  >
                    <b>
                      {quizChoice === lesson.quiz.answer
                        ? "回答正确！"
                        : "再想一步，也没关系。"}
                    </b>
                    <p>{lesson.quiz.explanations[quizChoice]}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="academy-practice-grid">
              <div className="academy-practice-board">
                <AcademyBoard
                  lesson={lesson}
                  game={gameRef.current}
                  snapshot={snapshot}
                  interactive
                  selected={selected}
                  hint={hint}
                  solved={solved}
                  onPoint={handlePoint}
                />
                {solved && (
                  <div className="academy-confetti" aria-hidden="true">
                    {Array.from({ length: 12 }, (_, index) => (
                      <i
                        key={index}
                        style={{
                          left: `${7 + index * 7.7}%`,
                          animationDelay: `${index * 0.045}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="academy-practice-copy">
                <span className="academy-section-label">
                  <Flag size={15} /> 本课动手任务
                </span>
                <h4>{lesson.instruction}</h4>
                {lesson.goal === "points" && (
                  <div className="academy-find-progress">
                    已找到 <b>{selected.length}</b> / {lesson.targets.length}
                  </div>
                )}
                {feedback && (
                  <div
                    className={`academy-practice-feedback ${feedback.type}`}
                    role="status"
                  >
                    {feedback.type === "success" ? (
                      <Trophy size={21} />
                    ) : (
                      <Lightbulb size={21} />
                    )}
                    <p>{feedback.text}</p>
                  </div>
                )}
                {solved && (
                  <div className="academy-complete-badge">
                    <Star size={20} fill="currentColor" />
                    <div>
                      <b>{lesson.id === 12 ? "入门毕业！" : "任务完成！"}</b>
                      <span>
                        {earned
                          ? `获得 ${earned} XP · 团子也成长了`
                          : "重温完成 · 首通奖励已领取"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="academy-practice-tools">
                  <button
                    className="secondary"
                    onClick={() => {
                      setHint(true);
                      setFeedback({ type: "info", text: lesson.hint });
                      sfx("ui");
                    }}
                    disabled={solved}
                  >
                    <Lightbulb size={16} />
                    给我提示
                  </button>
                  <button className="secondary" onClick={resetPractice}>
                    <RotateCcw size={16} />
                    重新练习
                  </button>
                </div>
                <p className="academy-kind-note">
                  可以大胆尝试：错误落子会自动撤回，并告诉你哪里需要重新观察。
                </p>
              </div>
            </div>
          )}

          <footer className="academy-stage-actions">
            {step > 0 ? (
              <button
                className="secondary"
                onClick={() => goToStep((step - 1) as Step)}
              >
                <ArrowLeft size={16} />
                返回上一步
              </button>
            ) : (
              <span />
            )}
            {step === 0 && (
              <button className="primary" onClick={() => goToStep(1)}>
                我看懂了，去答题
                <ArrowRight size={16} />
              </button>
            )}
            {step === 1 && (
              <button
                className="primary"
                disabled={quizChoice !== lesson.quiz.answer}
                onClick={() => goToStep(2)}
              >
                答对了，亲手试试
                <ArrowRight size={16} />
              </button>
            )}
            {step === 2 && !solved && (
              <span className="academy-action-tip">完成实操后解锁下一课</span>
            )}
            {step === 2 && solved && lessonIndex < 11 && (
              <button
                className="primary"
                onClick={() => selectLesson(lessonIndex + 1)}
              >
                前往下一课
                <ArrowRight size={16} />
              </button>
            )}
            {step === 2 && solved && lessonIndex === 11 && (
              <button className="primary" onClick={startFirstMatch}>
                <Play size={16} />
                开始九路棋第一局
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}
