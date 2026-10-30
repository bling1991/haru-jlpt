import { JLPT_LEVELS } from '../data/levels';
import { getQuestionsByScope } from '../data/questions';
import { ExamSectionScope, JlptLevel } from '../types/quiz';

interface BenchmarkTableSectionProps {
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
}

export function BenchmarkTableSection({
  onStartExam,
}: BenchmarkTableSectionProps) {
  const levelsN1ToN5 = [...JLPT_LEVELS].sort(
    (a, b) => a.rankOrder - b.rankOrder
  );

  return (
    <section
      id="benchmarks-section"
      className="bg-slate-50/70 border-b border-slate-200 py-14 sm:py-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-2">
            JLPT 공식 시험시간 · 문항 수 · 합격 및 과락 기준표 (N1 ~ N5)
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            급수별 교시 구성, 문항 수 및 합격 기준 일람
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            모든 급수는 아래 공식 시험 시간과 문항 수에 맞추어 전 문항 수록되어 있으며, 시험 종료 시 180점 만점 환산 총점과 영역별 과락 기준 통과 여부를 자동으로 판정합니다.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  급수
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  총 시험 시간
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[230px]">
                  교시 구성 및 영역별 시간
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[180px]">
                  수록 문항 수
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  합격 기준 (180점 만점)
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[175px]">
                  과락 기준 (영역별 최소)
                </th>
                <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
                  실전 응시
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm align-top">
              {levelsN1ToN5.map((lvl) => {
                const actualCount = getQuestionsByScope(lvl.level, 'full').length;
                return (
                  <tr
                    key={lvl.level}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-indigo-950 whitespace-nowrap tabular-nums">
                      <div>JLPT {lvl.level}</div>
                      <div className="font-normal text-xs text-slate-500 mt-0.5">
                        {lvl.stageKo}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap tabular-nums">
                      {lvl.totalMinutes}분
                    </td>

                    <td className="py-4 px-4 text-slate-700 space-y-1 tabular-nums">
                      {lvl.periods.map((p) => (
                        <div key={p.scope}>
                          • {p.periodLabelKo}: {p.titleKo} ({p.minutes}분)
                        </div>
                      ))}
                    </td>

                    <td className="py-4 px-4 text-slate-700 tabular-nums">
                      <div className="font-semibold text-slate-900">
                        회당 {actualCount}문항 × 10회 ({actualCount * 10}문항)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {lvl.questionBreakdownSummaryKo}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-indigo-900 whitespace-nowrap tabular-nums">
                      {lvl.passingScore}점 이상
                    </td>

                    <td className="py-4 px-4 text-slate-700 tabular-nums">
                      <div>{lvl.minScoreRuleKo}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {lvl.difficultySummaryKo}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onStartExam(lvl.level, 'full')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors tabular-nums cursor-pointer"
                      >
                        {lvl.level} 시작 ({actualCount}문항)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
