import {
  ExamSectionScope,
  JlptLevel,
  MockTestProgressEntry,
  UserAnswerState,
} from '../types/quiz';

const LEGACY_STORAGE_KEYS = [
  'haru_jlpt_mock_progress_v2',
  'haru_jlpt_mock_progress_v1',
];
const STORAGE_KEY = 'haru_jlpt_mock_progress_v3';

export function makeProgressKey(
  level: JlptLevel,
  testNumber: number,
  scope: ExamSectionScope
): string {
  return `${level}::t${testNumber}::${scope}`;
}

export function loadAllMockProgress(): Record<string, MockTestProgressEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, MockTestProgressEntry>;
      }
    }

    // Migrate completed best scores from legacy keys while dropping unsubmitted savedAnswers
    // whose question counts and option indices changed when official counts were applied.
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyRaw = window.localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed && typeof legacyParsed === 'object') {
          const migrated: Record<string, MockTestProgressEntry> = {};
          for (const [k, entry] of Object.entries(
            legacyParsed as Record<string, MockTestProgressEntry>
          )) {
            if (entry && entry.completed) {
              migrated[k] = {
                ...entry,
                savedAnswers: undefined,
                lastIndex: 0,
                remainingSeconds: undefined,
              };
            }
          }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    }

    return {};
  } catch {
    return {};
  }
}

export function getMockProgress(
  level: JlptLevel,
  testNumber: number,
  scope: ExamSectionScope
): MockTestProgressEntry | null {
  const all = loadAllMockProgress();
  return all[makeProgressKey(level, testNumber, scope)] ?? null;
}

export function saveInProgressAttempt(params: {
  level: JlptLevel;
  testNumber: number;
  scope: ExamSectionScope;
  answers: Record<string, UserAnswerState>;
  totalCount: number;
  currentIndex: number;
  remainingSeconds: number;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllMockProgress();
    const key = makeProgressKey(params.level, params.testNumber, params.scope);
    const prev = all[key];
    const answeredCount = Object.values(params.answers).filter(
      (a) => a.selectedOption !== null
    ).length;

    all[key] = {
      key,
      level: params.level,
      testNumber: params.testNumber,
      scope: params.scope,
      answeredCount,
      totalCount: params.totalCount,
      completed: prev?.completed ?? false,
      bestScaledScore: prev?.bestScaledScore ?? null,
      maxScaledScore:
        prev?.maxScaledScore ?? (params.scope === 'full' ? 180 : 60),
      passed: prev?.passed ?? null,
      failedByCutoff: prev?.failedByCutoff,
      savedAnswers: params.answers,
      lastIndex: params.currentIndex,
      remainingSeconds: params.remainingSeconds,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors
  }
}

export function saveCompletedAttempt(params: {
  level: JlptLevel;
  testNumber: number;
  scope: ExamSectionScope;
  totalCount: number;
  scaledScore: number;
  maxScaledScore: number;
  passed: boolean | null;
  failedByCutoff?: boolean;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllMockProgress();
    const key = makeProgressKey(params.level, params.testNumber, params.scope);
    const prev = all[key];
    const bestScaledScore =
      prev?.bestScaledScore !== null && prev?.bestScaledScore !== undefined
        ? Math.max(prev.bestScaledScore, params.scaledScore)
        : params.scaledScore;

    const finalPassed =
      prev?.passed === true
        ? true
        : params.passed !== null
        ? params.passed
        : prev?.passed ?? null;

    all[key] = {
      key,
      level: params.level,
      testNumber: params.testNumber,
      scope: params.scope,
      answeredCount: params.totalCount,
      totalCount: params.totalCount,
      completed: true,
      bestScaledScore,
      maxScaledScore: params.maxScaledScore,
      passed: finalPassed,
      failedByCutoff:
        finalPassed === true ? false : Boolean(params.failedByCutoff),
      savedAnswers: undefined,
      lastIndex: 0,
      remainingSeconds: undefined,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors
  }
}
