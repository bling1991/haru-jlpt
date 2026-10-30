import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Play,
} from 'lucide-react';
import { getLevelInfo, LEVEL_ORDER_N1_TO_N5 } from '../data/levels';
import {
  getQuestionCountsByCategory,
  getQuestionsByScope,
} from '../data/questions';
import { ExamSectionScope, JlptLevel, QuizCategory } from '../types/quiz';

interface CategoryOverviewSectionProps {
  selectedLevel: JlptLevel;
  instantFeedback: boolean;
  onSelectLevel: (level: JlptLevel) => void;
  onToggleInstantFeedback: (instant: boolean) => void;
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
}

export function CategoryOverviewSection({
  selectedLevel,
  instantFeedback,
  onSelectLevel,
  onToggleInstantFeedback,
  onStartExam,
}: CategoryOverviewSectionProps) {
  const levelInfo = getLevelInfo(selectedLevel);
  const counts = getQuestionCountsByCategory(selectedLevel);
  const totalCount = getQuestionsByScope(selectedLevel, 'full').length;

  const categoryCards: {
    category: QuizCategory;
    jpTitle: string;
    koTitle: string;
    description: string;
    subNote: string;
  }[] = [
    {
      category: QuizCategory.Vocabulary,
      jpTitle: '文字・語彙',
      koTitle: '문자·어휘',
      description:
        '한자 읽기, 한자 표기·어형성, 문맥 규정, 유의 표현, 어휘 용법을 실전 문항 수 그대로 집중 풀이합니다.',
      subNote: '독음 · 유의어 정리 수록',
    },
    {
      category: QuizCategory.Grammar,
      jpTitle: '文法',
      koTitle: '문법',
      description:
        '문법 형식 판단, 별표(★) 문장 어순 배열, 장문 흐름 속 글의 문법까지 핵심 문형을 완벽히 점검합니다.',
      subNote: '★ 문장 조립 · 글의 문법',
    },
    {
      category: QuizCategory.Reading,
      jpTitle: '読解',
      koTitle: '독해',
      description:
        '단문·중문·장문 논설 독해와 실용 안내문 조건을 대조하는 정보 검색 지문을 시간 내에 정확히 해독합니다.',
      subNote: '단문 · 중문 · 정보검색',
    },
    {
      category: QuizCategory.Listening,
      jpTitle: '聴解',
      koTitle: '청해',
      description:
        '일본어 대화 음성을 듣고 과제 이해, 포인트 이해, 개요 이해, 즉시 응답, 통합 이해 문제를 실전처럼 풀이합니다.',
      subNote: '일본어 음성 재생 · 대본 지원',
    },
  ];

  return (
    <section
      id="practice-hub-section"
      className="bg-white border-b border-slate-200 py-14 sm:py-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Level & Grading Mode Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-2">
              영역별 집중 연습 & 교시별 실전 시험 · {selectedLevel} (
              {levelInfo.stageKo})
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              4대 영역별 연습부터 전 교시 통합 모의고사까지
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Level Selector Tabs */}
            <div
              role="tablist"
              aria-label="연습 급수 선택"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {LEVEL_ORDER_N1_TO_N5.map((lvl) => {
                const active = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => onSelectLevel(lvl)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-indigo-950 font-bold shadow-xs'
                        : 'text-slate-600 font-medium hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback vs Exam Sheet Mode Toggle */}
            <div
              role="group"
              aria-label="채점 방식 선택"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                onClick={() => onToggleInstantFeedback(true)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  instantFeedback
                    ? 'bg-indigo-800 text-white font-semibold'
                    : 'text-slate-600 font-medium hover:text-slate-900'
                }`}
              >
                클릭 즉시 정답확인
              </button>
              <button
                type="button"
                onClick={() => onToggleInstantFeedback(false)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !instantFeedback
                    ? 'bg-indigo-800 text-white font-semibold'
                    : 'text-slate-600 font-medium hover:text-slate-900'
                }`}
              >
                제출 후 일괄채점
              </button>
            </div>
          </div>
        </div>

        {/* 4 Category Practice Cards (Vocabulary, Grammar, Reading, Listening) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categoryCards.map((card) => {
            const mins = levelInfo.categoryRecommendMinutes[card.category];
            const count = counts[card.category];
            const isListening = card.category === QuizCategory.Listening;

            return (
              <div
                key={card.category}
                className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="font-jp font-semibold text-indigo-800">
                      {card.jpTitle}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-indigo-800" />
                      <span>{mins}분</span>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
                    <span>
                      {selectedLevel} {card.koTitle}
                    </span>
                    {isListening && (
                      <Headphones className="w-4 h-4 text-indigo-800 shrink-0" />
                    )}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between tabular-nums">
                    <span className="font-semibold text-slate-800">
                      {count}문항
                    </span>
                    <span>{card.subNote}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartExam(selectedLevel, card.category)}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap tabular-nums cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {card.koTitle} 시작 ({mins}분 · {count}문항)
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Official Period & Full Mock Exam Simulation Panel */}
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-900 font-medium mb-1.5 tabular-nums">
                <FileText className="w-4 h-4 text-indigo-800" />
                <span>실제 시험장 교시 구성 완벽 반영</span>
                <span aria-hidden="true">·</span>
                <span>
                  180점 만점 환산 (합격 기준 {levelInfo.passingScore}점 ·{' '}
                  {levelInfo.minScoreRuleKo})
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                JLPT {selectedLevel} 공식 교시별 시험 & 전 교시 통합 모의고사 (총{' '}
                {levelInfo.totalMinutes}분 · {totalCount}문항)
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                교시별로 나누어 응시하거나 전 교시를 한 번에 치르고 180점 만점 기준 합격·과락 리포트를 확인하세요.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onStartExam(selectedLevel, 'full')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
            >
              <span>
                {selectedLevel} 전 교시 시작 ({levelInfo.totalMinutes}분 ·{' '}
                {totalCount}문항)
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Period Buttons */}
          <div className="mt-5 pt-5 border-t border-indigo-200/70 flex flex-wrap items-center gap-3">
            {levelInfo.periods.map((period) => {
              const pCount = getQuestionsByScope(
                selectedLevel,
                period.scope
              ).length;
              return (
                <button
                  key={period.scope}
                  type="button"
                  onClick={() => onStartExam(selectedLevel, period.scope)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-950 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100/60 transition-colors whitespace-nowrap tabular-nums cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>
                    {period.periodLabelKo}: {period.titleKo} ({period.minutes}분 ·{' '}
                    {pCount}문항)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
