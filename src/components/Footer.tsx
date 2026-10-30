import { ExamSectionScope, JlptLevel } from '../types/quiz';

interface FooterProps {
  selectedLevel: JlptLevel;
  onGoHome: (sectionId?: string) => void;
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
}

export function Footer({ selectedLevel, onGoHome, onStartExam }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-base font-bold tracking-tight text-indigo-950">
            하루 JLPT
          </p>
          <p className="mt-1 text-xs text-slate-500">
            한국어 학습자를 위한 JLPT N1~N5 언어지식(문자·어휘·문법) · 독해 · 청해 실전 모의고사 웹 애플리케이션
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onGoHome('levels-section')}
            className="hover:text-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            급수 선택 (N1~N5)
          </button>
          <button
            type="button"
            onClick={() => onGoHome('practice-hub-section')}
            className="hover:text-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            교시·영역 연습
          </button>
          <button
            type="button"
            onClick={() => onGoHome('benchmarks-section')}
            className="hover:text-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            시험시간 기준표
          </button>
          <button
            type="button"
            onClick={() => onStartExam(selectedLevel, 'full')}
            className="text-indigo-800 hover:text-indigo-950 font-semibold transition-colors whitespace-nowrap tabular-nums cursor-pointer"
          >
            {selectedLevel} 실전 모의고사
          </button>
        </div>
      </div>
    </footer>
  );
}
