import { JLPT_LEVELS } from '../data/levels';
import {
  getQuestionCountsByCategory,
  getQuestionsByScope,
} from '../data/questions';
import { ExamSectionScope, JlptLevel, QuizCategory } from '../types/quiz';

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-2">
            JLPT 공식 문항 수 · 시험 시간 · 합격 기준점 및 영역별 과락 기준표 (N1 ~ N5)
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            급수별 영역 문항 수, 시험 시간 및 과락 기준 일람
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            테스트 1부터 테스트 10까지 전 급수 50개 모의고사 모두 아래 공식 문항 수와 제한시간에 정확히 맞추어 수록되어 있으며, 채점 시 총점 합격선과 영역별 최소 점수(과락 기준)를 동시에 판정합니다.
          </p>
        </div>

        {/* Official Question Counts + Exam Duration + Passing & Cutoff Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  급수
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  언어지식 (문자·어휘)
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  언어지식 (문법)
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  독해
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  청해
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  총 문항 수
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  총 시험 시간
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  합격 기준점
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[185px]">
                  과락 기준 (영역별 최소 점수)
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-right whitespace-nowrap"
                >
                  실전 응시
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm align-middle">
              {levelsN1ToN5.map((lvl) => {
                const actualCount = getQuestionsByScope(lvl.level, 'full', 1).length;
                const counts = getQuestionCountsByCategory(lvl.level, 1);

                return (
                  <tr
                    key={lvl.level}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-indigo-950 whitespace-nowrap tabular-nums">
                      <div>{lvl.level}</div>
                      <div className="font-normal text-xs text-slate-500 mt-0.5">
                        {lvl.stageKo}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-slate-800 whitespace-nowrap tabular-nums">
                      {counts[QuizCategory.Vocabulary]}문제
                    </td>

                    <td className="py-4 px-3 text-slate-800 whitespace-nowrap tabular-nums">
                      {counts[QuizCategory.Grammar]}문제
                    </td>

                    <td className="py-4 px-3 text-slate-800 whitespace-nowrap tabular-nums">
                      {counts[QuizCategory.Reading]}문제
                    </td>

                    <td className="py-4 px-3 text-slate-800 whitespace-nowrap tabular-nums">
                      {counts[QuizCategory.Listening]}문제
                    </td>

                    <td className="py-4 px-3 font-bold text-slate-900 whitespace-nowrap tabular-nums">
                      <div>{actualCount}문제</div>
                      <div className="font-normal text-[11px] text-slate-500">
                        10회 · {actualCount * 10}문항
                      </div>
                    </td>

                    <td className="py-4 px-3 font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                      {lvl.totalMinutes}분
                    </td>

                    <td className="py-4 px-3 font-bold text-indigo-900 whitespace-nowrap tabular-nums">
                      <div>{lvl.passingScore}점 이상</div>
                      <div className="font-normal text-[11px] text-slate-500">
                        180점 만점
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 tabular-nums leading-snug">
                      {lvl.minScoreRuleKo}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onStartExam(lvl.level, 'full')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
                      >
                        {lvl.level} 시작 ({actualCount}문제)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 2-Tier Section Cutoff (과락) Detailed Rule Cards matching Reference Spec */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              1. N1 · N2 · N3 과락 기준 (3개 영역 독립 채점)
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              언어지식(문자·어휘·문법), 독해, 청해 각 60점 만점 중 어느 한 영역이라도 19점 미만이면 총점과 관계없이 불합격 처리됩니다.
            </p>

            <table className="mt-4 w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2 pr-3">급수</th>
                  <th className="py-2 px-2">총점 합격 기준</th>
                  <th className="py-2 px-2">언어지식 (60)</th>
                  <th className="py-2 px-2">독해 (60)</th>
                  <th className="py-2 pl-2">청해 (60)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-2.5 pr-3 font-bold text-indigo-950">N1</td>
                  <td className="py-2.5 px-2">100점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 pl-2 font-semibold">19점 이상</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-bold text-indigo-950">N2</td>
                  <td className="py-2.5 px-2">90점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 pl-2 font-semibold">19점 이상</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-bold text-indigo-950">N3</td>
                  <td className="py-2.5 px-2">95점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 px-2 font-semibold">19점 이상</td>
                  <td className="py-2.5 pl-2 font-semibold">19점 이상</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 pt-3.5 border-t border-slate-200 text-xs text-slate-600 space-y-1 tabular-nums leading-relaxed">
              <p className="font-semibold text-slate-900">
                예시 (N3 과락 불합격 사례)
              </p>
              <p>
                언어지식 50점 + 독해 50점 + 청해 <strong className="text-rose-800">18점</strong> = 총점 118점
              </p>
              <p>
                총점은 합격 기준점(95점)을 넘겼지만, 청해 영역 과락(19점 미만)으로 <strong className="text-rose-800">불합격</strong> 처리됩니다.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                2. N4 · N5 과락 기준 (2개 영역 통합 구분)
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                초급 시험(N4·N5)은 언어지식(문자·어휘·문법)과 독해가 하나의 영역(120점 만점)으로 묶여서 채점됩니다.
              </p>

              <table className="mt-4 w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 pr-3">급수</th>
                    <th className="py-2 px-2">총점 합격 기준</th>
                    <th className="py-2 px-2">언어지식 + 독해 (120점 만점)</th>
                    <th className="py-2 pl-2">청해 (60점 만점)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-3 pr-3 font-bold text-indigo-950">N4</td>
                    <td className="py-3 px-2">90점 이상</td>
                    <td className="py-3 px-2 font-semibold">38점 이상</td>
                    <td className="py-3 pl-2 font-semibold">19점 이상</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-3 font-bold text-indigo-950">N5</td>
                    <td className="py-3 px-2">80점 이상</td>
                    <td className="py-3 px-2 font-semibold">38점 이상</td>
                    <td className="py-3 pl-2 font-semibold">19점 이상</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-200 text-xs text-slate-600 space-y-1 tabular-nums leading-relaxed">
              <p className="font-semibold text-slate-900">
                교시별 시험 시간 요약
              </p>
              <p>
                • N4 (총 125분): 1교시 문자·어휘(30분) · 2교시 문법+독해(60분) · 3교시 청해(35분)
              </p>
              <p>
                • N5 (총 105분): 1교시 문자·어휘(25분) · 2교시 문법+독해(50분) · 3교시 청해(30분)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
