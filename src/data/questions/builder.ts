import {
  JlptLevel,
  PromptSegment,
  QuizCategory,
  QuizQuestion,
  VocabularyNote,
} from '../../types/quiz';

export type MondaiCode =
  | 'V_READ'
  | 'V_ORTHO'
  | 'V_FORM'
  | 'V_CTX'
  | 'V_SYN'
  | 'V_USE'
  | 'G_SENT'
  | 'G_STAR'
  | 'G_TEXT'
  | 'R_SHORT'
  | 'R_MID'
  | 'R_LONG'
  | 'R_INFO'
  | 'L_TASK'
  | 'L_POINT'
  | 'L_GIST'
  | 'L_RESP'
  | 'L_INT';

const MONDAI_SPEC: Record<
  MondaiCode,
  {
    category: QuizCategory;
    titleKo: string;
    instructionJp: string;
    instructionKo: string;
  }
> = {
  V_READ: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 한자 읽기',
    instructionJp:
      '＿＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '밑줄 친 한자의 올바른 히라가나 읽기를 고르십시오.',
  },
  V_ORTHO: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 한자 표기',
    instructionJp:
      '＿＿＿の言葉を漢字で書くとき、最もよいものを1・2・3・4から一つ選びなさい。',
    instructionKo: '밑줄 친 말을 한자로 표기할 때 가장 알맞은 것을 고르십시오.',
  },
  V_FORM: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 어형성',
    instructionJp:
      '（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '빈칸 ( 　 )에 들어갈 복합어·접사로 가장 알맞은 것을 고르십시오.',
  },
  V_CTX: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 문맥 규정',
    instructionJp:
      '（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '문맥상 빈칸 ( 　 )에 들어갈 가장 알맞은 어휘를 고르십시오.',
  },
  V_SYN: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 유의 표현',
    instructionJp:
      '＿＿＿の言葉に意味が最も近いものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '밑줄 친 부분과 의미가 가장 가까운 표현을 고르십시오.',
  },
  V_USE: {
    category: QuizCategory.Vocabulary,
    titleKo: '문자·어휘 · 어휘 용법',
    instructionJp:
      '次の言葉の使い方として最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '제시된 어휘의 쓰임이 가장 자연스러운 문장을 고르십시오.',
  },
  G_SENT: {
    category: QuizCategory.Grammar,
    titleKo: '문법 · 문법 형식 판단',
    instructionJp:
      '次の文の（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '빈칸 ( 　 )에 들어갈 가장 알맞은 문법 표현을 고르십시오.',
  },
  G_STAR: {
    category: QuizCategory.Grammar,
    titleKo: '문법 · ★ 문장 만들기',
    instructionJp:
      '次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '문장을 올바르게 배열할 때 ★ 위치에 들어갈 말을 고르십시오.',
  },
  G_TEXT: {
    category: QuizCategory.Grammar,
    titleKo: '문법 · 글의 문법',
    instructionJp:
      '次の文章を読んで、（　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。',
    instructionKo: '글의 흐름상 빈칸 ( 　 )에 들어갈 가장 알맞은 표현을 고르십시오.',
  },
  R_SHORT: {
    category: QuizCategory.Reading,
    titleKo: '독해 · 단문 이해',
    instructionJp:
      '次の文章を読んで、後の問いに対する答えとして最もよいものを1・2・3・4から一つ選びなさい。',
    instructionKo: '다음 글을 읽고 물음에 가장 알맞은 답을 고르십시오.',
  },
  R_MID: {
    category: QuizCategory.Reading,
    titleKo: '독해 · 중문 이해',
    instructionJp:
      '次の文章を読んで、後の問いに対する答えとして最もよいものを1・2・3・4から一つ選びなさい。',
    instructionKo: '다음 글을 읽고 필자의 생각이나 내용과 일치하는 것을 고르십시오.',
  },
  R_LONG: {
    category: QuizCategory.Reading,
    titleKo: '독해 · 논설·통합 이해',
    instructionJp:
      '次の文章を読んで、後の問いに対する答えとして最もよいものを1・2・3・4から一つ選びなさい。',
    instructionKo: '다음 논설·비평문을 읽고 물음에 가장 알맞은 답을 고르십시오.',
  },
  R_INFO: {
    category: QuizCategory.Reading,
    titleKo: '독해 · 정보 검색',
    instructionJp:
      '次の案内を見て、下の問いに対する答えとして最もよいものを1・2・3・4から一つ選びなさい。',
    instructionKo: '다음 안내문을 보고 조건에 맞는 가장 알맞은 답을 고르십시오.',
  },
  L_TASK: {
    category: QuizCategory.Listening,
    titleKo: '청해 · 問題1 과제 이해',
    instructionJp:
      'まず質問を聞いてください。それから話を聞いて、1から4の中から最もよいものを一つ選んでください。',
    instructionKo: '음성을 듣고(또는 대본을 확인하고), 이어서 해야 할 행동으로 가장 알맞은 것을 고르십시오.',
  },
  L_POINT: {
    category: QuizCategory.Listening,
    titleKo: '청해 · 問題2 포인트 이해',
    instructionJp:
      'まず質問を聞いてください。そのあと、話を聞いて、1から4の中から最もよいものを一つ選んでください。',
    instructionKo: '대화의 핵심 이유·일정·세부 내용을 파악하여 가장 알맞은 것을 고르십시오.',
  },
  L_GIST: {
    category: QuizCategory.Listening,
    titleKo: '청해 · 問題3 개요·발화 이해',
    instructionJp:
      '話を聞いて、全体の趣旨や状況に合う表現として最もよいものを1から4の中から一つ選んでください。',
    instructionKo: '담화의 전체 취지 또는 상황에 가장 어울리는 발화를 고르십시오.',
  },
  L_RESP: {
    category: QuizCategory.Listening,
    titleKo: '청해 · 問題4 즉시 응답',
    instructionJp:
      '短い文を聞いて、それに対する返事として最もよいものを1から4の中から一つ選んでください。',
    instructionKo: '상대방의 발화에 이어질 가장 자연스러운 즉시 응답을 고르십시오.',
  },
  L_INT: {
    category: QuizCategory.Listening,
    titleKo: '청해 · 問題5 통합 이해',
    instructionJp:
      '長めの話を聞いて、質問に対する答えとして最もよいものを1から4の中から一つ選んでください。',
    instructionKo: '여러 조건과 의견을 종합적으로 듣고 가장 알맞은 결론을 고르십시오.',
  },
};

/**
 * Parses `【highlighted】` markers inside a prompt string into PromptSegment[].
 */
export function parsePromptSegments(raw: string): PromptSegment[] {
  const parts = raw.split(/(【[^】]+】)/g).filter((p) => p.length > 0);
  return parts.map((part) => {
    if (part.startsWith('【') && part.endsWith('】')) {
      return { text: part.slice(1, -1), highlight: true };
    }
    return { text: part };
  });
}

export interface CompactWrittenTuple {
  id: string;
  code: MondaiCode;
  prompt: string;
  options: [string, string, string, string];
  ans: 0 | 1 | 2 | 3;
  reading: string;
  ko: string;
  exp: string;
  passage?: string;
  vocab?: [string, string, string][];
}

export interface CompactListeningTuple {
  id: string;
  code: 'L_TASK' | 'L_POINT' | 'L_GIST' | 'L_RESP' | 'L_INT';
  situationKo: string;
  scriptJp: string;
  questionJp: string;
  options: [string, string, string, string];
  ans: 0 | 1 | 2 | 3;
  ko: string;
  exp: string;
  vocab?: [string, string, string][];
}

export function buildWrittenQuestions(
  level: JlptLevel,
  items: CompactWrittenTuple[]
): QuizQuestion[] {
  return items.map((item) => {
    const spec = MONDAI_SPEC[item.code];
    const cleanPrompt = item.prompt.replace(/[【】]/g, '');
    const vocabNotes: VocabularyNote[] = (item.vocab ?? []).map(
      ([japanese, reading, meaningKo]) => ({
        japanese,
        reading,
        meaningKo,
      })
    );

    return {
      id: item.id,
      level,
      category: spec.category,
      mondaiTitleKo: spec.titleKo,
      instructionJp: spec.instructionJp,
      instructionKo: spec.instructionKo,
      passageJp: item.passage,
      promptSegments: parsePromptSegments(item.prompt),
      speechTextJp: item.passage
        ? `${item.passage}\n${cleanPrompt}`
        : cleanPrompt,
      options: item.options,
      correctIndex: item.ans,
      sentenceReadingJp: item.reading,
      translationKo: item.ko,
      explanationKo: item.exp,
      vocabularyNotes: vocabNotes,
    };
  });
}

export function buildListeningQuestions(
  level: JlptLevel,
  items: CompactListeningTuple[]
): QuizQuestion[] {
  return items.map((item) => {
    const spec = MONDAI_SPEC[item.code];
    const vocabNotes: VocabularyNote[] = (item.vocab ?? []).map(
      ([japanese, reading, meaningKo]) => ({
        japanese,
        reading,
        meaningKo,
      })
    );

    return {
      id: item.id,
      level,
      category: QuizCategory.Listening,
      mondaiTitleKo: spec.titleKo,
      instructionJp: spec.instructionJp,
      instructionKo: spec.instructionKo,
      situationKo: item.situationKo,
      audioScriptJp: item.scriptJp,
      promptSegments: [{ text: item.questionJp }],
      speechTextJp: `${item.scriptJp}\n質問：${item.questionJp}`,
      options: item.options,
      correctIndex: item.ans,
      sentenceReadingJp: item.scriptJp,
      translationKo: item.ko,
      explanationKo: item.exp,
      vocabularyNotes: vocabNotes,
    };
  });
}
