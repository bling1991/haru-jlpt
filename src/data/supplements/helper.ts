import { JlptLevel, QuizQuestion } from '../../types/quiz';
import { placeOptionsDeterministically } from '../mockTests/bankHelpers';
import {
  buildListeningQuestions,
  buildWrittenQuestions,
  CompactListeningTuple,
  CompactWrittenTuple,
} from '../questions/builder';

// [kanji, kana, [w1, w2, w3], promptWithBrackets, fullReading, koTranslation, customExp?]
export type SupVRead = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string?,
];

// [kana, kanji, [w1, w2, w3], promptWithBrackets, fullReading, koTranslation, customExp?]
export type SupVOrtho = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string?,
];

// [correct, [w1, w2, w3], promptWithBlank, fullReading, koTranslation, expKo]
export type SupBlankRow = [
  string,
  [string, string, string],
  string,
  string,
  string,
  string,
];

// [underlined, correctSyn, [w1, w2, w3], promptWithBrackets, fullReading, koTranslation, expKo]
export type SupVSyn = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
  string,
];

// [headerPrompt, correctSent, [w1, w2, w3], fullReading, koTranslation, expKo]
export type SupVUse = [
  string,
  string,
  [string, string, string],
  string,
  string,
  string,
];

// [promptWithStar, [opt1, opt2, opt3, opt4], ansIdx, fullReading, koTranslation, expKo]
export type SupGStar = [
  string,
  [string, string, string, string],
  0 | 1 | 2 | 3,
  string,
  string,
  string,
];

export interface SupGTextBlock {
  passage: string;
  blanks: SupBlankRow[];
}

export interface SupReadingBlock {
  code: 'R_SHORT' | 'R_MID' | 'R_LONG' | 'R_INFO';
  passage: string;
  questions: SupBlankRow[]; // [correctOpt, [w1,w2,w3], questionPrompt, reading, ko, exp]
}

// [code, situationKo, scriptJp, questionJp, correctOpt, [w1, w2, w3], ko, exp]
export type SupListeningRow = [
  'L_TASK' | 'L_POINT' | 'L_GIST' | 'L_RESP' | 'L_INT',
  string,
  string,
  string,
  string,
  [string, string, string],
  string,
  string,
];

export interface LevelTestSupplementSpec {
  vRead?: SupVRead[];
  vOrtho?: SupVOrtho[];
  vForm?: SupBlankRow[];
  vCtx?: SupBlankRow[];
  vSyn?: SupVSyn[];
  vUse?: SupVUse[];
  gSent?: SupBlankRow[];
  gStar?: SupGStar[];
  gText?: SupGTextBlock[];
  reading?: SupReadingBlock[];
  listening?: SupListeningRow[];
}

export function compileSupplementSpec(
  level: JlptLevel,
  testNumber: number,
  spec: LevelTestSupplementSpec
): QuizQuestion[] {
  const prefix = `${level.toLowerCase()}-sup-t${testNumber}`;
  const written: CompactWrittenTuple[] = [];
  let vIdx = 1;

  for (const row of spec.vRead ?? []) {
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
        `「${kanji}」의 올바른 읽기는 「${kana}」입니다. 장단음·탁음·촉음 차이에 유의하세요.`,
      vocab: [[kanji, kana, ko]],
    });
  }

  for (const row of spec.vOrtho ?? []) {
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
        `「${kana}」는 한자로 「${kanji}」라고 표기합니다. 모양이나 음이 비슷한 한자와 구별하세요.`,
      vocab: [[kanji, kana, ko]],
    });
  }

  for (const row of spec.vForm ?? []) {
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

  for (const row of spec.vCtx ?? []) {
    const [correct, wrongs, prompt, reading, ko, exp] = row;
    const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(id, correct, wrongs);
    written.push({
      id,
      code: 'V_CTX',
      prompt,
      options,
      ans,
      reading,
      ko,
      exp,
    });
  }

  for (const row of spec.vSyn ?? []) {
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

  for (const row of spec.vUse ?? []) {
    const [headerPrompt, correctSent, wrongSents, reading, ko, exp] = row;
    const id = `${prefix}-v${String(vIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(
      id,
      correctSent,
      wrongSents
    );
    written.push({
      id,
      code: 'V_USE',
      prompt: headerPrompt,
      options,
      ans,
      reading,
      ko,
      exp,
    });
  }

  let gIdx = 1;
  for (const row of spec.gSent ?? []) {
    const [correct, wrongs, prompt, reading, ko, exp] = row;
    const id = `${prefix}-g${String(gIdx++).padStart(2, '0')}`;
    const { options, ans } = placeOptionsDeterministically(id, correct, wrongs);
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

  for (const row of spec.gStar ?? []) {
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

  for (const block of spec.gText ?? []) {
    for (const blank of block.blanks) {
      const [correct, wrongs, prompt, reading, ko, exp] = blank;
      const id = `${prefix}-g${String(gIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(
        id,
        correct,
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

  let rIdx = 1;
  for (const block of spec.reading ?? []) {
    for (const q of block.questions) {
      const [correct, wrongs, prompt, reading, ko, exp] = q;
      const id = `${prefix}-r${String(rIdx++).padStart(2, '0')}`;
      const { options, ans } = placeOptionsDeterministically(
        id,
        correct,
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

  const listening: CompactListeningTuple[] = [];
  let lIdx = 1;
  for (const row of spec.listening ?? []) {
    const [
      code,
      situationKo,
      scriptJp,
      questionJp,
      correctOpt,
      wrongs,
      ko,
      exp,
    ] = row;
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
