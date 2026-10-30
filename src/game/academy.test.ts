import { describe, expect, it } from "vitest";
import {
  ACADEMY_LESSONS,
  academyEyeCount,
  createAcademyGame,
  isAcademySolved,
} from "./academy";

describe("zero-basics interactive academy", () => {
  it("offers twelve ordered missions with valid quizzes", () => {
    expect(ACADEMY_LESSONS).toHaveLength(12);
    ACADEMY_LESSONS.forEach((lesson, index) => {
      expect(lesson.id).toBe(index + 1);
      expect(lesson.quiz.options).toHaveLength(3);
      expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(lesson.quiz.answer).toBeLessThan(3);
      expect(lesson.quiz.explanations).toHaveLength(3);
      expect(lesson.explanation.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("every practical mission is solved by its intended action", () => {
    for (const lesson of ACADEMY_LESSONS) {
      const game = createAcademyGame(lesson);
      if (lesson.goal === "points") {
        for (const point of lesson.targets)
          expect(game.board.get(point), `lesson ${lesson.id}`).toBe(0);
        continue;
      }
      const result = game.play(lesson.solution);
      expect(
        isAcademySolved(lesson, game, lesson.solution, result),
        `lesson ${lesson.id}: ${result.reason || "objective not met"}`
      ).toBe(true);
    }
  });

  it("uses real suicide and ko rules rather than scripted success", () => {
    const suicide = ACADEMY_LESSONS[5];
    const suicideGame = createAcademyGame(suicide);
    const suicideResult = suicideGame.play(suicide.solution);
    expect(suicideResult.reason).toContain("禁入点");
    expect(suicideGame.moves).toHaveLength(0);

    const ko = ACADEMY_LESSONS[6];
    const koGame = createAcademyGame(ko);
    expect(koGame.moves).toHaveLength(1);
    expect(koGame.turn).toBe(-1);
    const koResult = koGame.play(ko.solution);
    expect(koResult.reason).toContain("打劫");
    expect(isAcademySolved(ko, koGame, ko.solution, koResult)).toBe(true);
    const elsewhere = koGame.play([0, 0]);
    expect(elsewhere.ok).toBe(true);
    expect(isAcademySolved(ko, koGame, [0, 0], elsewhere)).toBe(false);
  });

  it("recognizes two real eyes and rejects the smaller final capture", () => {
    const eyes = ACADEMY_LESSONS[7];
    const eyeGame = createAcademyGame(eyes);
    expect(eyeGame.play(eyes.solution).ok).toBe(true);
    expect(academyEyeCount(eyeGame, eyes.targets[0])).toBeGreaterThanOrEqual(2);

    const final = ACADEMY_LESSONS[11];
    const finalGame = createAcademyGame(final);
    const smallCapture = finalGame.play([1, 2]);
    expect(smallCapture.captured).toBe(1);
    expect(isAcademySolved(final, finalGame, [1, 2], smallCapture)).toBe(false);
  });
});
