import { getLevelInfo } from '../data/levels';
import { CATEGORY_LABELS_KO } from '../data/questions';
import {
  ActiveExamConfig,
  QuizCategory,
  QuizQuestion,
  UserAnswerState,
} from '../types/quiz';

export interface ScoreSectionBucket {
  titleKo: string;
  score: number;
  maxScore: number;
  minRequired: number;
  passedMin: boolean;
  correct: number;
  total: number;
}

export interface ExamEvaluationReport {
  scaledScore: number;
  maxScaledScore: number;
  passingScoreRequired: number;
  passedTotalScore: boolean;
  passedAllCutoffs: boolean;
  failedByCutoff: boolean;
  isPassed: boolean;
  buckets: ScoreSectionBucket[];
  failedCutoffBuckets: ScoreSectionBucket[];
  verdictBadgeKo: string;
  headlineKo: string;
  bodyKo: string;
}

/**
 * Evaluates both full 180-point JLPT exams and period/section/mini tests,
 * enforcing official JLPT section minimum cutoffs (과락 기준):
 * - N1/N2/N3 Full Exam: 언어지식(60점, 최소 19점) · 독해(60점, 최소 19점) · 청해(60점, 최소 19점)
 * - N4/N5 Full Exam: 언어지식+독해 통합(120점, 최소 38점) · 청해(60점, 최소 19점)
 * - Period / Subject / Mini Exams: Evaluates 19점 (per 60점 영역) or 38점 (per 120점 통합 영역) cutoffs.
 */
export function evaluateExamAttempt(
  config: ActiveExamConfig,
  questions: QuizQuestion[],
  answers: Record<string, UserAnswerState>
): ExamEvaluationReport {
  const levelInfo = getLevelInfo(config.level);
  const totalCount = questions.length;
  const correctCount = questions.filter(
    (q) => answers[q.id]?.selectedOption === q.correctIndex
  ).length;

  const countForCategories = (cats: QuizCategory[]) => {
    const sub = questions.filter((q) => cats.includes(q.category));
    const right = sub.filter(
      (q) => answers[q.id]?.selectedOption === q.correctIndex
    ).length;
    return { right, total: sub.length };
  };

  let buckets: ScoreSectionBucket[] = [];
  let scaledScore = 0;
  let maxScaledScore = 180;
  let passingScoreRequired = levelInfo.passingScore;

  if (config.scope === 'full') {
    maxScaledScore = 180;
    passingScoreRequired = levelInfo.passingScore;

    if (levelInfo.isCombinedLangReadingScore) {
      // N4 & N5: (언어지식 + 독해) 120점 만점 [과락 38점] + 청해 60점 만점 [과락 19점]
      const written = countForCategories([
        QuizCategory.Vocabulary,
        QuizCategory.Grammar,
        QuizCategory.Reading,
      ]);
      const listening = countForCategories([QuizCategory.Listening]);

      const writtenScore =
        written.total > 0 ? Math.round((written.right / written.total) * 120) : 0;
      const listeningScore =
        listening.total > 0
          ? Math.round((listening.right / listening.total) * 60)
          : 0;

      buckets = [
        {
          titleKo: '언어지식 + 독해',
          score: writtenScore,
          maxScore: 120,
          minRequired: 38,
          passedMin: writtenScore >= 38,
          correct: written.right,
          total: written.total,
        },
        {
          titleKo: '청해',
          score: listeningScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: listeningScore >= 19,
          correct: listening.right,
          total: listening.total,
        },
      ];
    } else {
      // N1, N2, N3: 언어지식(60점, 최소 19점) + 독해(60점, 최소 19점) + 청해(60점, 최소 19점)
      const lang = countForCategories([
        QuizCategory.Vocabulary,
        QuizCategory.Grammar,
      ]);
      const reading = countForCategories([QuizCategory.Reading]);
      const listening = countForCategories([QuizCategory.Listening]);

      const langScore =
        lang.total > 0 ? Math.round((lang.right / lang.total) * 60) : 0;
      const readingScore =
        reading.total > 0 ? Math.round((reading.right / reading.total) * 60) : 0;
      const listeningScore =
        listening.total > 0
          ? Math.round((listening.right / listening.total) * 60)
          : 0;

      buckets = [
        {
          titleKo: '언어지식 (문자·어휘·문법)',
          score: langScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: langScore >= 19,
          correct: lang.right,
          total: lang.total,
        },
        {
          titleKo: '독해',
          score: readingScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: readingScore >= 19,
          correct: reading.right,
          total: reading.total,
        },
        {
          titleKo: '청해',
          score: listeningScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: listeningScore >= 19,
          correct: listening.right,
          total: listening.total,
        },
      ];
    }

    scaledScore = buckets.reduce((acc, b) => acc + b.score, 0);
  } else if (config.scope === 'mini') {
    maxScaledScore = 60;
    passingScoreRequired = Math.round((levelInfo.passingScore / 180) * 60);
    scaledScore =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 60) : 0;
    buckets = [
      {
        titleKo: '미니 모의고사 종합',
        score: scaledScore,
        maxScore: 60,
        minRequired: 19,
        passedMin: scaledScore >= 19,
        correct: correctCount,
        total: totalCount,
      },
    ];
  } else {
    // Period (1교시/2교시/3교시) or Single Subject (문자·어휘/문법/독해/청해)
    const presentCategories = Array.from(
      new Set(questions.map((q) => q.category))
    );
    const hasLang =
      presentCategories.includes(QuizCategory.Vocabulary) ||
      presentCategories.includes(QuizCategory.Grammar);
    const hasReading = presentCategories.includes(QuizCategory.Reading);

    if (!levelInfo.isCombinedLangReadingScore && hasLang && hasReading) {
      // N1/N2 1교시(언어지식+독해) or N3 2교시(문법+독해): evaluate 언어지식(19/60) & 독해(19/60) separately!
      const lang = countForCategories([
        QuizCategory.Vocabulary,
        QuizCategory.Grammar,
      ]);
      const reading = countForCategories([QuizCategory.Reading]);
      const langScore =
        lang.total > 0 ? Math.round((lang.right / lang.total) * 60) : 0;
      const readingScore =
        reading.total > 0 ? Math.round((reading.right / reading.total) * 60) : 0;

      const langLabel =
        presentCategories.includes(QuizCategory.Vocabulary) &&
        presentCategories.includes(QuizCategory.Grammar)
          ? '언어지식 (문자·어휘·문법)'
          : '언어지식 (문법)';

      buckets = [
        {
          titleKo: langLabel,
          score: langScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: langScore >= 19,
          correct: lang.right,
          total: lang.total,
        },
        {
          titleKo: '독해',
          score: readingScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: readingScore >= 19,
          correct: reading.right,
          total: reading.total,
        },
      ];
      maxScaledScore = 120;
      scaledScore = langScore + readingScore;
      passingScoreRequired = Math.round((levelInfo.passingScore / 180) * 120);
    } else if (levelInfo.isCombinedLangReadingScore && presentCategories.length >= 2) {
      // N4/N5 2교시 (문법+독해): 통합 120점 환산 · 과락 기준 38점
      maxScaledScore = 120;
      scaledScore =
        totalCount > 0 ? Math.round((correctCount / totalCount) * 120) : 0;
      passingScoreRequired = Math.round((levelInfo.passingScore / 180) * 120);
      buckets = [
        {
          titleKo: '언어지식(문법) + 독해 통합',
          score: scaledScore,
          maxScore: 120,
          minRequired: 38,
          passedMin: scaledScore >= 38,
          correct: correctCount,
          total: totalCount,
        },
      ];
    } else {
      // Single 60-point subject (문자·어휘, 문법, 독해, 청해, 1교시 어휘, 2/3교시 청해)
      maxScaledScore = 60;
      scaledScore =
        totalCount > 0 ? Math.round((correctCount / totalCount) * 60) : 0;
      passingScoreRequired = Math.round((levelInfo.passingScore / 180) * 60);
      const singleLabel =
        presentCategories.length === 1
          ? CATEGORY_LABELS_KO[presentCategories[0]]
          : config.titleKo;
      buckets = [
        {
          titleKo: singleLabel,
          score: scaledScore,
          maxScore: 60,
          minRequired: 19,
          passedMin: scaledScore >= 19,
          correct: correctCount,
          total: totalCount,
        },
      ];
    }
  }

  const failedCutoffBuckets = buckets.filter((b) => !b.passedMin);
  const passedAllCutoffs = failedCutoffBuckets.length === 0;
  const passedTotalScore = scaledScore >= passingScoreRequired;
  const failedByCutoff = !passedAllCutoffs;
  const isPassed = passedTotalScore && passedAllCutoffs;

  let verdictBadgeKo = '최종 판정: 합격 (合格)';
  let headlineKo = '';
  let bodyKo = '';

  const failedCutoffText = failedCutoffBuckets
    .map((b) => `${b.titleKo}(${b.score}/${b.maxScore}점, 기준 ${b.minRequired}점 미만)`)
    .join(', ');

  if (isPassed) {
    verdictBadgeKo =
      config.scope === 'full' ? '최종 판정: 합격 (合格)' : '판정: 통과 (과락 없음)';
    headlineKo = `축하합니다! ${config.level} 합격 기준(${passingScoreRequired}점 이상)과 과락 기준을 모두 통과했습니다.`;
    bodyKo =
      '실전 시험 시간과 동일한 조건에서 안정적인 실력을 증명하셨습니다. 아래 오답 노트로 틀린 문항만 한 번 더 점검해 보세요.';
  } else if (passedTotalScore && failedByCutoff) {
    verdictBadgeKo = '최종 판정: 불합격 (영역 과락)';
    headlineKo = `총점(${scaledScore}점)은 합격 기준점(${passingScoreRequired}점)을 넘겼지만, 과락 기준 미달로 불합격 처리됩니다.`;
    bodyKo = `과락 발생 영역: ${failedCutoffText}. JLPT는 총점이 합격선을 넘더라도 어느 한 영역이라도 최소 기준점(${levelInfo.minScoreRuleKo}) 미만이면 불합격 처리됩니다.`;
  } else if (!passedTotalScore && failedByCutoff) {
    verdictBadgeKo = '최종 판정: 불합격 (총점 미달 · 영역 과락)';
    const gap = passingScoreRequired - scaledScore;
    headlineKo = `합격 기준점(${passingScoreRequired}점)까지 ${gap}점 부족하며, 과락 미달 영역이 있습니다.`;
    bodyKo = `과락 발생 영역: ${failedCutoffText}. 취약 과목의 기본 점수를 최소 기준점(${levelInfo.minScoreRuleKo}) 이상으로 먼저 끌어올려 보세요.`;
  } else {
    verdictBadgeKo = '최종 판정: 불합격 (총점 미달)';
    const gap = passingScoreRequired - scaledScore;
    headlineKo = `과락 영역은 없으나, 합격 기준점(${passingScoreRequired}점)까지 ${gap}점 부족합니다.`;
    bodyKo =
      '전 영역에서 최소 과락 기준은 넘겼습니다. 아래 ‘틀린 문제만 다시 풀기’로 오답 문항을 복습하면 충분히 합격권에 진입할 수 있습니다.';
  }

  return {
    scaledScore,
    maxScaledScore,
    passingScoreRequired,
    passedTotalScore,
    passedAllCutoffs,
    failedByCutoff,
    isPassed,
    buckets,
    failedCutoffBuckets,
    verdictBadgeKo,
    headlineKo,
    bodyKo,
  };
}
