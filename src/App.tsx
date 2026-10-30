import { useCallback, useEffect, useState } from 'react';
import { BenchmarkTableSection } from './components/BenchmarkTableSection';
import { CategoryOverviewSection } from './components/CategoryOverviewSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LevelCardsSection } from './components/LevelCardsSection';
import { MockTestCatalogSection } from './components/MockTestCatalogSection';
import { QuizResults } from './components/QuizResults';
import { QuizWorkspace } from './components/QuizWorkspace';
import {
  buildExamConfig,
  getQuestionsByScope,
  TESTS_PER_LEVEL,
} from './data/questions';
import {
  ActiveExamConfig,
  ExamSectionScope,
  JlptLevel,
  MockTestProgressEntry,
  QuizQuestion,
  UserAnswerState,
} from './types/quiz';
import { evaluateExamAttempt } from './utils/grading';
import {
  getMockProgress,
  loadAllMockProgress,
  saveCompletedAttempt,
  saveInProgressAttempt,
} from './utils/progressStorage';
import { stopJapaneseSpeech } from './utils/speech';

type AppViewMode = 'home' | 'quiz' | 'results';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('home');
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>(JlptLevel.N3);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [progressMap, setProgressMap] = useState<
    Record<string, MockTestProgressEntry>
  >(() => loadAllMockProgress());
  const [isRetrySubset, setIsRetrySubset] = useState<boolean>(false);

  const [examConfig, setExamConfig] = useState<ActiveExamConfig>(() =>
    buildExamConfig(JlptLevel.N3, 'full', true, 1)
  );
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(() =>
    getQuestionsByScope(JlptLevel.N3, 'full', 1)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswerState>>({});

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(140 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const finalizeAndShowResults = useCallback(
    (didTimeOut = false) => {
      stopJapaneseSpeech();
      setTimedOut(didTimeOut);
      setAnswers((prev) => {
        const finalized: Record<string, UserAnswerState> = { ...prev };
        activeQuestions.forEach((q) => {
          const cur = finalized[q.id] ?? {
            selectedOption: null,
            isChecked: false,
          };
          finalized[q.id] = {
            ...cur,
            isChecked: true,
          };
        });

        if (!isRetrySubset && activeQuestions.length > 0) {
          const report = evaluateExamAttempt(
            examConfig,
            activeQuestions,
            finalized
          );
          saveCompletedAttempt({
            level: examConfig.level,
            testNumber: examConfig.testNumber,
            scope: examConfig.scope,
            totalCount: activeQuestions.length,
            scaledScore: report.scaledScore,
            maxScaledScore: report.maxScaledScore,
            passed: report.isPassed,
            failedByCutoff: report.failedByCutoff,
          });
          setProgressMap(loadAllMockProgress());
        }

        return finalized;
      });
      setViewMode('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeQuestions, examConfig, isRetrySubset]
  );

  // Persist in-progress answers so catalog cards show live % progress
  useEffect(() => {
    if (viewMode !== 'quiz' || isRetrySubset || activeQuestions.length === 0) {
      return;
    }
    const answeredCount = Object.values(answers).filter(
      (a) => a.selectedOption !== null
    ).length;
    if (answeredCount === 0) return;

    saveInProgressAttempt({
      level: examConfig.level,
      testNumber: examConfig.testNumber,
      scope: examConfig.scope,
      answers,
      totalCount: activeQuestions.length,
      currentIndex,
      remainingSeconds,
    });
    setProgressMap(loadAllMockProgress());
  }, [
    activeQuestions.length,
    answers,
    currentIndex,
    examConfig.level,
    examConfig.scope,
    examConfig.testNumber,
    isRetrySubset,
    remainingSeconds,
    viewMode,
  ]);

  // Tick countdown timer every second during quiz
  useEffect(() => {
    if (viewMode !== 'quiz' || isTimerPaused) return;

    const timerId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          finalizeAndShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [finalizeAndShowResults, isTimerPaused, viewMode]);

  const launchQuiz = (
    questions: QuizQuestion[],
    config: ActiveExamConfig,
    options?: {
      isSubsetRetry?: boolean;
      restoredAnswers?: Record<string, UserAnswerState>;
      restoredIndex?: number;
      restoredRemainingSeconds?: number;
    }
  ) => {
    stopJapaneseSpeech();
    const initialAnswers: Record<string, UserAnswerState> = {};
    questions.forEach((q) => {
      const saved = options?.restoredAnswers?.[q.id];
      initialAnswers[q.id] = saved ?? {
        selectedOption: null,
        isChecked: false,
      };
    });

    setIsRetrySubset(Boolean(options?.isSubsetRetry));
    setSelectedLevel(config.level);
    setExamConfig(config);
    setActiveQuestions(questions);
    setAnswers(initialAnswers);
    setCurrentIndex(
      options?.restoredIndex !== undefined
        ? Math.max(0, Math.min(questions.length - 1, options.restoredIndex))
        : 0
    );
    setRemainingSeconds(
      options?.restoredRemainingSeconds && options.restoredRemainingSeconds > 15
        ? options.restoredRemainingSeconds
        : config.durationSeconds
    );
    setIsTimerPaused(false);
    setTimedOut(false);
    setViewMode('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartExam = (
    level: JlptLevel,
    scope: ExamSectionScope,
    testNumber = 1,
    resumeSaved = false
  ) => {
    const questions = getQuestionsByScope(level, scope, testNumber);
    if (questions.length === 0) return;
    const config = buildExamConfig(level, scope, instantFeedback, testNumber);

    if (resumeSaved) {
      const saved = getMockProgress(level, testNumber, scope);
      if (saved?.savedAnswers) {
        launchQuiz(questions, config, {
          restoredAnswers: saved.savedAnswers,
          restoredIndex: saved.lastIndex,
          restoredRemainingSeconds: saved.remainingSeconds,
        });
        return;
      }
    }

    launchQuiz(questions, config);
  };

  const handleGoHome = (sectionId?: string) => {
    stopJapaneseSpeech();
    setProgressMap(loadAllMockProgress());
    setViewMode('home');

    requestAnimationFrame(() => {
      if (!sectionId || sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => {
      const existing = prev[questionId];
      if (examConfig.instantFeedback && existing?.isChecked) {
        return prev;
      }
      return {
        ...prev,
        [questionId]: {
          selectedOption: optionIndex,
          isChecked: examConfig.instantFeedback,
        },
      };
    });
  };

  const handleToggleInstantFeedbackInQuiz = (instant: boolean) => {
    setInstantFeedback(instant);
    setExamConfig((prev) => ({
      ...prev,
      instantFeedback: instant,
    }));

    if (instant) {
      setAnswers((prev) => {
        const next: Record<string, UserAnswerState> = { ...prev };
        Object.keys(next).forEach((qId) => {
          if (next[qId].selectedOption !== null) {
            next[qId] = { ...next[qId], isChecked: true };
          }
        });
        return next;
      });
    }
  };

  const handleRetryCurrentSet = () => {
    const fullQuestions = isRetrySubset
      ? getQuestionsByScope(
          examConfig.level,
          examConfig.scope,
          examConfig.testNumber
        )
      : activeQuestions;
    const freshConfig = buildExamConfig(
      examConfig.level,
      examConfig.scope,
      instantFeedback,
      examConfig.testNumber
    );
    launchQuiz(fullQuestions, freshConfig);
  };

  const handleRetryIncorrect = (incorrectQuestions: QuizQuestion[]) => {
    if (incorrectQuestions.length === 0) return;
    const retrySeconds = Math.max(300, incorrectQuestions.length * 90);
    launchQuiz(
      incorrectQuestions,
      {
        level: examConfig.level,
        testNumber: examConfig.testNumber,
        scope: examConfig.scope,
        titleKo: `JLPT ${examConfig.level} 테스트 ${examConfig.testNumber} 오답 복습 (${incorrectQuestions.length}문항)`,
        subtitleKo: `틀린 문항 재풀이 · 제한시간 ${Math.round(retrySeconds / 60)}분`,
        durationSeconds: retrySeconds,
        instantFeedback: true,
      },
      { isSubsetRetry: true }
    );
  };

  const handleStartNextTest = () => {
    const nextNum =
      examConfig.testNumber < TESTS_PER_LEVEL ? examConfig.testNumber + 1 : 1;
    handleStartExam(examConfig.level, examConfig.scope, nextNum, false);
  };

  const elapsedSeconds = Math.max(
    0,
    examConfig.durationSeconds - remainingSeconds
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header
        currentMode={viewMode}
        selectedLevel={selectedLevel}
        onGoHome={handleGoHome}
        onStartExam={handleStartExam}
      />

      <main className="flex-1">
        {viewMode === 'home' && (
          <>
            <HeroSection
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
              onStartExam={handleStartExam}
              onScrollToSection={handleGoHome}
            />
            <MockTestCatalogSection
              selectedLevel={selectedLevel}
              instantFeedback={instantFeedback}
              progressMap={progressMap}
              onSelectLevel={setSelectedLevel}
              onToggleInstantFeedback={setInstantFeedback}
              onStartExam={handleStartExam}
            />
            <LevelCardsSection
              selectedLevel={selectedLevel}
              onSelectLevelOnly={setSelectedLevel}
              onStartExam={handleStartExam}
            />
            <CategoryOverviewSection
              selectedLevel={selectedLevel}
              instantFeedback={instantFeedback}
              onSelectLevel={setSelectedLevel}
              onToggleInstantFeedback={setInstantFeedback}
              onStartExam={handleStartExam}
            />
            <BenchmarkTableSection onStartExam={handleStartExam} />
          </>
        )}

        {viewMode === 'quiz' && activeQuestions.length > 0 && (
          <QuizWorkspace
            examConfig={examConfig}
            questions={activeQuestions}
            answers={answers}
            currentIndex={currentIndex}
            remainingSeconds={remainingSeconds}
            isTimerPaused={isTimerPaused}
            onTogglePauseTimer={() => setIsTimerPaused((prev) => !prev)}
            onToggleInstantFeedback={handleToggleInstantFeedbackInQuiz}
            onChangeIndex={setCurrentIndex}
            onSelectOption={handleSelectOption}
            onFinishQuiz={finalizeAndShowResults}
            onExitToHome={() => handleGoHome('mock-catalog-section')}
          />
        )}

        {viewMode === 'results' && (
          <QuizResults
            examConfig={examConfig}
            questions={activeQuestions}
            answers={answers}
            elapsedSeconds={elapsedSeconds}
            timedOut={timedOut}
            onRetryAll={handleRetryCurrentSet}
            onRetryIncorrect={handleRetryIncorrect}
            onStartNextTest={handleStartNextTest}
            onGoHome={() => handleGoHome('mock-catalog-section')}
          />
        )}
      </main>

      <Footer
        selectedLevel={selectedLevel}
        onGoHome={handleGoHome}
        onStartExam={handleStartExam}
      />
    </div>
  );
}
