import { getLevelInfo } from '../levels';
import { getN1MockTest } from '../mockTests/n1Sets';
import { getN2MockTest } from '../mockTests/n2Sets';
import { getN3MockTest } from '../mockTests/n3Sets';
import { getN4MockTest } from '../mockTests/n4Sets';
import { getN5MockTest } from '../mockTests/n5Sets';
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
import { rebalanceTestQuestions } from './rebalance';
import { assembleOfficialTestQuestions } from '../supplements';

export const TESTS_PER_LEVEL = 10;
export const MOCK_TEST_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const TOTAL_MOCK_EXAM_SETS = 50;

export const QUESTION_BANK: Record<JlptLevel, QuizQuestion[]> = {
  [JlptLevel.N5]: rebalanceTestQuestions(
    assembleOfficialTestQuestions(JlptLevel.N5, 1, n5Questions),
    'N5::test-1'
  ),
  [JlptLevel.N4]: rebalanceTestQuestions(
    assembleOfficialTestQuestions(JlptLevel.N4, 1, n4Questions),
    'N4::test-1'
  ),
  [JlptLevel.N3]: rebalanceTestQuestions(
    assembleOfficialTestQuestions(JlptLevel.N3, 1, n3Questions),
    'N3::test-1'
  ),
  [JlptLevel.N2]: rebalanceTestQuestions(
    assembleOfficialTestQuestions(JlptLevel.N2, 1, n2Questions),
    'N2::test-1'
  ),
  [JlptLevel.N1]: rebalanceTestQuestions(
    assembleOfficialTestQuestions(JlptLevel.N1, 1, n1Questions),
    'N1::test-1'
  ),
};

export const TOTAL_QUESTION_BANK_COUNT: number = Object.values(
  QUESTION_BANK
).reduce((acc, arr) => acc + arr.length * TESTS_PER_LEVEL, 0);

export const CATEGORY_LABELS_KO: Record<QuizCategory, string> = {
  [QuizCategory.Vocabulary]: '문자·어휘',
  [QuizCategory.Grammar]: '문법',
  [QuizCategory.Reading]: '독해',
  [QuizCategory.Listening]: '청해',
};

const fullTestCache = new Map<string, QuizQuestion[]>();
const miniTestCache = new Map<string, QuizQuestion[]>();

export function getFullTestQuestions(
  level: JlptLevel,
  testNumber = 1
): QuizQuestion[] {
  const normalized = Math.max(1, Math.min(TESTS_PER_LEVEL, Math.floor(testNumber)));
  if (normalized === 1) {
    return QUESTION_BANK[level] ?? [];
  }

  const cacheKey = `${level}::test-${normalized}`;
  const cached = fullTestCache.get(cacheKey);
  if (cached) return cached;

  let raw: QuizQuestion[];
  switch (level) {
    case JlptLevel.N5:
      raw = getN5MockTest(normalized);
      break;
    case JlptLevel.N4:
      raw = getN4MockTest(normalized);
      break;
    case JlptLevel.N3:
      raw = getN3MockTest(normalized);
      break;
    case JlptLevel.N2:
      raw = getN2MockTest(normalized);
      break;
    case JlptLevel.N1:
      raw = getN1MockTest(normalized);
      break;
    default:
      raw = QUESTION_BANK[level] ?? [];
      break;
  }

  const assembled = assembleOfficialTestQuestions(level, normalized, raw);
  const balanced = rebalanceTestQuestions(assembled, cacheKey);
  fullTestCache.set(cacheKey, balanced);
  return balanced;
}

export function getQuestionsByScope(
  level: JlptLevel,
  scope: ExamSectionScope,
  testNumber = 1
): QuizQuestion[] {
  const normalized = Math.max(1, Math.min(TESTS_PER_LEVEL, Math.floor(testNumber)));
  const all = getFullTestQuestions(level, normalized);
  if (scope === 'full') {
    return all;
  }

  if (scope === 'mini') {
    const miniKey = `${level}::mini-${normalized}`;
    const cachedMini = miniTestCache.get(miniKey);
    if (cachedMini) return cachedMini;

    const vocab = all
      .filter((q) => q.category === QuizCategory.Vocabulary)
      .slice(0, 6);
    const grammar = all
      .filter((q) => q.category === QuizCategory.Grammar)
      .slice(0, 5);
    const reading = all
      .filter((q) => q.category === QuizCategory.Reading)
      .slice(0, 3);
    const listening = all
      .filter((q) => q.category === QuizCategory.Listening)
      .slice(0, 6);
    const balancedMini = rebalanceTestQuestions(
      [...vocab, ...grammar, ...reading, ...listening],
      miniKey
    );
    miniTestCache.set(miniKey, balancedMini);
    return balancedMini;
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
  level: JlptLevel,
  testNumber = 1
): Record<QuizCategory, number> {
  const all = getFullTestQuestions(level, testNumber);
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

export function getScopeMetaForCatalog(
  level: JlptLevel,
  scope: ExamSectionScope
): {
  passingPoints: number;
  maxPoints: number;
  minutes: number;
  questionCount: number;
  modeLabelKo: string;
  cutoffSummaryKo: string;
} {
  const info = getLevelInfo(level);
  const questions = getQuestionsByScope(level, scope, 1);

  if (scope === 'full') {
    return {
      passingPoints: info.passingScore,
      maxPoints: info.maxScore,
      minutes: info.totalMinutes,
      questionCount: questions.length,
      modeLabelKo: '전체 테스트',
      cutoffSummaryKo: info.minScoreRuleKo,
    };
  }

  if (scope === 'mini') {
    const scaledPass = Math.round((info.passingScore / 180) * 60);
    return {
      passingPoints: scaledPass,
      maxPoints: 60,
      minutes: 30,
      questionCount: questions.length,
      modeLabelKo: '미니 테스트',
      cutoffSummaryKo: '최소 19점 이상 (60점 만점)',
    };
  }

  if (scope === 'period_1' || scope === 'period_2' || scope === 'period_3') {
    const period =
      info.periods.find((p) => p.scope === scope) ?? info.periods[0];
    const maxPts = period.categories.length >= 2 ? 120 : 60;
    const passPts = Math.round((info.passingScore / 180) * maxPts);
    const cutoffSummaryKo =
      period.categories.length >= 2
        ? info.isCombinedLangReadingScore
          ? '통합 38점 이상 (120점 만점)'
          : '언어지식 19점 / 독해 19점'
        : '최소 19점 이상 (60점 만점)';
    return {
      passingPoints: passPts,
      maxPoints: maxPts,
      minutes: period.minutes,
      questionCount: questions.length,
      modeLabelKo: `${period.periodLabelKo} (${period.titleKo})`,
      cutoffSummaryKo,
    };
  }

  const minutes = info.categoryRecommendMinutes[scope];
  const passPts = Math.round((info.passingScore / 180) * 60);
  return {
    passingPoints: passPts,
    maxPoints: 60,
    minutes,
    questionCount: questions.length,
    modeLabelKo: `${CATEGORY_LABELS_KO[scope]} 실력 테스트`,
    cutoffSummaryKo: '최소 19점 이상 (60점 만점)',
  };
}

export function buildExamConfig(
  level: JlptLevel,
  scope: ExamSectionScope,
  instantFeedback = true,
  testNumber = 1
): ActiveExamConfig {
  const normalizedTest = Math.max(
    1,
    Math.min(TESTS_PER_LEVEL, Math.floor(testNumber))
  );
  const info = getLevelInfo(level);
  const questions = getQuestionsByScope(level, scope, normalizedTest);

  if (scope === 'full') {
    const periodSummary = info.periods
      .map((p) => `${p.periodLabelKo} ${p.titleKo}(${p.minutes}분)`)
      .join(' · ');

    return {
      level,
      testNumber: normalizedTest,
      scope,
      titleKo: `JLPT ${level} 테스트 ${normalizedTest} 실전 모의고사`,
      subtitleKo: `${periodSummary} · 총 ${info.totalMinutes}분 · ${questions.length}문항`,
      durationSeconds: info.totalMinutes * 60,
      instantFeedback,
    };
  }

  if (scope === 'mini') {
    return {
      level,
      testNumber: normalizedTest,
      scope,
      titleKo: `JLPT ${level} 테스트 ${normalizedTest} 미니 모의고사`,
      subtitleKo: `문자·어휘 · 문법 · 독해 · 청해 핵심 ${questions.length}문항 · 제한시간 30분`,
      durationSeconds: 30 * 60,
      instantFeedback,
    };
  }

  if (scope === 'period_1' || scope === 'period_2' || scope === 'period_3') {
    const period =
      info.periods.find((p) => p.scope === scope) ?? info.periods[0];
    return {
      level,
      testNumber: normalizedTest,
      scope,
      titleKo: `JLPT ${level} 테스트 ${normalizedTest} · ${period.periodLabelKo} (${period.titleKo})`,
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
    testNumber: normalizedTest,
    scope,
    titleKo: `JLPT ${level} 테스트 ${normalizedTest} · ${labelKo} 집중 연습`,
    subtitleKo: subtitleByCategory[scope],
    durationSeconds: minutes * 60,
    instantFeedback,
  };
}
