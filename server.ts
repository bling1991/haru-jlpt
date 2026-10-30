import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Removes artificial visual spaces between Japanese characters (Hiragana, Katakana, Kanji, CJK punctuation)
 * so Gemini TTS speaks continuous, natural Tokyo-accented Japanese without choppy pauses.
 */
function normalizeJapaneseTextForTts(input: string): string {
  let prev = input;
  // Remove spaces surrounded by non-ASCII (Japanese/CJK) characters iteratively
  for (let i = 0; i < 4; i++) {
    const next = prev.replace(/([^\x00-\x7F])[ \t]+([^\x00-\x7F])/g, '$1$2');
    if (next === prev) break;
    prev = next;
  }
  // Remove spaces between Japanese char and digits/letters when followed by Japanese counters (e.g. "30分 おくれて" -> "30分おくれて")
  prev = prev.replace(/([0-9０-９a-zA-Z％%])[ \t]+([^\x00-\x7F])/g, '$1$2');
  prev = prev.replace(/([^\x00-\x7F])[ \t]+([0-9０-９])/g, '$1$2');
  // Replace blank placeholders like （　　） or ＿＿＿ with a brief natural pause
  prev = prev.replace(/[（(]\s*[0-9０-９]*\s*[）)]/g, '、');
  prev = prev.replace(/＿+/g, '、');
  prev = prev.replace(/★/g, '、');
  return prev.trim();
}

type VoicePreset = 'standard' | 'warm';

const VOICE_PAIR_BY_PRESET: Record<
  VoicePreset,
  { female: string; male: string }
> = {
  standard: { female: 'Kore', male: 'Puck' },
  warm: { female: 'Zephyr', male: 'Charon' },
};

interface ParsedDialogueTurn {
  speaker: 'SpeakerM' | 'SpeakerF';
  text: string;
  style: string;
}

function parseJapaneseSpeechTurns(rawText: string): ParsedDialogueTurn[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const turns: ParsedDialogueTurn[] = [];
  let lastSpeaker: 'SpeakerM' | 'SpeakerF' = 'SpeakerF';

  const malePrefixRegex =
    /^(男|男1|男2|男子|男子学生|父|夫|課長|部長|社長|専務|先生|講師|アナウンサー|教授A|教授C|A)\s*[：:]/;
  const femalePrefixRegex =
    /^(女|女1|女2|女子|女子学生|母|妻|店員|受付|司書|職員|ナビゲーター|教授B|B)\s*[：:]/;
  const narratorQuestionRegex = /^質問\s*[：:]/;
  const situationRegex = /^状況\s*[：:]/;

  for (const rawLine of lines) {
    if (situationRegex.test(rawLine)) {
      const body = normalizeJapaneseTextForTts(
        rawLine.replace(situationRegex, '')
      );
      if (body) {
        turns.push({
          speaker: 'SpeakerF',
          text: body,
          style:
            'Clear, calm, articulate Tokyo Japanese JLPT exam announcer reading the situation',
        });
        lastSpeaker = 'SpeakerF';
      }
      continue;
    }

    if (narratorQuestionRegex.test(rawLine)) {
      const body = normalizeJapaneseTextForTts(
        rawLine.replace(narratorQuestionRegex, '')
      );
      if (body) {
        // Use opposite speaker from a single-turn prompt if possible so prompt & question are clearly distinct
        const narratorSpeaker: 'SpeakerM' | 'SpeakerF' =
          turns.length === 1 && turns[0].speaker === 'SpeakerF'
            ? 'SpeakerM'
            : 'SpeakerF';
        turns.push({
          speaker: narratorSpeaker,
          text: `質問。${body}`,
          style:
            'Clear, calm, measured standard Tokyo Japanese JLPT exam narrator asking the question after a short pause',
        });
        lastSpeaker = narratorSpeaker;
      }
      continue;
    }

    if (malePrefixRegex.test(rawLine)) {
      const body = normalizeJapaneseTextForTts(
        rawLine.replace(/^[^：:]+[：:]\s*/, '')
      );
      if (body) {
        turns.push({
          speaker: 'SpeakerM',
          text: body,
          style:
            'Clear, natural, articulate standard Tokyo Japanese male speaker in a JLPT listening test',
        });
        lastSpeaker = 'SpeakerM';
      }
      continue;
    }

    if (femalePrefixRegex.test(rawLine)) {
      const body = normalizeJapaneseTextForTts(
        rawLine.replace(/^[^：:]+[：:]\s*/, '')
      );
      if (body) {
        turns.push({
          speaker: 'SpeakerF',
          text: body,
          style:
            'Clear, natural, articulate standard Tokyo Japanese female speaker in a JLPT listening test',
        });
        lastSpeaker = 'SpeakerF';
      }
      continue;
    }

    // Handle generic prefixes like 学生： or 客： by alternating from previous speaker
    if (/^[^：:]{1,8}[：:]/.test(rawLine)) {
      const nextSpeaker: 'SpeakerM' | 'SpeakerF' =
        lastSpeaker === 'SpeakerM' ? 'SpeakerF' : 'SpeakerM';
      const body = normalizeJapaneseTextForTts(
        rawLine.replace(/^[^：:]+[：:]\s*/, '')
      );
      if (body) {
        turns.push({
          speaker: nextSpeaker,
          text: body,
          style:
            'Clear, natural, articulate standard Tokyo Japanese speaker in a JLPT listening test',
        });
        lastSpeaker = nextSpeaker;
      }
      continue;
    }

    const body = normalizeJapaneseTextForTts(rawLine);
    if (body) {
      turns.push({
        speaker: lastSpeaker,
        text: body,
        style:
          'Clear, articulate, natural standard Tokyo Japanese pronunciation for language learners',
      });
    }
  }

  return turns;
}

// Simple LRU cache in memory (stores up to 64 WAV buffers)
const AUDIO_CACHE_MAX = 64;
const audioCache = new Map<string, { buffer: Buffer; mimeType: string }>();

function putAudioCache(key: string, buffer: Buffer, mimeType: string): void {
  if (audioCache.has(key)) {
    audioCache.delete(key);
  } else if (audioCache.size >= AUDIO_CACHE_MAX) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) {
      audioCache.delete(oldestKey);
    }
  }
  audioCache.set(key, { buffer, mimeType });
}

async function synthesizeJapaneseSpeech(
  rawText: string,
  preset: VoicePreset
): Promise<{ buffer: Buffer; mimeType: string }> {
  const cacheKey = `${preset}::${rawText.trim()}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const ai = getGenAIClient();
  const voices = VOICE_PAIR_BY_PRESET[preset] ?? VOICE_PAIR_BY_PRESET.standard;
  const turns = parseJapaneseSpeechTurns(rawText);

  if (turns.length === 0) {
    throw new Error('Empty speech text');
  }

  const hasMale = turns.some((t) => t.speaker === 'SpeakerM');
  const hasFemale = turns.some((t) => t.speaker === 'SpeakerF');

  // Multi-speaker realistic JLPT dialogue
  if (hasMale && hasFemale) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: turns.map((turn) => ({
              text: `${turn.speaker}: ${turn.text}`,
              speechMetadata: {
                speaker: turn.speaker,
                style: turn.style,
              },
            })),
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'SpeakerM',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voices.male },
                  },
                },
                {
                  speaker: 'SpeakerF',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voices.female },
                  },
                },
              ],
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      );
      if (part?.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const mimeType = part.inlineData.mimeType || 'audio/wav';
        putAudioCache(cacheKey, buffer, mimeType);
        return { buffer, mimeType };
      }
    } catch (err) {
      console.warn(
        '[TTS] Multi-speaker gemini-3.8-flash-tts failed, falling back to single-speaker lite-tts:',
        err
      );
    }
  }

  // Single-speaker high-clarity TTS (or fallback)
  const chosenVoice = hasMale && !hasFemale ? voices.male : voices.female;
  const combinedText = turns.map((t) => t.text).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: combinedText,
            speechMetadata: {
              style:
                'Clear, natural, articulate standard Tokyo Japanese announcer for JLPT listening practice, speaking at a comfortable, easy-to-follow pace',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: chosenVoice },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data
  );
  if (!part?.inlineData?.data) {
    throw new Error('No audio returned from Gemini TTS model');
  }

  const buffer = Buffer.from(part.inlineData.data, 'base64');
  const mimeType = part.inlineData.mimeType || 'audio/wav';
  putAudioCache(cacheKey, buffer, mimeType);
  return { buffer, mimeType };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      const preset: VoicePreset =
        req.body?.preset === 'warm' ? 'warm' : 'standard';

      if (!text.trim()) {
        res.status(400).json({ error: '음성으로 변환할 일본어 문장이 비어 있습니다.' });
        return;
      }

      if (text.length > 4000) {
        res.status(400).json({ error: '문장 길이가 허용 범위를 초과했습니다.' });
        return;
      }

      const { buffer, mimeType } = await synthesizeJapaneseSpeech(text, preset);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'AI 음성 생성 중 오류가 발생했습니다.';
      console.error('[/api/tts Error]:', message);
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
