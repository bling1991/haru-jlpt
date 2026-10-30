import {
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
  onGoHome: () => void;
}

interface OfficialScoreBucket {
  titleKo: string;
  score: number;
  maxScore: number;
  minRequired: number;
  passedMin: boolean;
  correct: number;
  total: number;
}

export function QuizResults({
  examConfig,
  questions,
  answers,
  elapsedSeconds,
  timedOut,
  onRetryAll,
  onRetryIncorrect,
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

  const isFullExam = examConfig.scope === 'full';

  // Helper to count correct/total for a subset of categories
  const countForCategories = (cats: QuizCategory[]) => {
    const sub = questions.filter((q) => cats.includes(q.category));
    const right = sub.filter(
      (q) => answers[q.id]?.selectedOption === q.correctIndex
    ).length;
    return { right, total: sub.length };
  };

  // Official 180-point scoring calculation for full mock exams
  let officialBuckets: OfficialScoreBucket[] = [];
  let scaledScore = 0;
  let scaledMax = 60;
  let isOfficialPass = false;
  let failedBySectionMinimum = false;

  if (isFullExam) {
    scaledMax = 180;
    if (levelInfo.isCombinedLangReadingScore) {
      // N4 & N5: 언어지식(문자·어휘·문법)·독해 120점 (과락 38점) + 청해 60점 (과락 19점) = 180점
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

      officialBuckets = [
        {
          titleKo: '언어지식(문자·어휘·문법)·독해',
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
      // N1, N2, N3: 언어지식(문자·어휘·문법) 60점(19점) + 독해 60점(19점) + 청해 60점(19점) = 180점
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

      officialBuckets = [
        {
          titleKo: '언어지식(문자·어휘·문법)',
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

    scaledScore = officialBuckets.reduce((acc, b) => acc + b.score, 0);
    const passedAllMins = officialBuckets.every((b) => b.passedMin);
    const passedTotalScore = scaledScore >= levelInfo.passingScore;
    isOfficialPass = passedTotalScore && passedAllMins;
    failedBySectionMinimum = passedTotalScore && !passedAllMins;
  } else {
    // Period or single-category practice scaling
    const distinctCategories = new Set(questions.map((q) => q.category)).size;
    scaledMax = distinctCategories >= 2 ? 120 : 60;
    scaledScore =
      totalCount > 0 ? Math.round((correctCount / totalCount) * scaledMax) : 0;
  }

  let feedbackHeadline = '';
  let feedbackBody = '';

  if (isFullExam) {
    if (isOfficialPass) {
      feedbackHeadline = `축하합니다! JLPT ${examConfig.level} 합격 기준(${levelInfo.passingScore}점) 및 전 영역 과락 기준을 모두 통과했습니다.`;
      feedbackBody =
        '실전 시험 시간과 동일한 조건에서 안정적인 실력을 증명하셨습니다. 아래 오답 노트로 틀린 문항만 한 번 더 점검해 보세요.';
    } else if (failedBySectionMinimum) {
      feedbackHeadline = `총점(${scaledScore}점)은 합격선을 넘었으나, 영역별 최소 득점(과락 기준) 미달 영역이 있습니다.`;
      feedbackBody = `JLPT는 총점이 기준 이상이어도 한 영역이라도 과락 기준(${levelInfo.minScoreRuleKo}) 미만이면 불합격 처리됩니다. 취약 영역을 집중 보완해 보세요.`;
    } else {
      const gap = levelInfo.passingScore - scaledScore;
      feedbackHeadline = `아쉽습니다 · 합격 기준(${levelInfo.passingScore}점)까지 ${gap}점 부족합니다.`;
      feedbackBody =
        '영역별 득점표에서 점수가 낮은 파트를 확인하고, 아래 ‘틀린 문제만 다시 풀기’로 핵심 어휘·문법·청해 표현을 복습해 보세요.';
    }
  } else if (scorePercent >= 75) {
    feedbackHeadline = `우수한 성적입니다! ${examConfig.titleKo} 영역에서 안정적인 득점력을 보여 주셨습니다.`;
    feedbackBody =
      '이 페이스를 유지하며 전 교시 통합 모의고사(180점 만점)에도 도전해 보세요.';
  } else {
    feedbackHeadline =
      '문항별 한국어 해설과 대본·독음을 확인하며 취약 유형을 보완해 보세요.';
    feedbackBody =
      '‘틀린 문제만 다시 풀기’ 버튼을 누르면 오답 문항만 모아 빠르게 재복습할 수 있습니다.';
  }

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
            {/* Score Numeric Display + Pass/Fail Verdict */}
            <div className="md:col-span-5 pb-6 md:pb-0 border-b md:border-b-0 md:border-r border-slate-200 md:pr-8">
              {isFullExam && (
                <div className="mb-3">
                  {isOfficialPass ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-xs sm:text-sm font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>최종 판정: 합격 (合格)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-300 text-xs sm:text-sm font-bold text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>
                        최종 판정: 불합격 (
                        {failedBySectionMinimum ? '영역 과락' : '총점 미달'})
                      </span>
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-baseline gap-2.5">
                <span className="text-5xl sm:text-6xl font-bold tracking-tight text-indigo-900 tabular-nums">
                  {scaledScore}
                </span>
                <span className="text-lg font-semibold text-slate-500 tabular-nums">
                  / {scaledMax}점
                </span>
              </div>

              {isFullExam && (
                <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                  {examConfig.level} 합격 기준: {levelInfo.passingScore}점 이상 · 과락:{' '}
                  {levelInfo.minScoreRuleKo}
                </p>
              )}

              <p className="mt-2.5 text-sm text-slate-600 tabular-nums">
                정답률 <strong className="text-slate-900">{scorePercent}%</strong> ·{' '}
                전체 {totalCount}문항 중{' '}
                <strong className="font-semibold text-emerald-800">
                  {correctCount}문항 정답
                </strong>
              </p>

              <p className="mt-4 text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {feedbackHeadline}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {feedbackBody}
              </p>
            </div>

            {/* Right Column: Official Section Score Cards + 4-Category Accuracy */}
            <div className="md:col-span-7 space-y-6">
              {isFullExam && officialBuckets.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-3">
                    JLPT 공식 채점 구분별 환산 점수 및 과락 판정
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {officialBuckets.map((bucket) => (
                      <div
                        key={bucket.titleKo}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
                      >
                        <p className="text-xs font-semibold text-slate-700 leading-snug">
                          {bucket.titleKo}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1 tabular-nums">
                          <span className="text-2xl font-bold text-slate-900">
                            {bucket.score}
                          </span>
                          <span className="text-xs text-slate-500">
                            / {bucket.maxScore}점
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] tabular-nums">
                          <span className="text-slate-500">
                            최소 {bucket.minRequired}점
                          </span>
                          {bucket.passedMin ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>통과</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-800">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>과락</span>
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
            <button
              type="button"
              onClick={onRetryAll}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 풀기</span>
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
              <span>급수·교시 선택으로 돌아가기</span>
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
