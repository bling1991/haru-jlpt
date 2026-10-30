import { ArrowRight, Clock } from 'lucide-react';
import { JLPT_LEVELS } from '../data/levels';
import { getQuestionsByScope } from '../data/questions';
import { ExamSectionScope, JlptLevel } from '../types/quiz';

interface LevelCardsSectionProps {
  selectedLevel: JlptLevel;
  onSelectLevelOnly: (level: JlptLevel) => void;
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
}

export function LevelCardsSection({
  selectedLevel,
  onSelectLevelOnly,
  onStartExam,
}: LevelCardsSectionProps) {
  const levelsN1ToN5 = [...JLPT_LEVELS].sort(
    (a, b) => a.rankOrder - b.rankOrder
  );

  return (
    <section
      id="levels-section"
      className="bg-slate-50/70 border-b border-slate-200 py-14 sm:py-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-2">
              전 급수 실전 모의고사 오픈 · N1(1급) ~ N5(5급)
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              1급부터 5급까지 공식 시간·문항 수 그대로 응시하기
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            각 급수 카드에서 <strong className="font-semibold text-indigo-900">전 교시 통합 모의고사(90~170분)</strong>를 바로 시작하거나, <strong className="font-semibold text-slate-800">1교시 · 2교시 · 3교시</strong>를 나누어 실전처럼 응시할 수 있습니다.
          </p>
        </div>

        {/* Five functional cards for JLPT N1, N2, N3, N4, N5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelsN1ToN5.map((item) => {
            const isSelected = item.level === selectedLevel;
            const totalLoaded = getQuestionsByScope(item.level, 'full').length;

            return (
              <article
                key={item.level}
                onClick={() => onSelectLevelOnly(item.level)}
                className={`flex flex-col justify-between rounded-xl p-6 transition-all duration-150 bg-white ${
                  isSelected
                    ? 'border-2 border-indigo-800'
                    : 'border border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  {/* Unboxed quiet metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          isSelected
                            ? 'font-semibold text-indigo-800'
                            : 'font-medium text-slate-700'
                        }
                      >
                        {item.stageKo}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        합격 {item.passingScore}/{item.maxScore}점
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-800 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>총 {item.totalMinutes}분</span>
                    </span>
                  </div>

                  {/* Level Title */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                      JLPT {item.level}
                    </h3>
                    <span className="text-xs font-semibold text-indigo-900 tabular-nums">
                      총 {totalLoaded}문항 수록
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.difficultySummaryKo}
                  </p>

                  <p className="mt-2 text-xs text-slate-500 tabular-nums">
                    과락 기준: {item.minScoreRuleKo}
                  </p>

                  {/* Official Period Breakdown Buttons (1교시 / 2교시 / 3교시) */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2.5">
                      교시별 실전 바로 풀기 (공식 제한시간 적용)
                    </p>
                    <div className="space-y-2">
                      {item.periods.map((period) => {
                        const periodQuestions = getQuestionsByScope(
                          item.level,
                          period.scope
                        ).length;

                        return (
                          <button
                            key={period.scope}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartExam(item.level, period.scope);
                            }}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-indigo-900 mr-1.5">
                                {period.periodLabelKo}
                              </span>
                              <span className="text-xs font-medium text-slate-800">
                                {period.titleKo}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0 tabular-nums">
                              {period.minutes}분 · {periodQuestions}문항
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Full Level Mock Test Action */}
                <div className="mt-5 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartExam(item.level, 'full');
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                      isSelected
                        ? 'text-white bg-indigo-800 hover:bg-indigo-900'
                        : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-800 hover:text-white'
                    }`}
                  >
                    <span>
                      {item.level} 전 교시 모의고사 ({item.totalMinutes}분 ·{' '}
                      {totalLoaded}문항)
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
