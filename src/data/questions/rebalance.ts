import { QuizQuestion } from '../../types/quiz';

/**
 * Questions where `N번` inside `explanationKo` refers to a passage item / counter / frequency
 * rather than a 1-based answer choice index.
 */
const PASSAGE_LITERAL_NUMBER_IDS = new Set<string>([
  'n1-r09', // 1번 ‘萌芽研究枠’ (passage category #1)
  'n1-r10', // 3번 実践実装枠 (passage category #3)
  'n2-l03', // 3번 창구 (3番窓口)
  'n5-t8-r04', // 하루 3번 식후 (3 times a day)
]);

/**
 * All 22 non-monotonic permutations of [0, 1, 2, 3]
 * (excludes ascending [0,1,2,3] and descending [3,2,1,0] staircase patterns).
 */
const NON_STAIRCASE_BLOCKS: ReadonlyArray<readonly [0 | 1 | 2 | 3, 0 | 1 | 2 | 3, 0 | 1 | 2 | 3, 0 | 1 | 2 | 3]> = [
  [0, 1, 3, 2],
  [0, 2, 1, 3],
  [0, 2, 3, 1],
  [0, 3, 1, 2],
  [0, 3, 2, 1],
  [1, 0, 2, 3],
  [1, 0, 3, 2],
  [1, 2, 0, 3],
  [1, 2, 3, 0],
  [1, 3, 0, 2],
  [1, 3, 2, 0],
  [2, 0, 1, 3],
  [2, 0, 3, 1],
  [2, 1, 0, 3],
  [2, 1, 3, 0],
  [2, 3, 0, 1],
  [2, 3, 1, 0],
  [3, 0, 1, 2],
  [3, 0, 2, 1],
  [3, 1, 0, 2],
  [3, 1, 2, 0],
  [3, 2, 0, 1],
];

function createSplitMix32(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;

  return () => {
    state = (state + 0x9e3779b9) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

/**
 * Generates a stratified, natural-looking answer key of length `count` where:
 * - Every 4-question block contains {0, 1, 2, 3} once each -> exact ~25% per choice across full & section scopes.
 * - Never produces ascending/descending 1-2-3-4 staircases or >=3 identical consecutive answers.
 */
function generateBalancedAnswerSchedule(
  count: number,
  nextRand: () => number
): (0 | 1 | 2 | 3)[] {
  const schedule: (0 | 1 | 2 | 3)[] = [];
  let prevBlockIdx = -1;

  while (schedule.length < count) {
    const startIdx = nextRand() % NON_STAIRCASE_BLOCKS.length;
    let chosenIdx = startIdx;

    for (let offset = 0; offset < NON_STAIRCASE_BLOCKS.length; offset++) {
      const candIdx = (startIdx + offset) % NON_STAIRCASE_BLOCKS.length;
      if (candIdx === prevBlockIdx) continue;

      const cand = NON_STAIRCASE_BLOCKS[candIdx];
      const len = schedule.length;
      if (len >= 2) {
        const last1 = schedule[len - 1];
        const last2 = schedule[len - 2];
        // Never allow 3 identical answers in a row across block boundaries
        if (last1 === last2 && cand[0] === last1) continue;
        // Also avoid cand[0] === cand[1] (impossible in permutation) and keep boundary repeats occasional (~25%)
        if (cand[0] === last1 && (nextRand() & 3) !== 0) continue;
      }

      chosenIdx = candIdx;
      break;
    }

    prevBlockIdx = chosenIdx;
    const block = NON_STAIRCASE_BLOCKS[chosenIdx];
    for (let i = 0; i < 4 && schedule.length < count; i++) {
      schedule.push(block[i]);
    }
  }

  return schedule;
}

/**
 * Deterministically permutes options for every question in a test set so that
 * options 1, 2, 3, 4 each appear ~25% of the time while preserving exact option texts,
 * `correctIndex`, and any option-number references inside `explanationKo`.
 */
export function rebalanceTestQuestions(
  questions: QuizQuestion[],
  seedKey: string
): QuizQuestion[] {
  if (questions.length === 0) return questions;

  const nextRand = createSplitMix32(`haru-jlpt-balanced-v2::${seedKey}`);
  const schedule = generateBalancedAnswerSchedule(questions.length, nextRand);

  return questions.map((q, idx) => {
    const targetAns = schedule[idx];
    const oldAns = q.correctIndex;

    const otherOldIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== oldAns) otherOldIndices.push(i);
    }

    // Fisher-Yates shuffle on the 3 distractors
    for (let i = otherOldIndices.length - 1; i > 0; i--) {
      const j = nextRand() % (i + 1);
      const tmp = otherOldIndices[i];
      otherOldIndices[i] = otherOldIndices[j];
      otherOldIndices[j] = tmp;
    }

    const newToOld: [number, number, number, number] = [0, 0, 0, 0];
    let dCursor = 0;
    for (let newIdx = 0; newIdx < 4; newIdx++) {
      if (newIdx === targetAns) {
        newToOld[newIdx] = oldAns;
      } else {
        newToOld[newIdx] = otherOldIndices[dCursor++];
      }
    }

    const oldToNew: [number, number, number, number] = [0, 0, 0, 0];
    for (let newIdx = 0; newIdx < 4; newIdx++) {
      oldToNew[newToOld[newIdx]] = newIdx;
    }

    const newOptions: [string, string, string, string] = [
      q.options[newToOld[0]],
      q.options[newToOld[1]],
      q.options[newToOld[2]],
      q.options[newToOld[3]],
    ];

    let newExp = q.explanationKo;
    if (q.mondaiTitleKo.includes('★')) {
      newExp = newExp.replace(
        /\(([1-4])\)/g,
        (_, digit: string) => `(${oldToNew[Number(digit) - 1] + 1})`
      );
    }
    if (!PASSAGE_LITERAL_NUMBER_IDS.has(q.id)) {
      newExp = newExp.replace(
        /([1-4])번/g,
        (_, digit: string) => `${oldToNew[Number(digit) - 1] + 1}번`
      );
    }

    return {
      ...q,
      options: newOptions,
      correctIndex: targetAns,
      explanationKo: newExp,
    };
  });
}
