import { JlptLevel, LevelInfo, QuizCategory } from '../types/quiz';

export const JLPT_LEVELS: LevelInfo[] = [
  {
    level: JlptLevel.N1,
    rankOrder: 1,
    titleKo: '최상급 · 고급 논설문·시사 뉴스·논리적 종합 대화 이해',
    stageKo: 'N1 (1급 · 최상급)',
    difficultySummaryKo:
      '최상급: 고급 논설문, 시사 뉴스, 논리적인 종합 대화 이해 (원어민 수준)',
    totalMinutes: 170,
    totalQuestions: 98,
    categoryCounts: {
      [QuizCategory.Vocabulary]: 25,
      [QuizCategory.Grammar]: 10,
      [QuizCategory.Reading]: 26,
      [QuizCategory.Listening]: 37,
    },
    questionBreakdownSummaryKo:
      '98문제 (문자·어휘 25 / 문법 10 / 독해 26 / 청해 37)',
    passingScore: 100,
    maxScore: 180,
    minScoreRuleKo: '언어지식 19점 / 독해 19점 / 청해 19점',
    isCombinedLangReadingScore: false,
    periods: [
      {
        scope: 'period_1',
        periodLabelKo: '1교시',
        titleKo: '언어지식(문자·어휘·문법) + 독해',
        minutes: 110,
        questionCount: 61,
        categories: [
          QuizCategory.Vocabulary,
          QuizCategory.Grammar,
          QuizCategory.Reading,
        ],
      },
      {
        scope: 'period_2',
        periodLabelKo: '2교시',
        titleKo: '청해',
        minutes: 60,
        questionCount: 37,
        categories: [QuizCategory.Listening],
      },
    ],
    categoryRecommendMinutes: {
      [QuizCategory.Vocabulary]: 25,
      [QuizCategory.Grammar]: 15,
      [QuizCategory.Reading]: 70,
      [QuizCategory.Listening]: 60,
    },
  },
  {
    level: JlptLevel.N2,
    rankOrder: 2,
    titleKo: '중상급 · 신문·기사·평론 및 실무 비즈니스 회화 이해',
    stageKo: 'N2 (2급 · 중상급)',
    difficultySummaryKo:
      '중상급: 일상적인 대화 + 신문, 기사, 평론 등 일반적인 주제의 글 이해 (취업/유학 기준)',
    totalMinutes: 155,
    totalQuestions: 90,
    categoryCounts: {
      [QuizCategory.Vocabulary]: 25,
      [QuizCategory.Grammar]: 12,
      [QuizCategory.Reading]: 21,
      [QuizCategory.Listening]: 32,
    },
    questionBreakdownSummaryKo:
      '90문제 (문자·어휘 25 / 문법 12 / 독해 21 / 청해 32)',
    passingScore: 90,
    maxScore: 180,
    minScoreRuleKo: '언어지식 19점 / 독해 19점 / 청해 19점',
    isCombinedLangReadingScore: false,
    periods: [
      {
        scope: 'period_1',
        periodLabelKo: '1교시',
        titleKo: '언어지식(문자·어휘·문법) + 독해',
        minutes: 105,
        questionCount: 58,
        categories: [
          QuizCategory.Vocabulary,
          QuizCategory.Grammar,
          QuizCategory.Reading,
        ],
      },
      {
        scope: 'period_2',
        periodLabelKo: '2교시',
        titleKo: '청해',
        minutes: 50,
        questionCount: 32,
        categories: [QuizCategory.Listening],
      },
    ],
    categoryRecommendMinutes: {
      [QuizCategory.Vocabulary]: 25,
      [QuizCategory.Grammar]: 20,
      [QuizCategory.Reading]: 60,
      [QuizCategory.Listening]: 50,
    },
  },
  {
    level: JlptLevel.N3,
    rankOrder: 3,
    titleKo: '중급 · 일상생활 대화 및 구체적인 설명문·실용문 이해',
    stageKo: 'N3 (3급 · 중급)',
    difficultySummaryKo:
      '중급: 일상생활에서 나누는 대화 및 구체적인 내용의 글을 대부분 이해하는 수준',
    totalMinutes: 140,
    totalQuestions: 101,
    categoryCounts: {
      [QuizCategory.Vocabulary]: 35,
      [QuizCategory.Grammar]: 22,
      [QuizCategory.Reading]: 16,
      [QuizCategory.Listening]: 28,
    },
    questionBreakdownSummaryKo:
      '101문제 (문자·어휘 35 / 문법 22 / 독해 16 / 청해 28)',
    passingScore: 95,
    maxScore: 180,
    minScoreRuleKo: '언어지식 19점 / 독해 19점 / 청해 19점',
    isCombinedLangReadingScore: false,
    periods: [
      {
        scope: 'period_1',
        periodLabelKo: '1교시',
        titleKo: '언어지식(문자·어휘)',
        minutes: 30,
        questionCount: 35,
        categories: [QuizCategory.Vocabulary],
      },
      {
        scope: 'period_2',
        periodLabelKo: '2교시',
        titleKo: '언어지식(문법) + 독해',
        minutes: 70,
        questionCount: 38,
        categories: [QuizCategory.Grammar, QuizCategory.Reading],
      },
      {
        scope: 'period_3',
        periodLabelKo: '3교시',
        titleKo: '청해',
        minutes: 40,
        questionCount: 28,
        categories: [QuizCategory.Listening],
      },
    ],
    categoryRecommendMinutes: {
      [QuizCategory.Vocabulary]: 30,
      [QuizCategory.Grammar]: 25,
      [QuizCategory.Reading]: 45,
      [QuizCategory.Listening]: 40,
    },
  },
  {
    level: JlptLevel.N4,
    rankOrder: 4,
    titleKo: '초중급 · 기본 어휘·한자 일상 문장 및 천천히 말하는 대화 이해',
    stageKo: 'N4 (4급 · 초중급)',
    difficultySummaryKo:
      '초중급: 기본적인 어휘와 한자로 작성된 일상적인 문장 및 천천히 말하는 대화 이해',
    totalMinutes: 125,
    totalQuestions: 97,
    categoryCounts: {
      [QuizCategory.Vocabulary]: 34,
      [QuizCategory.Grammar]: 25,
      [QuizCategory.Reading]: 10,
      [QuizCategory.Listening]: 28,
    },
    questionBreakdownSummaryKo:
      '97문제 (문자·어휘 34 / 문법 25 / 독해 10 / 청해 28)',
    passingScore: 90,
    maxScore: 180,
    minScoreRuleKo: '(언어지식+독해) 38점 / 청해 19점',
    isCombinedLangReadingScore: true,
    periods: [
      {
        scope: 'period_1',
        periodLabelKo: '1교시',
        titleKo: '언어지식(문자·어휘)',
        minutes: 30,
        questionCount: 34,
        categories: [QuizCategory.Vocabulary],
      },
      {
        scope: 'period_2',
        periodLabelKo: '2교시',
        titleKo: '언어지식(문법) + 독해',
        minutes: 60,
        questionCount: 35,
        categories: [QuizCategory.Grammar, QuizCategory.Reading],
      },
      {
        scope: 'period_3',
        periodLabelKo: '3교시',
        titleKo: '청해',
        minutes: 35,
        questionCount: 28,
        categories: [QuizCategory.Listening],
      },
    ],
    categoryRecommendMinutes: {
      [QuizCategory.Vocabulary]: 30,
      [QuizCategory.Grammar]: 25,
      [QuizCategory.Reading]: 35,
      [QuizCategory.Listening]: 35,
    },
  },
  {
    level: JlptLevel.N5,
    rankOrder: 5,
    titleKo: '초급 입문 · 히라가나·기초 한자 문장 및 일상 기초 대화 이해',
    stageKo: 'N5 (5급 · 입문)',
    difficultySummaryKo:
      '입문: 히라가나·가타카나와 일상생활의 기초 한자 문장 및 짧은 기초 회화 이해',
    totalMinutes: 105,
    totalQuestions: 89,
    categoryCounts: {
      [QuizCategory.Vocabulary]: 33,
      [QuizCategory.Grammar]: 26,
      [QuizCategory.Reading]: 6,
      [QuizCategory.Listening]: 24,
    },
    questionBreakdownSummaryKo:
      '89문제 (문자·어휘 33 / 문법 26 / 독해 6 / 청해 24)',
    passingScore: 80,
    maxScore: 180,
    minScoreRuleKo: '(언어지식+독해) 38점 / 청해 19점',
    isCombinedLangReadingScore: true,
    periods: [
      {
        scope: 'period_1',
        periodLabelKo: '1교시',
        titleKo: '언어지식(문자·어휘)',
        minutes: 25,
        questionCount: 33,
        categories: [QuizCategory.Vocabulary],
      },
      {
        scope: 'period_2',
        periodLabelKo: '2교시',
        titleKo: '언어지식(문법) + 독해',
        minutes: 50,
        questionCount: 32,
        categories: [QuizCategory.Grammar, QuizCategory.Reading],
      },
      {
        scope: 'period_3',
        periodLabelKo: '3교시',
        titleKo: '청해',
        minutes: 30,
        questionCount: 24,
        categories: [QuizCategory.Listening],
      },
    ],
    categoryRecommendMinutes: {
      [QuizCategory.Vocabulary]: 25,
      [QuizCategory.Grammar]: 25,
      [QuizCategory.Reading]: 25,
      [QuizCategory.Listening]: 30,
    },
  },
];

export const LEVEL_ORDER_N1_TO_N5: JlptLevel[] = [
  JlptLevel.N1,
  JlptLevel.N2,
  JlptLevel.N3,
  JlptLevel.N4,
  JlptLevel.N5,
];

export function getLevelInfo(level: JlptLevel): LevelInfo {
  return JLPT_LEVELS.find((l) => l.level === level) ?? JLPT_LEVELS[0];
}
