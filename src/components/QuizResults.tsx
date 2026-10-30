import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { getLevelInfo } from '../data/levels';
import { CATEGORY_LABELS_KO } from '../data/questions';
import {
  ActiveExamConfig,
  QuizCategory,
  QuizQuestion,
  UserAnswerState,
} from '../types/quiz';
import { evaluateExamAttempt } from '../utils/grading';
import { speakJapanese } from '../utils/speech';
import { formatTimerDisplay } from './QuizWorkspace';

interface QuizResultsProps {
  examConfig: ActiveExamConfig;
  questions: QuizQuestion[];
  answers: Record<string, UserAnswerState>;
  elapsedSeconds: number;
  timedOut: boolean;
  onRetryAll: () => void;
  onRetryIncorrect: (incorrectQuestions: QuizQuestion[]) => void;
  onStartNextTest?: () => void;
  onGoHome: () => void;
}

export function QuizResults({
  examConfig,
  questions,
  answers,
  elapsedSeconds,
  timedOut,
  onRetryAll,
  onRetryIncorrect,
  onStartNextTest,
  onGoHome,
}: QuizResultsProps) {
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect'>('all');

  const levelInfo = getLevelInfo(examConfig.level);
  const totalCount = questions.length;
  const correctQuestions = questions.filter(
    (q) => answers[q.id]?.selectedOption === q.correctIndex
  );
  const incorrectQuestions = questions.filter(
    (q) => answers[q.id]?.selectedOption !== q.correctIndex
  );

  const correctCount = correctQuestions.length;
  const scorePercent =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const report = evaluateExamAttempt(examConfig, questions, answers);

  const categoryOrder: QuizCategory[] = [
    QuizCategory.Vocabulary,
    QuizCategory.Grammar,
    QuizCategory.Reading,
    QuizCategory.Listening,
  ];

  const categoryStats = categoryOrder
    .map((cat) => {
      const catQuestions = questions.filter((q) => q.category === cat);
      const catCorrect = catQuestions.filter(
        (q) => answers[q.id]?.selectedOption === q.correctIndex
      ).length;
      return {
        category: cat,
        labelKo: CATEGORY_LABELS_KO[cat],
        correct: catCorrect,
        total: catQuestions.length,
      };
    })
    .filter((stat) => stat.total > 0);

  const displayedReviewQuestions =
    reviewFilter === 'incorrect' ? incorrectQuestions : questions;

  const bucketGridCols =
    report.buckets.length >= 3
      ? 'sm:grid-cols-3'
      : report.buckets.length === 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-1';

  return (
    <section className="bg-slate-50/70 min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Score Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-indigo-800 font-medium mb-4">
            <span>
              {examConfig.titleKo} ({levelInfo.stageKo}) · 성적 증명 리포트
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 tabular-nums">
              <Clock className="w-4 h-4 text-indigo-800" />
              <span>
                소요 시간 {formatTimerDisplay(elapsedSeconds)} / 제한시간{' '}
                {formatTimerDisplay(examConfig.durationSeconds)}
              </span>
              {timedOut && (
                <span className="text-rose-700 font-semibold">
                  · 시간 종료 자동제출
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
            {/* Score Numeric Display + Pass/Fail & Cutoff Verdict */}
            <div className="md:col-span-5 pb-6 md:pb-0 border-b md:border-b-0 md:border-r border-slate-200 md:pr-8">
              <div className="mb-3">
                {report.isPassed ? (
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{report.verdictBadgeKo}</span>
                  </div>
                ) : report.failedByCutoff ? (
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{report.verdictBadgeKo}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{report.verdictBadgeKo}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-5xl sm:text-6xl font-bold tracking-tight text-indigo-900 tabular-nums">
                  {report.scaledScore}
                </span>
                <span className="text-lg font-semibold text-slate-500 tabular-nums">
                  / {report.maxScaledScore}점
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-500 tabular-nums leading-relaxed">
                합격 기준: {report.passingScoreRequired}점 이상 · 과락 기준:{' '}
                {examConfig.scope === 'full'
                  ? levelInfo.minScoreRuleKo
                  : report.buckets
                      .map((b) => `${b.titleKo} ${b.minRequired}점 이상`)
                      .join(' / ')}
              </p>

              <p className="mt-2.5 text-sm text-slate-600 tabular-nums">
                정답률 <strong className="text-slate-900">{scorePercent}%</strong> ·{' '}
                전체 {totalCount}문항 중{' '}
                <strong className="font-semibold text-emerald-800">
                  {correctCount}문항 정답
                </strong>
              </p>

              <p className="mt-4 text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {report.headlineKo}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {report.bodyKo}
              </p>
            </div>

            {/* Right Column: Official Section Score Cards + 4-Category Accuracy */}
            <div className="md:col-span-7 space-y-6">
              {report.buckets.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      JLPT 공식 채점 구분별 환산 점수 및 과락(기준점) 판정
                    </h2>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {levelInfo.isCombinedLangReadingScore &&
                      examConfig.scope === 'full'
                        ? 'N4·N5 통합 채점 (120점 + 60점)'
                        : examConfig.scope === 'full'
                        ? 'N1~N3 3영역 채점 (60점 × 3)'
                        : '영역별 최소 기준 적용'}
                    </span>
                  </div>
                  <div className={`grid grid-cols-1 ${bucketGridCols} gap-3`}>
                    {report.buckets.map((bucket) => (
                      <div
                        key={bucket.titleKo}
                        className={`p-3.5 rounded-lg border flex flex-col justify-between ${
                          bucket.passedMin
                            ? 'border-slate-200 bg-slate-50/70'
                            : 'border-rose-300 bg-rose-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {bucket.titleKo}
                          </p>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                            {bucket.correct}/{bucket.total}문항
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1 tabular-nums">
                          <span
                            className={`text-2xl font-bold ${
                              bucket.passedMin ? 'text-slate-900' : 'text-rose-800'
                            }`}
                          >
                            {bucket.score}
                          </span>
                          <span className="text-xs text-slate-500">
                            / {bucket.maxScore}점 만점
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] tabular-nums">
                          <span className="text-slate-600">
                            과락 기준: {bucket.minRequired}점 이상
                          </span>
                          {bucket.passedMin ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>기준 통과</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-800">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>과락 미달</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  세부 파트별 정답률 (문자·어휘 · 문법 · 독해 · 청해)
                </h2>
                <div className="space-y-3.5">
                  {categoryStats.map((stat) => {
                    const pct = Math.round((stat.correct / stat.total) * 100);
                    return (
                      <div key={stat.category}>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <span className="font-semibold text-slate-800">
                            {stat.labelKo}
                          </span>
                          <span className="text-slate-600 tabular-nums">
                            {stat.correct} / {stat.total} 정답 ({pct}%)
                          </span>
                        </div>
                        <progress
                          value={stat.correct}
                          max={stat.total}
                          aria-label={`${stat.labelKo} 정답률 ${pct}%`}
                          className="w-full h-2 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-800 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-800"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Retry & Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
            {onStartNextTest && examConfig.testNumber < 10 && (
              <button
                type="button"
                onClick={onStartNextTest}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
              >
                <span>
                  다음 회차 풀기 (테스트 {examConfig.testNumber + 1})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onRetryAll}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-indigo-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>현재 회차 다시 풀기</span>
            </button>

            {incorrectQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => onRetryIncorrect(incorrectQuestions)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  틀린 문제만 다시 풀기 ({incorrectQuestions.length}문항)
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>모의고사 1~10회 목록으로</span>
            </button>
          </div>
        </div>

        {/* Full Question-by-Question Review & Korean Explanations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                전 문항 정오답 확인 및 한국어 해설
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                독음·청해 대본, 우리말 해석, 상세 해설을 확인하며 오답 원인을 완벽히 정리하세요.
              </p>
            </div>

            {incorrectQuestions.length > 0 && (
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-white text-indigo-950 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 문항 ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                    reviewFilter === 'incorrect'
                      ? 'bg-white text-rose-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  오답·미응답만 ({incorrectQuestions.length})
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-200">
            {displayedReviewQuestions.map((q) => {
              const originalIdx = questions.findIndex((item) => item.id === q.id);
              const userChoice = answers[q.id]?.selectedOption ?? null;
              const isRight = userChoice === q.correctIndex;
              const isListening = q.category === QuizCategory.Listening;

              return (
                <article key={q.id} className="py-7 first:pt-6 last:pb-2">
                  {/* Question Review Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      {isRight ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>정답</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-800">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>{userChoice === null ? '미응답' : '오답'}</span>
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        문항 {String(originalIdx + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="text-slate-500">
                        {CATEGORY_LABELS_KO[q.category]} · {q.mondaiTitleKo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakJapanese(q.speechTextJp, 0.95)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 hover:text-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isListening ? '청해 음성 듣기' : '발음 듣기'}</span>
                    </button>
                  </div>

                  {q.passageJp && (
                    <p className="mb-3 p-4 rounded-lg bg-slate-50 text-sm font-jp text-slate-800 leading-relaxed whitespace-pre-line">
                      {q.passageJp}
                    </p>
                  )}

                  {q.audioScriptJp && (
                    <div className="mb-3 p-4 rounded-lg bg-indigo-50/40 border border-indigo-100 text-sm font-jp text-slate-800 leading-relaxed whitespace-pre-line">
                      {q.audioScriptJp}
                    </div>
                  )}

                  <h3 className="font-jp text-lg sm:text-xl font-medium text-slate-950 leading-relaxed whitespace-pre-line">
                    {q.promptSegments.map((seg, sIdx) =>
                      seg.highlight ? (
                        <span
                          key={sIdx}
                          className="font-bold text-indigo-900 underline decoration-indigo-700 decoration-2 underline-offset-4"
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={sIdx}>{seg.text}</span>
                      )
                    )}
                  </h3>

                  {/* User Choice vs Correct Answer */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
                    <p className="text-slate-700">
                      <span className="text-slate-500 mr-1.5">내 선택:</span>
                      {userChoice !== null ? (
                        <span
                          className={`font-jp font-semibold ${
                            isRight ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {userChoice + 1}번 {q.options[userChoice]}
                        </span>
                      ) : (
                        <span className="text-rose-800 font-medium">선택 안 함</span>
                      )}
                    </p>

                    <p className="text-slate-700">
                      <span className="text-slate-500 mr-1.5">정답:</span>
                      <span className="font-jp font-semibold text-emerald-800">
                        {q.correctIndex + 1}번 {q.options[q.correctIndex]}
                      </span>
                    </p>
                  </div>

                  {/* Korean Reading, Translation & Explanation */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5 text-sm text-slate-700 leading-relaxed">
                    {!isListening && (
                      <p>
                        <strong className="font-semibold text-slate-900 mr-2">
                          독음
                        </strong>
                        <span className="font-jp text-indigo-950">
                          {q.sentenceReadingJp}
                        </span>
                      </p>
                    )}
                    <p>
                      <strong className="font-semibold text-slate-900 mr-2">
                        해석
                      </strong>
                      <span>{q.translationKo}</span>
                    </p>
                    <p className="pt-1 text-slate-600 whitespace-pre-line">
                      {q.explanationKo}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
