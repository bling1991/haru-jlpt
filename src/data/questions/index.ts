import { getLevelInfo } from '../levels';
import {
  ActiveExamConfig,
  ExamSectionScope,
  JlptLevel,
  QuizCategory,
  QuizQuestion,
} from '../../types/quiz';
import { n1Questions } from './n1';
import { n2Questions } from './n2';
import { n3Questions } from './n3';
import { n4Questions } from './n4';
import { n5Questions } from './n5';

export const QUESTION_BANK: Record<JlptLevel, QuizQuestion[]> = {
  [JlptLevel.N5]: n5Questions,
  [JlptLevel.N4]: n4Questions,
  [JlptLevel.N3]: n3Questions,
  [JlptLevel.N2]: n2Questions,
  [JlptLevel.N1]: n1Questions,
};

export const TOTAL_QUESTION_BANK_COUNT: number = Object.values(
  QUESTION_BANK
).reduce((acc, arr) => acc + arr.length, 0);

export const CATEGORY_LABELS_KO: Record<QuizCategory, string> = {
  [QuizCategory.Vocabulary]: '문자·어휘',
  [QuizCategory.Grammar]: '문법',
  [QuizCategory.Reading]: '독해',
  [QuizCategory.Listening]: '청해',
};

export function getQuestionsByScope(
  level: JlptLevel,
  scope: ExamSectionScope
): QuizQuestion[] {
  const all = QUESTION_BANK[level] ?? [];
  if (scope === 'full') {
    return all;
  }

  if (scope === 'period_1' || scope === 'period_2' || scope === 'period_3') {
    const info = getLevelInfo(level);
    const period = info.periods.find((p) => p.scope === scope);
    if (!period) return all;
    return all.filter((q) => period.categories.includes(q.category));
  }

  return all.filter((q) => q.category === scope);
}

export function getQuestionCountsByCategory(
  level: JlptLevel
): Record<QuizCategory, number> {
  const all = QUESTION_BANK[level] ?? [];
  return {
    [QuizCategory.Vocabulary]: all.filter(
      (q) => q.category === QuizCategory.Vocabulary
    ).length,
    [QuizCategory.Grammar]: all.filter(
      (q) => q.category === QuizCategory.Grammar
    ).length,
    [QuizCategory.Reading]: all.filter(
      (q) => q.category === QuizCategory.Reading
    ).length,
    [QuizCategory.Listening]: all.filter(
      (q) => q.category === QuizCategory.Listening
    ).length,
  };
}

export function buildExamConfig(
  level: JlptLevel,
  scope: ExamSectionScope,
  instantFeedback = true
): ActiveExamConfig {
  const info = getLevelInfo(level);
  const questions = getQuestionsByScope(level, scope);

  if (scope === 'full') {
    const periodSummary = info.periods
      .map((p) => `${p.periodLabelKo} ${p.titleKo}(${p.minutes}분)`)
      .join(' · ');

    return {
      level,
      scope,
      titleKo: `JLPT ${level} 전 교시 실전 모의고사`,
      subtitleKo: `${periodSummary} · 총 ${info.totalMinutes}분 · ${questions.length}문항`,
      durationSeconds: info.totalMinutes * 60,
      instantFeedback,
    };
  }

  if (scope === 'period_1' || scope === 'period_2' || scope === 'period_3') {
    const period =
      info.periods.find((p) => p.scope === scope) ?? info.periods[0];
    return {
      level,
      scope,
      titleKo: `JLPT ${level} ${period.periodLabelKo} 실전 시험 (${period.titleKo})`,
      subtitleKo: `공식 시험시간 ${period.minutes}분 · 총 ${questions.length}문항`,
      durationSeconds: period.minutes * 60,
      instantFeedback,
    };
  }

  const labelKo = CATEGORY_LABELS_KO[scope];
  const minutes = info.categoryRecommendMinutes[scope];

  const subtitleByCategory: Record<QuizCategory, string> = {
    [QuizCategory.Vocabulary]: `한자 읽기 · 표기 · 어형성 · 문맥 규정 · 유의 표현 · 용법 · 제한시간 ${minutes}분 (${questions.length}문항)`,
    [QuizCategory.Grammar]: `문법 형식 판단 · ★ 문장 만들기 · 글의 문법 · 제한시간 ${minutes}분 (${questions.length}문항)`,
    [QuizCategory.Reading]: `단문 · 중문 · 장문 · 정보 검색 독해 · 제한시간 ${minutes}분 (${questions.length}문항)`,
    [QuizCategory.Listening]: `과제 이해 · 포인트 이해 · 개요 이해 · 즉시 응답 · 통합 이해 · 제한시간 ${minutes}분 (${questions.length}문항)`,
  };

  return {
    level,
    scope,
    titleKo: `JLPT ${level} ${labelKo} 집중 연습`,
    subtitleKo: subtitleByCategory[scope],
    durationSeconds: minutes * 60,
    instantFeedback,
  };
}
