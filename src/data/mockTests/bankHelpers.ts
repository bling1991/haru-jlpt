import { JlptLevel, QuizQuestion } from '../../types/quiz';
import {
  buildListeningQuestions,
  buildWrittenQuestions,
  CompactListeningTuple,
  CompactWrittenTuple,
} from '../questions/builder';

/**
 * Deterministic 32-bit FNV-1a hash for balanced option placement (0..3) without runtime randomness.
 */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function placeOptionsDeterministically(
  seed: string,
  correct: string,
  wrongs: [string, string, string]
): { options: [string, string, string, string]; ans: 0 | 1 | 2 | 3 } {
  const h = hashSeed(seed);
  const targetIdx = (h % 4) as 0 | 1 | 2 | 3;

  // Deterministic permutation of the 3 wrong options
  const w = [...wrongs];
  if ((h >> 3) & 1) {
    [w[0], w[1]] = [w[1], w[0]];
  }
  if ((h >> 5) & 1) {
    [w[1], w[2]] = [w[2], w[1]];
  }

  const out: string[] = [];
  let wCursor = 0;
  for (let i = 0; i < 4; i++) {
    if (i === targetIdx) {
      out.push(correct);
    } else {
      out.push(w[wCursor++]);
    }
  }

  return {
    options: out as [string, string, string, string],
    ans: targetIdx,
  };
}

// Compact row types for high-density authentic JLPT test banks
// [kanjiWord, correctKana, [wrongKana1, wrongKana2, wrongKana3], promptWithBrackets, fullReading, koTranslation, customExp?]
export type VReadRow = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string?,
];

// [kanaInPrompt, correctKanji, [wrongKanji1, wrongKanji2, wrongKanji3], promptWithBrackets, fullReading, koTranslation, customExp?]
export type VOrthoRow = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string?,
];

// [correctAffix, [wrong1, wrong2, wrong3], promptWithBlank, fullReading, koTranslation, expKo]
export type VFormRow = [
  string,
  [string, string, string],
  string,
  string,
  string,
  string,
];

// [correctWord, posGroup, promptWithBlank, fullReading, koTranslation, meaningKo]
export type VCtxRow = [string, string, string, string, string, string];

// [underlinedWord, correctSyn, [wrong1, wrong2, wrong3], promptWithBrackets, fullReading, koTranslation, expKo]
export type VSynRow = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string,
];

// [wordHeaderPrompt, correctSentence, [wrongSent1, wrongSent2, wrongSent3], fullReading, koTranslation, expKo]
export type VUseRow = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
];

// [promptWithBlank, correctOpt, [wrong1, wrong2, wrong3], fullReading, koTranslation, expKo]
export type GSentRow = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
];

// [promptWithStar, [opt1, opt2, opt3, opt4], ansIdx, fullReading, koTranslation, expKo]
export type GStarRow = [
  string,
  [string, string, string, string],
  0 | 1 | 2 | 3,
  string,
  string,
  string,
];

export interface GTextBlock {
  passage: string;
  blanks: [
    string, // prompt
    string, // correctOpt
    [string, string, string], // wrongs
    string, // reading
    string, // ko
    string, // exp
  ][];
}

export interface ReadingPassageBlock {
  code: 'R_SHORT' | 'R_MID' | 'R_LONG' | 'R_INFO';
  passage: string;
  questions: [
    string, // prompt
    string, // correctOpt
    [string, string, string], // wrongs
    string, // reading
    string, // ko
    string, // exp
  ][];
}

export type ListeningRow = [
  'L_TASK' | 'L_POINT' | 'L_GIST' | 'L_RESP' | 'L_INT',
  string, // situationKo
  string, // scriptJp
  string, // questionJp
  string, // correctOpt
  [string, string, string], // wrongs
  string, // ko
  string, // exp
];

export interface SingleMockTestSpec {
  testNumber: number; // 2..10
  vRead: VReadRow[];
  vOrtho?: VOrthoRow[];
  vForm?: VFormRow[];
  vCtx: VCtxRow[];
  vSyn: VSynRow[];
  vUse?: VUseRow[];
  gSent: GSentRow[];
  gStar: GStarRow[];
  gText: GTextBlock[];
  reading: ReadingPassageBlock[];
  listening: ListeningRow[];
}

/**
 * Compiles a SingleMockTestSpec into a full QuizQuestion[] array,
 * pairing V_CTX items with same-POS distractors from the level's global VCtx pool.
 */
export function compileMockTestSpec(
  level: JlptLevel,
  spec: SingleMockTestSpec,
  allLevelVCtxPool: VCtxRow[]
): QuizQuestion[] {
  const prefix = `${level.toLowerCase()}-t${spec.testNumber}`;
  const written: CompactWrittenTuple[] = [];
  let vIdx = 1;

  // 1. V_READ
  for (const row of spec.vRead) {
    const [kanji, kana, wrongs, prompt, reading, ko, customExp] = row;
    const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(id, kana, wrongs);
    written.push({
      id,
      code: 'V_READ',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp:
        customExp ??
        `「${kanji}」의 올바른 읽기는 「${kana}」입니다. 장단음·탁음·촉음 차이에 주의하세요.`,
      vocab: [[kanji, kana, ko]],
    });
  }

  // 2. V_ORTHO
  if (spec.vOrtho) {
    for (const row of spec.vOrtho) {
      const [kana, kanji, wrongs, prompt, reading, ko, customExp] = row;
      const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(id, kanji, wrongs);
      written.push({
        id,
        code: 'V_ORTHO',
        prompt,
        options,
        ans,
        reading,
        ko,
        exp:
          customExp ??
          `「${kana}」는 한자로 「${kanji}」라고 표기합니다. 모양이나 음이 비슷한 다른 한자와 구별하세요.`,
        vocab: [[kanji, kana, ko]],
      });
    }
  }

  // 3. V_FORM
  if (spec.vForm) {
    for (const row of spec.vForm) {
      const [correct, wrongs, prompt, reading, ko, exp] = row;
      const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(id, correct, wrongs);
      written.push({
        id,
        code: 'V_FORM',
        prompt,
        options,
        ans,
        reading,
        ko,
        exp,
      });
    }
  }

  // 4. V_CTX (pair with 3 distinct words from the same posGroup in allLevelVCtxPool)
  for (const row of spec.vCtx) {
    const [correctWord, posGroup, prompt, reading, ko, meaningKo] = row;
    const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
    const candidates = allLevelVCtxPool.filter(
      (c) => c[1] === posGroup && c[0] !== correctWord
    );
    const fallbackCandidates = allLevelVCtxPool.filter(
      (c) => c[0] !== correctWord
    );
    const pool = candidates.length >= 3 ? candidates : fallbackCandidates;

    const h = hashSeed(id);
    const picked: VCtxRow[] = [];
    const step = (h % 7) + 3;
    let cursor = h % pool.length;
    let guard = 0;
    while (picked.length < 3 && guard < pool.length * 2) {
      const item = pool[cursor % pool.length];
      if (!picked.some((p) => p[0] === item[0]) && item[0] !== correctWord) {
        picked.push(item);
      }
      cursor += step;
      guard++;
    }

    const wrongWords: [string, string, string] = [
      picked[0]?.[0] ?? 'ほか',
      picked[1]?.[0] ?? 'べつ',
      picked[2]?.[0] ?? 'つぎ',
    ];
    const { options, ans } = placeOptionsDeterministically(
      id,
      correctWord,
      wrongWords
    );
    const distractorNotes = picked
      .map((p) => `「${p[0]}」(${p[5]})`)
      .join(', ');

    written.push({
      id,
      code: 'V_CTX',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp: `문맥상 ‘${meaningKo}’을(를) 뜻하는 「${correctWord}」이(가) 가장 자연스럽습니다. 참고 어휘: ${distractorNotes}.`,
      vocab: [
        [correctWord, '', meaningKo],
        ...picked.map((p): [string, string, string] => [p[0], '', p[5]]),
      ],
    });
  }

  // 5. V_SYN
  for (const row of spec.vSyn) {
    const [underlined, correctSyn, wrongs, prompt, reading, ko, exp] = row;
    const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(
      id,
      correctSyn,
      wrongs
    );
    written.push({
      id,
      code: 'V_SYN',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp: `${exp} (「${underlined}」 ≒ 「${correctSyn}」)`,
    });
  }

  // 6. V_USE
  if (spec.vUse) {
    for (const row of spec.vUse) {
      const [header, correctSent, wrongSents, reading, ko, exp] = row;
      const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(
        id,
        correctSent,
        wrongSents
      );
      written.push({
        id,
        code: 'V_USE',
        prompt: header,
        options,
        ans,
        reading,
        ko,
        exp,
      });
    }
  }

  // 7. Grammar: G_SENT, G_STAR, G_TEXT
  let gIdx = 1;
  for (const row of spec.gSent) {
    const [prompt, correctOpt, wrongs, reading, ko, exp] = row;
    const id = `${prefix}-g${String(gIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(
      id,
      correctOpt,
      wrongs
    );
    written.push({
      id,
      code: 'G_SENT',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp,
    });
  }

  for (const row of spec.gStar) {
    const [prompt, options, ans, reading, ko, exp] = row;
    const id = `${prefix}-g${String(gIdx++).padStart(2, '0')}`;
    written.push({
      id,
      code: 'G_STAR',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp,
    });
  }

  for (const block of spec.gText) {
    for (const blank of block.blanks) {
      const [prompt, correctOpt, wrongs, reading, ko, exp] = blank;
      const id = `${prefix}-g${String(gIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(
        id,
        correctOpt,
        wrongs
      );
      written.push({
        id,
        code: 'G_TEXT',
        passage: block.passage,
        prompt,
        options,
        ans,
        reading,
        ko,
        exp,
      });
    }
  }

  // 8. Reading: R_SHORT, R_MID, R_LONG, R_INFO
  let rIdx = 1;
  for (const block of spec.reading) {
    for (const q of block.questions) {
      const [prompt, correctOpt, wrongs, reading, ko, exp] = q;
      const id = `${prefix}-r${String(rIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(
        id,
        correctOpt,
        wrongs
      );
      written.push({
        id,
        code: block.code,
        passage: block.passage,
        prompt,
        options,
        ans,
        reading,
        ko,
        exp,
      });
    }
  }

  // 9. Listening: L_TASK, L_POINT, L_GIST, L_RESP, L_INT
  const listening: CompactListeningTuple[] = [];
  let lIdx = 1;
  for (const row of spec.listening) {
    const [code, situationKo, scriptJp, questionJp, correctOpt, wrongs, ko, exp] =
      row;
    const id = `${prefix}-l${String(lIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(
      id,
      correctOpt,
      wrongs
    );
    listening.push({
      id,
      code,
      situationKo,
      scriptJp,
      questionJp,
      options,
      ans,
      ko,
      exp,
    });
  }

  return [
    ...buildWrittenQuestions(level, written),
    ...buildListeningQuestions(level, listening),
  ];
}
