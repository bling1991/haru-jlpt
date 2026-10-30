export type AiVoicePreset = 'standard' | 'warm';

export interface SpeechPlaybackSnapshot {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'fallback';
  currentTime: number;
  duration: number;
  rate: number;
  preset: AiVoicePreset;
}

const blobUrlCache = new Map<string, string>();
const inflightRequests = new Map<string, Promise<string>>();

let activeAudio: HTMLAudioElement | null = null;
let activeRequestToken = 0;
let currentPreset: AiVoicePreset = 'standard';
let currentRate = 1.0;

type SnapshotListener = (snapshot: SpeechPlaybackSnapshot) => void;
const listeners = new Set<SnapshotListener>();

function emitSnapshot(
  status: SpeechPlaybackSnapshot['status'],
  currentTime = 0,
  duration = 0
): void {
  const snap: SpeechPlaybackSnapshot = {
    status,
    currentTime,
    duration: Number.isFinite(duration) ? duration : 0,
    rate: currentRate,
    preset: currentPreset,
  };
  listeners.forEach((fn) => fn(snap));
}

export function subscribeSpeechStatus(listener: SnapshotListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVoicePreset(): AiVoicePreset {
  return currentPreset;
}

export function setVoicePreset(preset: AiVoicePreset): void {
  currentPreset = preset;
}

export function isSpeechCached(
  text: string,
  preset: AiVoicePreset = currentPreset
): boolean {
  return blobUrlCache.has(`${preset}::${text.trim()}`);
}

function stripJapaneseWordSpaces(input: string): string {
  let prev = input;
  for (let i = 0; i < 4; i++) {
    const next = prev.replace(/([^\x00-\x7F])[ \t]+([^\x00-\x7F])/g, '$1$2');
    if (next === prev) break;
    prev = next;
  }
  prev = prev.replace(/([0-9０-９a-zA-Z％%])[ \t]+([^\x00-\x7F])/g, '$1$2');
  prev = prev.replace(/([^\x00-\x7F])[ \t]+([0-9０-９])/g, '$1$2');
  return prev.trim();
}

/**
 * Prefetches high-clarity AI Japanese speech WAV from `/api/tts` and caches its Blob URL.
 */
export async function prefetchJapaneseSpeech(
  text: string,
  preset: AiVoicePreset = currentPreset
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty text');
  }

  const key = `${preset}::${trimmed}`;
  const existingUrl = blobUrlCache.get(key);
  if (existingUrl) {
    return existingUrl;
  }

  const existingPromise = inflightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, preset }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error || `TTS HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'audio/wav';
      const blob = new Blob([arrayBuffer], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);

      // Keep memory bounded to 80 clips
      if (blobUrlCache.size >= 80) {
        const oldestKey = blobUrlCache.keys().next().value;
        if (oldestKey) {
          const oldUrl = blobUrlCache.get(oldestKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          blobUrlCache.delete(oldestKey);
        }
      }

      blobUrlCache.set(key, objectUrl);
      return objectUrl;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, fetchPromise);
  return fetchPromise;
}

export function stopJapaneseSpeech(): void {
  activeRequestToken += 1;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  emitSnapshot('idle', 0, 0);
}

export function changeActiveSpeechRate(nextRate: number): void {
  currentRate = nextRate;
  if (activeAudio) {
    activeAudio.playbackRate = nextRate;
    emitSnapshot(
      activeAudio.paused ? 'paused' : 'playing',
      activeAudio.currentTime,
      activeAudio.duration
    );
  }
}

export function togglePauseActiveSpeech(): boolean {
  if (!activeAudio) return false;
  if (activeAudio.paused) {
    void activeAudio.play();
    emitSnapshot('playing', activeAudio.currentTime, activeAudio.duration);
    return true;
  } else {
    activeAudio.pause();
    emitSnapshot('paused', activeAudio.currentTime, activeAudio.duration);
    return false;
  }
}

function fallbackBrowserSpeak(
  text: string,
  rate: number,
  token: number,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    emitSnapshot('idle', 0, 0);
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const lines = text
    .split('\n')
    .map((l) => stripJapaneseWordSpaces(l.replace(/^[^：:]{1,6}[：:]\s*/, '')))
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    emitSnapshot('idle', 0, 0);
    onEnd?.();
    return;
  }

  emitSnapshot('fallback', 0, 0);
  const voices = window.speechSynthesis.getVoices();
  const jpVoice =
    voices.find((v) => v.lang === 'ja-JP' && !v.localService) ||
    voices.find((v) => v.lang.startsWith('ja'));

  let idx = 0;
  const next = () => {
    if (token !== activeRequestToken || idx >= lines.length) {
      emitSnapshot('idle', 0, 0);
      onEnd?.();
      return;
    }
    const utt = new SpeechSynthesisUtterance(lines[idx++]);
    utt.lang = 'ja-JP';
    utt.rate = rate;
    if (jpVoice) utt.voice = jpVoice;
    utt.onend = () => {
      if (token !== activeRequestToken) return;
      if (idx < lines.length) {
        window.setTimeout(next, 280);
      } else {
        emitSnapshot('idle', 0, 0);
        onEnd?.();
      }
    };
    utt.onerror = () => {
      emitSnapshot('idle', 0, 0);
      onEnd?.();
    };
    window.speechSynthesis.speak(utt);
  };

  next();
}

/**
 * Plays studio-grade AI Japanese speech (multi-speaker for dialogues, clear Tokyo announcer for single lines).
 * Preserves pitch cleanly when playback rate (e.g. 0.75x, 0.85x, 1.0x) is adjusted.
 */
export function speakJapanese(
  text: string,
  rate = 1.0,
  onEnd?: () => void,
  preset: AiVoicePreset = currentPreset
): void {
  stopJapaneseSpeech();
  const token = ++activeRequestToken;
  currentRate = rate;
  currentPreset = preset;

  emitSnapshot('loading', 0, 0);

  prefetchJapaneseSpeech(text, preset)
    .then(async (blobUrl) => {
      if (token !== activeRequestToken) return;

      const audio = new Audio(blobUrl);
      audio.preload = 'auto';
      audio.preservesPitch = true;
      audio.playbackRate = currentRate;
      activeAudio = audio;

      audio.ontimeupdate = () => {
        if (token !== activeRequestToken) return;
        emitSnapshot(
          audio.paused ? 'paused' : 'playing',
          audio.currentTime,
          audio.duration
        );
      };

      audio.onloadedmetadata = () => {
        if (token !== activeRequestToken) return;
        emitSnapshot('playing', 0, audio.duration);
      };

      audio.onended = () => {
        if (token !== activeRequestToken) return;
        activeAudio = null;
        emitSnapshot('idle', 0, 0);
        onEnd?.();
      };

      audio.onerror = () => {
        if (token !== activeRequestToken) return;
        activeAudio = null;
        fallbackBrowserSpeak(text, rate, token, onEnd);
      };

      await audio.play();
      if (token === activeRequestToken) {
        emitSnapshot('playing', audio.currentTime, audio.duration);
      }
    })
    .catch((err) => {
      console.warn('[AI TTS Fallback]:', err);
      if (token !== activeRequestToken) return;
      fallbackBrowserSpeak(text, rate, token, onEnd);
    });
}
