import { JlptLevel, QuizCategory, QuizQuestion } from '../../types/quiz';
import { getN1SupplementQuestions } from './n1Supplement';
import { getN2SupplementQuestions } from './n2Supplement';
import { getN3SupplementQuestions } from './n3Supplement';
import { getN4SupplementQuestions } from './n4Supplement';
import { getN5SupplementQuestions } from './n5Supplement';

const MONDAI_ORDER: Record<string, number> = {
  '문자·어휘 · 한자 읽기': 10,
  '문자·어휘 · 한자 표기': 11,
  '문자·어휘 · 어형성': 12,
  '문자·어휘 · 문맥 규정': 13,
  '문자·어휘 · 유의 표현': 14,
  '문자·어휘 · 어휘 용법': 15,
  '문법 · 문법 형식 판단': 20,
  '문법 · ★ 문장 만들기': 21,
  '문법 · 글의 문법': 22,
  '독해 · 단문 이해': 30,
  '독해 · 중문 이해': 31,
  '독해 · 논설·통합 이해': 32,
  '독해 · 정보 검색': 33,
  '청해 · 問題1 과제 이해': 40,
  '청해 · 問題2 포인트 이해': 41,
  '청해 · 問題3 개요·발화 이해': 42,
  '청해 · 問題4 즉시 응답': 43,
  '청해 · 問題5 통합 이해': 44,
};

const CATEGORY_FALLBACK_ORDER: Record<QuizCategory, number> = {
  [QuizCategory.Vocabulary]: 19,
  [QuizCategory.Grammar]: 29,
  [QuizCategory.Reading]: 39,
  [QuizCategory.Listening]: 49,
};

function sortByOfficialMondaiOrder(questions: QuizQuestion[]): QuizQuestion[] {
  return questions
    .map((q, index) => ({
      q,
      index,
      rank:
        MONDAI_ORDER[q.mondaiTitleKo] ??
        CATEGORY_FALLBACK_ORDER[q.category] ??
        99,
    }))
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index))
    .map((item) => item.q);
}

/**
 * Assembles the exact official JLPT question counts for every test (1..10) across N1..N5:
 * - N1: 25 Vocab + 10 Grammar + 26 Reading + 37 Listening = 98
 * - N2: 25 Vocab + 12 Grammar + 21 Reading + 32 Listening = 90
 * - N3: 35 Vocab + 22 Grammar + 16 Reading + 28 Listening = 101
 * - N4: 34 Vocab + 25 Grammar + 10 Reading + 28 Listening = 97
 * - N5: 33 Vocab + 26 Grammar +  6 Reading + 24 Listening = 89
 */
export function assembleOfficialTestQuestions(
  level: JlptLevel,
  testNumber: number,
  baseQuestions: QuizQuestion[]
): QuizQuestion[] {
  let trimmedBase = baseQuestions;
  let supplement: QuizQuestion[] = [];

  switch (level) {
    case JlptLevel.N5: {
      // Base N5 has [25, 16, 8, 24]. Trim 2 standalone short-reading items (keep 2 단문 + 2 중문 + 2 정보검색 = 6)
      // and merge +8 Vocab + 10 Grammar => exact [33, 26, 6, 24] = 89.
      let shortReadingKept = 0;
      trimmedBase = baseQuestions.filter((q) => {
        if (
          q.category === QuizCategory.Reading &&
          q.mondaiTitleKo === '독해 · 단문 이해'
        ) {
          if (shortReadingKept >= 2) {
            return false;
          }
          shortReadingKept += 1;
        }
        return true;
      });
      supplement = getN5SupplementQuestions(testNumber);
      break;
    }

    case JlptLevel.N4: {
      // Base N4 has [30, 17, 10, 25] + supplement [+4, +8, +0, +3] => exact [34, 25, 10, 28] = 97.
      supplement = getN4SupplementQuestions(testNumber);
      break;
    }

    case JlptLevel.N3: {
      // Base N3 has [35, 18, 11, 26] + supplement [+0, +4, +5, +2] => exact [35, 22, 16, 28] = 101.
      supplement = getN3SupplementQuestions(testNumber);
      break;
    }

    case JlptLevel.N2: {
      // Base N2 has [15, 10, 10, 37]. Trim Listening 37 -> 32
      // (問題1: 7->5, 問題2: 8->6, 問題3: 6->5, 問題4: 12, 問題5: 4 => 32)
      // and merge [+10, +2, +11, +0] => exact [25, 12, 21, 32] = 90.
      const listeningCaps: Record<string, number> = {
        '청해 · 問題1 과제 이해': 5,
        '청해 · 問題2 포인트 이해': 6,
        '청해 · 問題3 개요·발화 이해': 5,
      };
      const seenListeningByMondai: Record<string, number> = {};
      trimmedBase = baseQuestions.filter((q) => {
        if (q.category === QuizCategory.Listening) {
          const cap = listeningCaps[q.mondaiTitleKo];
          if (cap !== undefined) {
            const count = seenListeningByMondai[q.mondaiTitleKo] ?? 0;
            if (count >= cap) {
              return false;
            }
            seenListeningByMondai[q.mondaiTitleKo] = count + 1;
          }
        }
        return true;
      });
      supplement = getN2SupplementQuestions(testNumber);
      break;
    }

    case JlptLevel.N1: {
      // Base N1 has [14, 10, 10, 37] + supplement [+11, +0, +16, +0] => exact [25, 10, 26, 37] = 98.
      supplement = getN1SupplementQuestions(testNumber);
      break;
    }
  }

  return sortByOfficialMondaiOrder([...trimmedBase, ...supplement]);
}
