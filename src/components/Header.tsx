import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ExamSectionScope, JlptLevel } from '../types/quiz';

interface HeaderProps {
  currentMode: 'home' | 'quiz' | 'results';
  selectedLevel: JlptLevel;
  onGoHome: (sectionId?: string) => void;
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
}

export function Header({
  currentMode,
  selectedLevel,
  onGoHome,
  onStartExam,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onGoHome(sectionId);
  };

  const handleStartClick = () => {
    setMobileMenuOpen(false);
    onStartExam(selectedLevel, 'full');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('top')}
          className="text-lg font-bold tracking-tight text-indigo-950 hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700 cursor-pointer"
        >
          하루 JLPT
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => handleNavClick('levels-section')}
            className="hover:text-indigo-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            급수 선택
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('practice-hub-section')}
            className="hover:text-indigo-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            교시·영역 연습
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('benchmarks-section')}
            className="hover:text-indigo-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            시험시간 기준
          </button>
          <button
            type="button"
            onClick={handleStartClick}
            className={`hover:text-indigo-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentMode === 'quiz' ? 'text-indigo-800 font-semibold' : ''
            }`}
          >
            실전 모의고사
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA (+ mobile menu toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleStartClick}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800 tabular-nums cursor-pointer"
          >
            {selectedLevel} 실전 시작
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => handleNavClick('levels-section')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-900 rounded-lg cursor-pointer"
          >
            급수 선택 (N1 ~ N5)
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('practice-hub-section')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-900 rounded-lg cursor-pointer"
          >
            교시·영역 연습 (문자·어휘 / 문법 / 독해 / 청해)
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('benchmarks-section')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-900 rounded-lg cursor-pointer"
          >
            JLPT 공식 시험시간 및 배점표
          </button>
          <button
            type="button"
            onClick={handleStartClick}
            className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer"
          >
            {selectedLevel} 전 교시 실전 모의고사 시작
          </button>
        </div>
      )}
    </header>
  );
}
