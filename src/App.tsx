import { useCallback, useEffect, useState } from 'react';
import { BenchmarkTableSection } from './components/BenchmarkTableSection';
import { CategoryOverviewSection } from './components/CategoryOverviewSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LevelCardsSection } from './components/LevelCardsSection';
import { QuizResults } from './components/QuizResults';
import { QuizWorkspace } from './components/QuizWorkspace';
import { buildExamConfig, getQuestionsByScope } from './data/questions';
import {
  ActiveExamConfig,
  ExamSectionScope,
  JlptLevel,
  QuizQuestion,
  UserAnswerState,
} from './types/quiz';
import { stopJapaneseSpeech } from './utils/speech';

type AppViewMode = 'home' | 'quiz' | 'results';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('home');
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>(JlptLevel.N5);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);

  const [examConfig, setExamConfig] = useState<ActiveExamConfig>(() =>
    buildExamConfig(JlptLevel.N5, 'full', true)
  );
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(() =>
    getQuestionsByScope(JlptLevel.N5, 'full')
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswerState>>({});

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(90 * 60);
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
        return finalized;
      });
      setViewMode('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeQuestions]
  );

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
    config: ActiveExamConfig
  ) => {
    stopJapaneseSpeech();
    const initialAnswers: Record<string, UserAnswerState> = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = { selectedOption: null, isChecked: false };
    });

    setSelectedLevel(config.level);
    setExamConfig(config);
    setActiveQuestions(questions);
    setAnswers(initialAnswers);
    setCurrentIndex(0);
    setRemainingSeconds(config.durationSeconds);
    setIsTimerPaused(false);
    setTimedOut(false);
    setViewMode('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartExam = (level: JlptLevel, scope: ExamSectionScope) => {
    const questions = getQuestionsByScope(level, scope);
    if (questions.length === 0) return;
    const config = buildExamConfig(level, scope, instantFeedback);
    launchQuiz(questions, config);
  };

  const handleGoHome = (sectionId?: string) => {
    stopJapaneseSpeech();
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
      // Reveal already selected answers immediately if switched to Instant Mode
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
    launchQuiz(activeQuestions, {
      ...examConfig,
      instantFeedback,
    });
  };

  const handleRetryIncorrect = (incorrectQuestions: QuizQuestion[]) => {
    if (incorrectQuestions.length === 0) return;
    const retrySeconds = Math.max(300, incorrectQuestions.length * 90);
    launchQuiz(incorrectQuestions, {
      level: examConfig.level,
      scope: examConfig.scope,
      titleKo: `JLPT ${examConfig.level} 오답 집중 복습 (${incorrectQuestions.length}문항)`,
      subtitleKo: `틀린 문항 재풀이 · 제한시간 ${Math.round(retrySeconds / 60)}분`,
      durationSeconds: retrySeconds,
      instantFeedback: true,
    });
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
            onExitToHome={() => handleGoHome('top')}
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
            onGoHome={() => handleGoHome('levels-section')}
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
