import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useState } from 'react';
import heroStudyImage from '../assets/images/hero_japanese_study_desk_1793286778945.jpg';
import { getLevelInfo, LEVEL_ORDER_N1_TO_N5 } from '../data/levels';
import {
  getQuestionsByScope,
  TOTAL_QUESTION_BANK_COUNT,
} from '../data/questions';
import { ExamSectionScope, JlptLevel } from '../types/quiz';

interface HeroSectionProps {
  selectedLevel: JlptLevel;
  onSelectLevel: (level: JlptLevel) => void;
  onStartExam: (level: JlptLevel, scope: ExamSectionScope) => void;
  onScrollToSection: (sectionId: string) => void;
}

export function HeroSection({
  selectedLevel,
  onSelectLevel,
  onStartExam,
  onScrollToSection,
}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const activeLevelInfo = getLevelInfo(selectedLevel);
  const activeQuestionCount = getQuestionsByScope(selectedLevel, 'full').length;
  const periodInlineText = activeLevelInfo.periods
    .map((p) => `${p.periodLabelKo} ${p.titleKo}(${p.minutes}분)`)
    .join(' · ');

  return (
    <section id="top" className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-18">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-indigo-800 mb-3 tabular-nums">
                JLPT N1~N5 급수별 10회분(총 50회) 실전 모의고사 · 총{' '}
                {TOTAL_QUESTION_BANK_COUNT.toLocaleString()}문항 완비
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 leading-[1.22] text-balance">
                실제 시험 시간·문항 수 그대로 푸는
                <br className="hidden sm:inline" /> JLPT 1급~5급 실전 모의고사
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                N1(170분·71문항)부터 N5(90분·73문항)까지 실제 교시별 제한시간과 문항 구성을 완벽히 구현했습니다. 일본어 음성 청해와 180점 만점 합격·과락 판정, 한국어 상세 해설을 바로 경험하세요.
              </p>

              {/* Quick Level Selector Bar (N1 ~ N5) */}
              <div className="mt-6">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  응시할 급수를 선택하세요 (1급 ~ 5급)
                </p>
                <div
                  role="tablist"
                  aria-label="JLPT 급수 빠른 선택"
                  className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg"
                >
                  {LEVEL_ORDER_N1_TO_N5.map((lvl) => {
                    const isSelected = selectedLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        role="tab"
                        type="button"
                        aria-selected={isSelected}
                        onClick={() => onSelectLevel(lvl)}
                        className={`px-4 py-2 text-sm rounded-md transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-800 text-white font-bold shadow-xs'
                            : 'text-slate-700 font-medium hover:text-indigo-950 hover:bg-white/70'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 space-y-1 text-xs sm:text-sm text-slate-600">
                  <p className="flex flex-wrap items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                    <span>
                      <strong className="text-slate-900">
                        JLPT {selectedLevel}
                      </strong>{' '}
                      · 총 {activeLevelInfo.totalMinutes}분 · 총{' '}
                      {activeQuestionCount}문항 · 합격 기준{' '}
                      {activeLevelInfo.passingScore}/180점
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {periodInlineText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onScrollToSection('mock-catalog-section')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
              >
                <span>{selectedLevel} 모의고사 1~10회 목록 보기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onStartExam(selectedLevel, 'full')}
                className="inline-flex items-center justify-center px-5 py-3.5 text-sm sm:text-base font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
              >
                {selectedLevel} 테스트 1 바로 시작 ({activeLevelInfo.totalMinutes}분)
              </button>
            </div>
          </div>

          {/* Right Column: Serene Editorial Japanese Study Space */}
          <div className="lg:col-span-5 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative min-h-[240px] sm:min-h-[300px]">
              {!imgFailed ? (
                <img
                  src={heroStudyImage}
                  alt="햇살이 비치는 일본식 창가 나무 책상 위에 놓인 일본어 학습 노트와 만년필, 찻잔"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-white to-slate-100 text-center">
                  <BookOpen className="w-10 h-10 text-indigo-800 mb-3" />
                  <p className="font-jp text-lg font-medium text-slate-900">
                    日本語能力試験 N1〜N5 実戦模擬試験
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    언어지식 · 독해 · 청해 전 영역 완비
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Key Study Metrics Strip */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              급수당 10회
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              N1~N5 총 50회분 모의고사 수록
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-800 tabular-nums">
              {TOTAL_QUESTION_BANK_COUNT.toLocaleString()}문항
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              문자·어휘 · 문법 · 독해 · 청해 완비
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              90~170분
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              1~3교시 공식 시험시간 타이머 적용
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              180점 만점
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              급수별 합격점 및 영역별 과락 판정
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
