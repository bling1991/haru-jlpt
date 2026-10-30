import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Gauge,
  LayoutGrid,
  Play,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { getLevelInfo } from '../data/levels';
import {
  CATEGORY_LABELS_KO,
  getQuestionCountsByCategory,
  getQuestionsByScope,
  getScopeMetaForCatalog,
  MOCK_TEST_NUMBERS,
} from '../data/questions';
import {
  CatalogCategoryMode,
  ExamSectionScope,
  JlptLevel,
  MockTestProgressEntry,
  QuizCategory,
} from '../types/quiz';
import { makeProgressKey } from '../utils/progressStorage';

type SortOption = 'default' | 'untaken_first' | 'progress_desc';

interface MockTestCatalogSectionProps {
  selectedLevel: JlptLevel;
  instantFeedback: boolean;
  progressMap: Record<string, MockTestProgressEntry>;
  onSelectLevel: (level: JlptLevel) => void;
  onToggleInstantFeedback: (instant: boolean) => void;
  onStartExam: (
    level: JlptLevel,
    scope: ExamSectionScope,
    testNumber?: number,
    resumeSaved?: boolean
  ) => void;
}

const SIDEBAR_LEVELS_N5_TO_N1: JlptLevel[] = [
  JlptLevel.N5,
  JlptLevel.N4,
  JlptLevel.N3,
  JlptLevel.N2,
  JlptLevel.N1,
];

export function MockTestCatalogSection({
  selectedLevel,
  instantFeedback,
  progressMap,
  onSelectLevel,
  onToggleInstantFeedback,
  onStartExam,
}: MockTestCatalogSectionProps) {
  const [categoryMode, setCategoryMode] = useState<CatalogCategoryMode>('full');
  const [sectionScope, setSectionScope] = useState<ExamSectionScope>(
    QuizCategory.Vocabulary
  );
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTestNum, setExpandedTestNum] = useState<number | null>(null);
  const [levelPanelOpen, setLevelPanelOpen] = useState<boolean>(true);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState<boolean>(true);

  const levelInfo = getLevelInfo(selectedLevel);

  const activeScope: ExamSectionScope =
    categoryMode === 'full'
      ? 'full'
      : categoryMode === 'mini'
      ? 'mini'
      : sectionScope;

  // Ensure sectionScope remains valid if user switches between N1/N2 (no period_3) and N3~N5
  const resolvedScope: ExamSectionScope = useMemo(() => {
    if (
      activeScope === 'period_3' &&
      !levelInfo.periods.some((p) => p.scope === 'period_3')
    ) {
      return 'period_2';
    }
    return activeScope;
  }, [activeScope, levelInfo.periods]);

  const scopeMeta = getScopeMetaForCatalog(selectedLevel, resolvedScope);
  const categoryCounts = getQuestionCountsByCategory(selectedLevel, 1);

  const enrichedTests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = MOCK_TEST_NUMBERS.map((num) => {
      const key = makeProgressKey(selectedLevel, num, resolvedScope);
      const entry = progressMap[key];
      const total = scopeMeta.questionCount;
      const answered = entry
        ? Math.min(total, Math.max(0, entry.answeredCount))
        : 0;
      const progressPct = entry?.completed
        ? 100
        : total > 0
        ? Math.round((answered / total) * 100)
        : 0;
      const hasResume = Boolean(
        !entry?.completed &&
          entry?.savedAnswers &&
          answered > 0 &&
          answered < total
      );

      return {
        testNumber: num,
        title: `테스트 ${num}`,
        entry,
        progressPct,
        hasResume,
        completed: Boolean(entry?.completed),
        passed: entry?.passed ?? null,
        bestScore: entry?.bestScaledScore ?? null,
      };
    }).filter((item) => {
      if (!query) return true;
      const matchLabel =
        item.title.toLowerCase().includes(query) ||
        `test ${item.testNumber}`.includes(query) ||
        `${selectedLevel.toLowerCase()} ${item.testNumber}`.includes(query) ||
        String(item.testNumber) === query;
      return matchLabel;
    });

    if (sortBy === 'untaken_first') {
      return [...list].sort((a, b) => {
        if (a.progressPct === b.progressPct) return a.testNumber - b.testNumber;
        return a.progressPct - b.progressPct;
      });
    }

    if (sortBy === 'progress_desc') {
      return [...list].sort((a, b) => {
        const scoreA = a.bestScore ?? -1;
        const scoreB = b.bestScore ?? -1;
        if (b.progressPct !== a.progressPct) {
          return b.progressPct - a.progressPct;
        }
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.testNumber - b.testNumber;
      });
    }

    return list;
  }, [progressMap, resolvedScope, scopeMeta.questionCount, searchQuery, selectedLevel, sortBy]);

  return (
    <section
      id="mock-catalog-section"
      className="bg-slate-50/80 border-b border-slate-200 py-10 sm:py-14"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb Bar (modeled after Migii JLPT Mock Exam header) */}
        <div className="pb-4 mb-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
            <span>JLPT {selectedLevel} 모의고사</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm font-medium text-indigo-800">
              {scopeMeta.modeLabelKo} (전 10회 수록)
            </span>
          </div>

          <p className="text-xs text-slate-500 tabular-nums">
            급수별 10회분 모두 무료 개방 · 회차마다 서로 다른 신출 문항 구성
          </p>
        </div>

        {/* Discovery Count + Sort + Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center mb-6">
          <div className="lg:col-span-9 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 tabular-nums">
              <LayoutGrid className="w-4 h-4 text-indigo-800 shrink-0" />
              <span>
                {enrichedTests.length}개의 테스트가 발견되었습니다.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <label htmlFor="mock-sort-select" className="sr-only">
                테스트 정렬 기준
              </label>
              <div className="relative">
                <select
                  id="mock-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-indigo-200 hover:border-indigo-400 text-slate-800 text-xs sm:text-sm font-medium rounded-lg pl-3.5 pr-9 py-2.5 focus:outline-2 focus:outline-indigo-800 transition-colors cursor-pointer"
                >
                  <option value="default">기본 정렬 (테스트 1~10)</option>
                  <option value="untaken_first">미응시 테스트 우선</option>
                  <option value="progress_desc">진전·최고점 높은 순</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="mock-search-input" className="sr-only">
              테스트 검색
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="mock-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색 테스트 (예: 테스트 3)"
                className="w-full bg-white border border-slate-200 focus:border-indigo-700 rounded-lg pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Main 12-Column Layout: 9-Col 3x4 Test Cards Grid + 3-Col Right Filter Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 9 Columns: 10 Mock Test Cards */}
          <div className="lg:col-span-9">
            {enrichedTests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  검색어와 일치하는 모의고사가 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  전체 10개 테스트 보기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {enrichedTests.map((item) => {
                  const isExpanded = expandedTestNum === item.testNumber;

                  return (
                    <article
                      key={`${selectedLevel}-${resolvedScope}-${item.testNumber}`}
                      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 transition-all duration-150 flex flex-col justify-between p-5"
                    >
                      <div>
                        {/* Card Title + Dual-coded Status */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <h3 className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                            {item.title}
                          </h3>

                          {item.completed ? (
                            item.passed === true ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 tabular-nums">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>
                                  합격
                                  {item.bestScore !== null
                                    ? ` · ${item.bestScore}점`
                                    : ''}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-800 tabular-nums">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                <span>
                                  완료
                                  {item.bestScore !== null
                                    ? ` · ${item.bestScore}점`
                                    : ''}
                                </span>
                              </span>
                            )
                          ) : item.progressPct > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 tabular-nums">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>진행 중</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              {selectedLevel} · 제{item.testNumber}회
                            </span>
                          )}
                        </div>

                        {/* 3 Key Metrics Rows matching Screenshot */}
                        <dl className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600">
                              <Award className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>통과 지점:</span>
                            </dt>
                            <dd className="font-bold text-slate-900 tabular-nums">
                              {scopeMeta.passingPoints}점
                            </dd>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>시간:</span>
                            </dt>
                            <dd className="font-bold text-slate-900 tabular-nums">
                              {scopeMeta.minutes}분{' '}
                              <span className="text-xs font-medium text-slate-500">
                                ({scopeMeta.questionCount}문항)
                              </span>
                            </dd>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-2 text-slate-600">
                              <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>진전:</span>
                            </dt>
                            <dd
                              className={`font-bold tabular-nums ${
                                item.progressPct === 100
                                  ? 'text-emerald-700'
                                  : item.progressPct > 0
                                  ? 'text-indigo-800'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.progressPct}%
                            </dd>
                          </div>
                        </dl>

                        {item.progressPct > 0 && (
                          <progress
                            value={item.progressPct}
                            max={100}
                            aria-label={`${item.title} 진행률 ${item.progressPct}%`}
                            className="mt-3 w-full h-1.5 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-800 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-800"
                          />
                        )}
                      </div>

                      {/* Card Footer: '> 세부 사항' + Quick Start CTA */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTestNum((prev) =>
                                prev === item.testNumber
                                  ? null
                                  : item.testNumber
                              )
                            }
                            aria-expanded={isExpanded}
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-indigo-800 hover:text-indigo-950 transition-colors cursor-pointer"
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <span>세부 사항</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onStartExam(
                                selectedLevel,
                                resolvedScope,
                                item.testNumber,
                                item.hasResume
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {item.hasResume
                                ? '이어 풀기'
                                : item.completed
                                ? '다시 응시'
                                : '시험 시작'}
                            </span>
                          </button>
                        </div>

                        {/* Expandable Details Drawer */}
                        {isExpanded && (
                          <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3 text-xs">
                            <p className="text-slate-600 tabular-nums leading-relaxed">
                              문자·어휘 {categoryCounts[QuizCategory.Vocabulary]} · 문법{' '}
                              {categoryCounts[QuizCategory.Grammar]} · 독해{' '}
                              {categoryCounts[QuizCategory.Reading]} · 청해{' '}
                              {categoryCounts[QuizCategory.Listening]}문항
                            </p>

                            <div className="space-y-1.5">
                              <p className="font-semibold text-slate-700">
                                테스트 {item.testNumber} 교시별 바로 응시
                              </p>
                              {levelInfo.periods.map((period) => {
                                const pCount = getQuestionsByScope(
                                  selectedLevel,
                                  period.scope,
                                  item.testNumber
                                ).length;
                                return (
                                  <button
                                    key={period.scope}
                                    type="button"
                                    onClick={() =>
                                      onStartExam(
                                        selectedLevel,
                                        period.scope,
                                        item.testNumber,
                                        false
                                      )
                                    }
                                    className="w-full px-2.5 py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                                  >
                                    <span className="font-medium text-slate-800 truncate">
                                      <strong className="text-indigo-900 mr-1">
                                        {period.periodLabelKo}
                                      </strong>
                                      {period.titleKo}
                                    </span>
                                    <span className="text-slate-600 whitespace-nowrap shrink-0 tabular-nums">
                                      {period.minutes}분 · {pCount}문항
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {item.hasResume && (
                              <button
                                type="button"
                                onClick={() =>
                                  onStartExam(
                                    selectedLevel,
                                    resolvedScope,
                                    item.testNumber,
                                    false
                                  )
                                }
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>처음부터 새로 풀기</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 3 Columns: Level & Category Radio Sidebar Cards */}
          <aside className="lg:col-span-3 space-y-5">
            {/* Level Selector Card (N5 ~ N1 matching screenshot) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setLevelPanelOpen((prev) => !prev)}
                aria-expanded={levelPanelOpen}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-base font-bold text-slate-900">레벨</span>
                {levelPanelOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {levelPanelOpen && (
                <div
                  role="radiogroup"
                  aria-label="JLPT 레벨 선택"
                  className="mt-4 space-y-2.5"
                >
                  {SIDEBAR_LEVELS_N5_TO_N1.map((lvl) => {
                    const checked = selectedLevel === lvl;
                    const info = getLevelInfo(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => {
                          onSelectLevel(lvl);
                          setExpandedTestNum(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          checked
                            ? 'bg-indigo-50/80 text-indigo-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <span className="inline-flex items-center gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                              checked
                                ? 'border-indigo-800 bg-indigo-800'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm tabular-nums">{lvl}</span>
                        </span>

                        <span className="text-xs text-slate-500 tabular-nums">
                          10회 · {info.totalMinutes}분
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Selector Card (전체 테스트 / 미니 테스트 / 실력 테스트) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setCategoryPanelOpen((prev) => !prev)}
                aria-expanded={categoryPanelOpen}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-base font-bold text-slate-900">
                  카테고리
                </span>
                {categoryPanelOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {categoryPanelOpen && (
                <div className="mt-4 space-y-2.5">
                  <div role="radiogroup" aria-label="테스트 카테고리 선택" className="space-y-2">
                    {(
                      [
                        {
                          mode: 'full' as CatalogCategoryMode,
                          label: '전체 테스트',
                          sub: `${levelInfo.totalMinutes}분 · ${levelInfo.totalQuestions}문항`,
                        },
                        {
                          mode: 'mini' as CatalogCategoryMode,
                          label: '미니 테스트',
                          sub: '30분 · 핵심 20문항',
                        },
                        {
                          mode: 'section' as CatalogCategoryMode,
                          label: '실력 테스트',
                          sub: '교시·영역별 선택',
                        },
                      ] as const
                    ).map((opt) => {
                      const checked = categoryMode === opt.mode;
                      return (
                        <button
                          key={opt.mode}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() => setCategoryMode(opt.mode)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                            checked
                              ? 'bg-indigo-50/80 text-indigo-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                checked
                                  ? 'border-indigo-800 bg-indigo-800'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {checked && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="text-sm">{opt.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-scope selector when 실력 테스트 is active */}
                  {categoryMode === 'section' && (
                    <div className="pt-3 mt-2 border-t border-slate-100 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">
                        응시할 교시·영역 선택
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            QuizCategory.Vocabulary,
                            QuizCategory.Grammar,
                            QuizCategory.Reading,
                            QuizCategory.Listening,
                          ] as const
                        ).map((cat) => {
                          const active = resolvedScope === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSectionScope(cat)}
                              className={`px-2.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-indigo-800 text-white border-indigo-800'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {CATEGORY_LABELS_KO[cat]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="space-y-1 pt-1">
                        {levelInfo.periods.map((p) => {
                          const active = resolvedScope === p.scope;
                          return (
                            <button
                              key={p.scope}
                              type="button"
                              onClick={() => setSectionScope(p.scope)}
                              className={`w-full px-2.5 py-1.5 rounded-md text-xs font-medium border text-left flex items-center justify-between transition-colors cursor-pointer ${
                                active
                                  ? 'bg-indigo-800 text-white border-indigo-800'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <span>
                                {p.periodLabelKo} · {p.titleKo}
                              </span>
                              <span className="tabular-nums">{p.minutes}분</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grading Mode Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-900 mb-2.5">
                채점 및 정답 표시 방식
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onToggleInstantFeedback(true)}
                  className={`py-2 px-2 text-xs rounded-md transition-colors cursor-pointer ${
                    instantFeedback
                      ? 'bg-indigo-800 text-white font-semibold'
                      : 'text-slate-700 font-medium hover:text-slate-900'
                  }`}
                >
                  클릭 즉시 확인
                </button>
                <button
                  type="button"
                  onClick={() => onToggleInstantFeedback(false)}
                  className={`py-2 px-2 text-xs rounded-md transition-colors cursor-pointer ${
                    !instantFeedback
                      ? 'bg-indigo-800 text-white font-semibold'
                      : 'text-slate-700 font-medium hover:text-slate-900'
                  }`}
                >
                  제출 후 채점
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                {instantFeedback
                  ? '문항 보기를 클릭하면 즉시 정오답과 한국어 해설을 확인하고 다음 문항으로 넘어갑니다.'
                  : '실제 시험장처럼 종료 후 일괄 채점하며 180점 만점 성적표를 확인합니다.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
