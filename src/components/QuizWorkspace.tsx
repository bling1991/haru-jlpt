import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Pause,
  Play,
  Send,
  Square,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CATEGORY_LABELS_KO } from '../data/questions';
import {
  ActiveExamConfig,
  QuizCategory,
  QuizQuestion,
  UserAnswerState,
} from '../types/quiz';
import {
  AiVoicePreset,
  changeActiveSpeechRate,
  getVoicePreset,
  isSpeechCached,
  prefetchJapaneseSpeech,
  setVoicePreset,
  speakJapanese,
  SpeechPlaybackSnapshot,
  stopJapaneseSpeech,
  subscribeSpeechStatus,
  togglePauseActiveSpeech,
} from '../utils/speech';

interface QuizWorkspaceProps {
  examConfig: ActiveExamConfig;
  questions: QuizQuestion[];
  answers: Record<string, UserAnswerState>;
  currentIndex: number;
  remainingSeconds: number;
  isTimerPaused: boolean;
  onTogglePauseTimer: () => void;
  onToggleInstantFeedback: (instant: boolean) => void;
  onChangeIndex: (nextIndex: number) => void;
  onSelectOption: (questionId: string, optionIndex: number) => void;
  onFinishQuiz: (timedOut?: boolean) => void;
  onExitToHome: () => void;
}

export function formatTimerDisplay(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function QuizWorkspace({
  examConfig,
  questions,
  answers,
  currentIndex,
  remainingSeconds,
  isTimerPaused,
  onTogglePauseTimer,
  onToggleInstantFeedback,
  onChangeIndex,
  onSelectOption,
  onFinishQuiz,
  onExitToHome,
}: QuizWorkspaceProps) {
  const [confirmUnanswered, setConfirmUnanswered] = useState(false);
  const [showListeningScript, setShowListeningScript] = useState(false);
  const [voicePresetState, setVoicePresetState] = useState<AiVoicePreset>(() =>
    getVoicePreset()
  );
  const [selectedRate, setSelectedRate] = useState<number>(1.0);
  const [isAudioReadyCached, setIsAudioReadyCached] = useState<boolean>(false);
  const [speechSnap, setSpeechSnap] = useState<SpeechPlaybackSnapshot>({
    status: 'idle',
    currentTime: 0,
    duration: 0,
    rate: 1.0,
    preset: getVoicePreset(),
  });

  const currentQuestion = questions[currentIndex];
  const currentAnswer: UserAnswerState = answers[currentQuestion.id] ?? {
    selectedOption: null,
    isChecked: false,
  };

  const isListeningQuestion =
    currentQuestion.category === QuizCategory.Listening;

  const totalCount = questions.length;
  const answeredCount = questions.filter(
    (q) => (answers[q.id]?.selectedOption ?? null) !== null
  ).length;
  const unansweredCount = totalCount - answeredCount;
  const isLastQuestion = currentIndex === totalCount - 1;
  const isLowTime = remainingSeconds <= 180;

  useEffect(() => {
    return subscribeSpeechStatus((snap) => {
      setSpeechSnap(snap);
    });
  }, []);

  // Automatically prefetch AI audio for the current Listening question (+ next Listening question)
  useEffect(() => {
    setConfirmUnanswered(false);
    setShowListeningScript(false);
    stopJapaneseSpeech();

    const cachedNow = isSpeechCached(
      currentQuestion.speechTextJp,
      voicePresetState
    );
    setIsAudioReadyCached(cachedNow);

    if (currentQuestion.category === QuizCategory.Listening) {
      let cancelled = false;
      prefetchJapaneseSpeech(currentQuestion.speechTextJp, voicePresetState)
        .then(() => {
          if (!cancelled) setIsAudioReadyCached(true);
        })
        .catch(() => {
          // Handled gracefully when play is clicked
        });

      const nextQuestion = questions[currentIndex + 1];
      if (nextQuestion && nextQuestion.category === QuizCategory.Listening) {
        void prefetchJapaneseSpeech(
          nextQuestion.speechTextJp,
          voicePresetState
        ).catch(() => {});
      }

      return () => {
        cancelled = true;
      };
    }
  }, [
    currentIndex,
    currentQuestion.category,
    currentQuestion.id,
    currentQuestion.speechTextJp,
    questions,
    voicePresetState,
  ]);

  useEffect(() => {
    return () => {
      stopJapaneseSpeech();
    };
  }, []);

  const handleRequestFinish = useCallback(() => {
    if (unansweredCount > 0 && !confirmUnanswered) {
      setConfirmUnanswered(true);
      return;
    }
    stopJapaneseSpeech();
    onFinishQuiz(false);
  }, [confirmUnanswered, onFinishQuiz, unansweredCount]);

  // Keyboard shortcuts: 1~4 to select, Enter/Arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        if (examConfig.instantFeedback && currentAnswer.isChecked) {
          return;
        }
        const idx = Number(e.key) - 1;
        onSelectOption(currentQuestion.id, idx);
      } else if (
        e.key === 'Enter' &&
        (currentAnswer.isChecked ||
          (!examConfig.instantFeedback && currentAnswer.selectedOption !== null))
      ) {
        e.preventDefault();
        if (!isLastQuestion) {
          onChangeIndex(currentIndex + 1);
        } else {
          handleRequestFinish();
        }
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onChangeIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < totalCount - 1) {
        onChangeIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentAnswer.isChecked,
    currentAnswer.selectedOption,
    currentIndex,
    currentQuestion.id,
    examConfig.instantFeedback,
    handleRequestFinish,
    isLastQuestion,
    onChangeIndex,
    onSelectOption,
    totalCount,
  ]);

  const handlePlayAiAudio = (rateOverride?: number, presetOverride?: AiVoicePreset) => {
    const targetRate = rateOverride ?? selectedRate;
    const targetPreset = presetOverride ?? voicePresetState;
    setSelectedRate(targetRate);
    setVoicePresetState(targetPreset);
    setVoicePreset(targetPreset);

    speakJapanese(
      currentQuestion.speechTextJp,
      targetRate,
      () => {
        setIsAudioReadyCached(true);
      },
      targetPreset
    );
  };

  const handleSelectSpeed = (newRate: number) => {
    setSelectedRate(newRate);
    if (speechSnap.status === 'playing' || speechSnap.status === 'paused') {
      changeActiveSpeechRate(newRate);
    } else {
      handlePlayAiAudio(newRate);
    }
  };

  const handleSelectPreset = (newPreset: AiVoicePreset) => {
    setVoicePresetState(newPreset);
    setVoicePreset(newPreset);
    if (speechSnap.status === 'playing' || speechSnap.status === 'loading') {
      handlePlayAiAudio(selectedRate, newPreset);
    }
  };

  const isAudioBusy = speechSnap.status === 'loading';
  const isAudioPlaying =
    speechSnap.status === 'playing' || speechSnap.status === 'fallback';
  const isAudioPaused = speechSnap.status === 'paused';

  const isCorrect =
    currentAnswer.isChecked &&
    currentAnswer.selectedOption === currentQuestion.correctIndex;

  // Group questions by all 4 categories for the OMR Answer Sheet sidebar
  const sectionGroups: {
    category: QuizCategory;
    labelKo: string;
    items: { question: QuizQuestion; globalIndex: number }[];
  }[] = [
    QuizCategory.Vocabulary,
    QuizCategory.Grammar,
    QuizCategory.Reading,
    QuizCategory.Listening,
  ]
    .map((cat) => ({
      category: cat,
      labelKo: CATEGORY_LABELS_KO[cat],
      items: questions
        .map((question, globalIndex) => ({ question, globalIndex }))
        .filter((entry) => entry.question.category === cat),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="bg-slate-50/70 min-h-[calc(100vh-4rem)] py-5 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Exam Control & Countdown Timer Bar */}
        <div className="bg-white rounded-xl border border-slate-200 px-4 sm:px-6 py-3.5 mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                stopJapaneseSpeech();
                onExitToHome();
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-indigo-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>나가기</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">
              |
            </span>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {examConfig.titleKo}
              </p>
              <p className="hidden sm:block text-xs text-slate-500 truncate">
                {examConfig.subtitleKo}
              </p>
            </div>
          </div>

          {/* Right Controls: Countdown Timer + Pause + Submit */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold tabular-nums ${
                isLowTime
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : isTimerPaused
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-indigo-950'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimerDisplay(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={onTogglePauseTimer}
              aria-label={isTimerPaused ? '타이머 재개' : '타이머 일시정지'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              {isTimerPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-indigo-800" />
                  <span>계속</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>일시정지</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRequestFinish}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>제출·채점</span>
            </button>
          </div>
        </div>

        {/* Clean Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
            <span>
              진행 문항:{' '}
              <strong className="text-slate-900">{currentIndex + 1}</strong> /{' '}
              {totalCount}문항
            </span>
            <span>
              답안 마킹 완료:{' '}
              <strong className="text-indigo-800">{answeredCount}</strong> /{' '}
              {totalCount} ({Math.round((answeredCount / totalCount) * 100)}%)
            </span>
          </div>
          <progress
            value={answeredCount}
            max={totalCount}
            aria-label={`총 ${totalCount}문항 중 ${answeredCount}문항 응답 완료`}
            className="w-full h-2 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-indigo-800 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-800"
          />
        </div>

        {/* 2-Column Exam Workspace: Question Card (8 cols) + OMR Answer Sheet Palette (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Active Question & Korean Explanation */}
          <article className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 sm:p-8">
            {/* Unboxed Question Metadata + AI Japanese Speech Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
                <span className="font-bold text-indigo-800 tabular-nums">
                  문항 {String(currentIndex + 1).padStart(2, '0')} /{' '}
                  {String(totalCount).padStart(2, '0')}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-800">
                  {CATEGORY_LABELS_KO[currentQuestion.category]}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.mondaiTitleKo}</span>
              </div>

              {!isListeningQuestion && (
                <button
                  type="button"
                  onClick={() =>
                    isAudioPlaying || isAudioBusy
                      ? stopJapaneseSpeech()
                      : handlePlayAiAudio(1.0)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isAudioBusy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI 음성 생성 중...</span>
                    </>
                  ) : isAudioPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>음성 정지</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>AI 성우 발음 듣기</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Official Japanese Instruction + Korean Instruction */}
            <div className="mt-4 space-y-1">
              <p className="font-jp text-xs sm:text-sm text-slate-500 leading-relaxed">
                {currentQuestion.instructionJp}
              </p>
              <p className="text-sm sm:text-base font-semibold text-slate-800">
                {currentQuestion.instructionKo}
              </p>
            </div>

            {/* Dedicated Studio AI Listening Audio Console */}
            {isListeningQuestion && (
              <div className="mt-5 p-4 sm:p-5 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-indigo-950">
                      <Headphones className="w-4 h-4 text-indigo-800 shrink-0" />
                      <span>
                        {currentQuestion.situationKo ??
                          '일본어 청해 대화를 듣고 가장 알맞은 답을 고르세요.'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      남녀 2인 대화 AI 성우 음성 · 표준 도쿄 억양 적용
                      {isAudioReadyCached ? ' · 음원 준비 완료' : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowListeningScript((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {showListeningScript ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>대본 가리기</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>대본 보기</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Primary Play / Pause / Stop + Speed & Voice Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isAudioPlaying && !isAudioPaused ? (
                      <button
                        type="button"
                        disabled={isAudioBusy}
                        onClick={() => handlePlayAiAudio(selectedRate)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:opacity-75 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {isAudioBusy ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>AI 성우 음성 생성 중...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>AI 청해 음성 재생</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePauseActiveSpeech()}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {isAudioPaused ? (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              <span>이어서 듣기</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>일시정지</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePlayAiAudio(selectedRate)}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-indigo-900 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>처음부터</span>
                        </button>

                        <button
                          type="button"
                          onClick={stopJapaneseSpeech}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-rose-800 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>정지</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Speed & Voice Tone Selectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      role="group"
                      aria-label="청해 재생 속도"
                      className="inline-flex items-center gap-0.5 p-1 bg-white border border-indigo-200/80 rounded-lg"
                    >
                      {[
                        { label: '0.75x 천천히', rate: 0.75 },
                        { label: '0.88x 약간 천천히', rate: 0.88 },
                        { label: '1.0x 실전', rate: 1.0 },
                      ].map((item) => {
                        const active = Math.abs(selectedRate - item.rate) < 0.02;
                        return (
                          <button
                            key={item.rate}
                            type="button"
                            onClick={() => handleSelectSpeed(item.rate)}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors tabular-nums whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-indigo-800 text-white font-semibold'
                                : 'text-slate-600 hover:text-indigo-900'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      role="group"
                      aria-label="AI 성우 톤 선택"
                      className="inline-flex items-center gap-0.5 p-1 bg-white border border-indigo-200/80 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectPreset('standard')}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          voicePresetState === 'standard'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        명료한 아나운서
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset('warm')}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          voicePresetState === 'warm'
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        차분한 성우
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Audio Progress Bar when playing/paused */}
                {speechSnap.duration > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-indigo-200/60 flex items-center gap-3 text-xs font-mono text-indigo-950 tabular-nums">
                    <span>{formatTimerDisplay(Math.floor(speechSnap.currentTime))}</span>
                    <progress
                      value={speechSnap.currentTime}
                      max={speechSnap.duration}
                      aria-label="청해 음성 재생 진행률"
                      className="flex-1 h-1.5 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-indigo-200/70 [&::-webkit-progress-value]:bg-indigo-800 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-800"
                    />
                    <span>{formatTimerDisplay(Math.ceil(speechSnap.duration))}</span>
                  </div>
                )}

                {showListeningScript && currentQuestion.audioScriptJp && (
                  <div className="mt-4 pt-3.5 border-t border-indigo-200/70">
                    <p className="text-[11px] font-semibold text-indigo-800 mb-1">
                      청해 일본어 대본 (スクリプト)
                    </p>
                    <p className="font-jp text-sm sm:text-base text-slate-900 leading-[1.85] whitespace-pre-line">
                      {currentQuestion.audioScriptJp}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reading / Text-Grammar Passage */}
            {currentQuestion.passageJp && (
              <div className="mt-5 p-4 sm:p-6 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-jp text-base sm:text-[17px] text-slate-900 leading-[1.85] whitespace-pre-line">
                  {currentQuestion.passageJp}
                </p>
              </div>
            )}

            {/* Main Japanese Question Stem */}
            <div className="mt-6 mb-7">
              <h2 className="font-jp text-xl sm:text-2xl font-medium text-slate-950 leading-[1.65] whitespace-pre-line">
                {currentQuestion.promptSegments.map((seg, i) =>
                  seg.highlight ? (
                    <span
                      key={i}
                      className="font-bold text-indigo-900 underline decoration-indigo-700 decoration-2 underline-offset-6 px-0.5"
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </h2>
            </div>

            {/* 4 Multiple-Choice Options */}
            <div role="radiogroup" aria-label="문항 선택지" className="space-y-3">
              {currentQuestion.options.map((optionText, idx) => {
                const isSelected = currentAnswer.selectedOption === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;
                const locked =
                  examConfig.instantFeedback && currentAnswer.isChecked;

                let optionStyles =
                  'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70 text-slate-900';
                let numberBadgeStyles =
                  'bg-slate-100 text-slate-700 border-slate-200';

                if (!currentAnswer.isChecked) {
                  if (isSelected) {
                    optionStyles =
                      'border-indigo-800 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-800';
                    numberBadgeStyles =
                      'bg-indigo-800 text-white border-indigo-800';
                  }
                } else {
                  if (isCorrectOption) {
                    optionStyles =
                      'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600';
                    numberBadgeStyles =
                      'bg-emerald-700 text-white border-emerald-700';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyles =
                      'border-rose-600 bg-rose-50/70 text-rose-950 ring-1 ring-rose-600';
                    numberBadgeStyles = 'bg-rose-700 text-white border-rose-700';
                  } else {
                    optionStyles = 'border-slate-200 bg-white text-slate-500';
                    numberBadgeStyles =
                      'bg-slate-100 text-slate-400 border-slate-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={locked}
                    onClick={() => onSelectOption(currentQuestion.id, idx)}
                    className={`w-full min-h-[54px] px-4 py-3.5 rounded-xl border text-left flex items-center justify-between gap-4 transition-all duration-150 ${optionStyles} ${
                      locked ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-md border text-xs font-bold flex items-center justify-center shrink-0 tabular-nums transition-colors ${numberBadgeStyles}`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-jp text-base sm:text-lg font-medium leading-snug">
                        {optionText}
                      </span>
                    </div>

                    {currentAnswer.isChecked && isCorrectOption && (
                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-800 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>정답</span>
                      </span>
                    )}

                    {currentAnswer.isChecked && isSelected && !isCorrectOption && (
                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-800 whitespace-nowrap shrink-0">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>선택한 오답</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inline Unanswered Confirmation before Final Grading */}
            {confirmUnanswered && (
              <div
                role="alert"
                className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <p className="text-sm text-amber-950">
                  아직 선택하지 않은 문항이{' '}
                  <strong className="font-bold tabular-nums">
                    {unansweredCount}개
                  </strong>{' '}
                  남아 있습니다. 미응답 문항은 오답 처리됩니다. 지금 채점할까요?
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmUnanswered(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                  >
                    계속 풀기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopJapaneseSpeech();
                      onFinishQuiz(false);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 whitespace-nowrap cursor-pointer"
                  >
                    제출 및 채점하기
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar: Previous / Next or Finish */}
            <div className="mt-7 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onChangeIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전 문제</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                {examConfig.instantFeedback && !currentAnswer.isChecked && (
                  <span className="hidden sm:inline text-xs text-slate-500">
                    보기를 클릭하면 즉시 정답과 해설이 표시됩니다
                  </span>
                )}

                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => onChangeIndex(currentIndex + 1)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      currentAnswer.selectedOption !== null
                        ? 'font-semibold text-white bg-indigo-800 hover:bg-indigo-900'
                        : 'font-medium text-slate-700 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <span>다음 문제</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestFinish}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-800 hover:bg-indigo-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>최종 성적표 보기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Korean Explanation Section */}
            {currentAnswer.isChecked && (
              <div className="mt-7 pt-7 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold text-emerald-900">
                          정답입니다! ({currentQuestion.correctIndex + 1}번)
                        </h3>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                        <h3 className="text-base sm:text-lg font-bold text-rose-900">
                          오답입니다 · 정답은 {currentQuestion.correctIndex + 1}번「
                          <span className="font-jp">
                            {currentQuestion.options[currentQuestion.correctIndex]}
                          </span>
                          」입니다
                        </h3>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayAiAudio(0.92)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 hover:text-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>AI 성우 음성 다시 듣기</span>
                  </button>
                </div>

                {/* Reading / Script & Korean Translation */}
                <div className="space-y-2.5 text-sm sm:text-[15px] pb-5 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-900 mr-2">
                      {isListeningQuestion ? '청해 대본' : '독음'}
                    </span>
                    <span className="font-jp text-indigo-950 whitespace-pre-line leading-relaxed">
                      {currentQuestion.sentenceReadingJp}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900 mr-2">해석</span>
                    <span>{currentQuestion.translationKo}</span>
                  </p>
                </div>

                {/* Detailed Korean Commentary */}
                <div className="py-5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-indigo-800 mb-1.5">
                    한국어 핵심 해설
                  </p>
                  <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">
                    {currentQuestion.explanationKo}
                  </p>
                </div>

                {/* Key Vocabulary List */}
                {currentQuestion.vocabularyNotes.length > 0 && (
                  <div className="pt-5">
                    <p className="text-xs font-semibold text-slate-500 mb-3">
                      주요 어휘 및 표현 정리
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                      {currentQuestion.vocabularyNotes.map((vocab, vIdx) => (
                        <div
                          key={vIdx}
                          className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100"
                        >
                          <div className="min-w-0">
                            <span className="font-jp font-semibold text-slate-900">
                              {vocab.japanese}
                            </span>
                            <span className="ml-2 font-jp text-xs text-slate-500">
                              {vocab.reading}
                            </span>
                          </div>
                          <span className="text-slate-700 shrink-0">
                            {vocab.meaningKo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Next Button */}
                <div className="mt-6 pt-5 border-t border-slate-200 flex justify-end">
                  {!isLastQuestion ? (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeIndex(currentIndex + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>다음 문제로 이동</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestFinish}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>최종 성적표 보기</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>

          {/* Right Column: OMR Answer Sheet & Section Navigator */}
          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                OMR 답안지 · 문항 이동
              </h3>
              <span className="text-xs text-slate-600 tabular-nums">
                마킹 <strong className="text-indigo-800">{answeredCount}</strong> /{' '}
                {totalCount}
              </span>
            </div>

            {/* Grading Mode Switch */}
            <div className="py-3 border-b border-slate-100">
              <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                채점 모드 설정
              </p>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onToggleInstantFeedback(true)}
                  className={`py-1.5 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    examConfig.instantFeedback
                      ? 'bg-white text-indigo-950 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  클릭 즉시 채점
                </button>
                <button
                  type="button"
                  onClick={() => onToggleInstantFeedback(false)}
                  className={`py-1.5 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    !examConfig.instantFeedback
                      ? 'bg-white text-indigo-950 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  제출 후 일괄채점
                </button>
              </div>
            </div>

            {/* Scrollable Section-grouped Question Buttons */}
            <div className="py-3.5 max-h-[380px] overflow-y-auto pr-1 space-y-4">
              {sectionGroups.map((group) => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-slate-600 mb-2 tabular-nums">
                    {group.labelKo} ({group.items.length}문항)
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {group.items.map(({ question, globalIndex }) => {
                      const st = answers[question.id];
                      const isCurrent = globalIndex === currentIndex;
                      const isAnswered =
                        st?.selectedOption !== null &&
                        st?.selectedOption !== undefined;

                      let btnClass =
                        'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-900';

                      if (isCurrent) {
                        btnClass =
                          'bg-indigo-800 text-white border-indigo-800 font-bold';
                      } else if (st?.isChecked) {
                        btnClass =
                          st.selectedOption === question.correctIndex
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                            : 'bg-rose-50 text-rose-900 border-rose-300 font-semibold';
                      } else if (isAnswered) {
                        btnClass =
                          'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold';
                      }

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => onChangeIndex(globalIndex)}
                          aria-label={`${globalIndex + 1}번 문항 이동`}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`h-8 rounded-md border text-[11px] transition-colors tabular-nums cursor-pointer ${btnClass}`}
                        >
                          {String(globalIndex + 1).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3.5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRequestFinish}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>답안 제출 및 180점 성적표 보기</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
