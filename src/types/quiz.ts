export enum JlptLevel {
  N5 = 'N5',
  N4 = 'N4',
  N3 = 'N3',
  N2 = 'N2',
  N1 = 'N1',
}

export enum QuizCategory {
  Vocabulary = 'vocabulary',
  Grammar = 'grammar',
  Reading = 'reading',
  Listening = 'listening',
}

export type ExamSectionScope =
  | 'full' // 전 교시 통합 실전 모의고사 (180점 만점)
  | 'mini' // 핵심 20문항 압축 미니 모의고사 (30분)
  | 'period_1' // N1·N2: 언어지식+독해(110/105분) | N3·N4·N5: 문자·어휘(30/25/20분)
  | 'period_2' // N1·N2: 청해(60/50분) | N3·N4·N5: 문법+독해(70/55/40분)
  | 'period_3' // N3·N4·N5: 청해(45/35/30분)
  | QuizCategory.Vocabulary
  | QuizCategory.Grammar
  | QuizCategory.Reading
  | QuizCategory.Listening;

export type CatalogCategoryMode = 'full' | 'mini' | 'section';

export interface VocabularyNote {
  japanese: string;
  reading: string;
  meaningKo: string;
}

export interface PromptSegment {
  text: string;
  highlight?: boolean;
}

export interface QuizQuestion {
  id: string;
  level: JlptLevel;
  category: QuizCategory;
  mondaiTitleKo: string;
  instructionJp: string;
  instructionKo: string;
  passageJp?: string;
  audioScriptJp?: string;
  situationKo?: string;
  promptSegments: PromptSegment[];
  speechTextJp: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  sentenceReadingJp: string;
  translationKo: string;
  explanationKo: string;
  vocabularyNotes: VocabularyNote[];
}

export interface ExamPeriodSpec {
  scope: 'period_1' | 'period_2' | 'period_3';
  periodLabelKo: string;
  titleKo: string;
  minutes: number;
  questionCount: number;
  categories: QuizCategory[];
}

export interface LevelInfo {
  level: JlptLevel;
  rankOrder: number;
  titleKo: string;
  stageKo: string;
  difficultySummaryKo: string;
  totalMinutes: number;
  totalQuestions: number;
  categoryCounts: Record<QuizCategory, number>;
  questionBreakdownSummaryKo: string;
  passingScore: number;
  maxScore: number;
  minScoreRuleKo: string;
  isCombinedLangReadingScore: boolean;
  periods: ExamPeriodSpec[];
  categoryRecommendMinutes: Record<QuizCategory, number>;
}

export interface UserAnswerState {
  selectedOption: number | null;
  isChecked: boolean;
}

export interface ActiveExamConfig {
  level: JlptLevel;
  testNumber: number; // 1 ~ 10
  scope: ExamSectionScope;
  titleKo: string;
  subtitleKo: string;
  durationSeconds: number;
  instantFeedback: boolean;
}

export interface MockTestProgressEntry {
  key: string;
  level: JlptLevel;
  testNumber: number;
  scope: ExamSectionScope;
  answeredCount: number;
  totalCount: number;
  completed: boolean;
  bestScaledScore: number | null;
  maxScaledScore: number;
  passed: boolean | null;
  failedByCutoff?: boolean;
  savedAnswers?: Record<string, UserAnswerState>;
  lastIndex?: number;
  remainingSeconds?: number;
  updatedAt: number;
}
