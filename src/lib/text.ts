import type { Word } from './types'

const SENTENCE_END = /[.!?…।。！？]["'”’)\]]*$/

/** Keeps letters, numbers, apostrophes, hyphens and a few symbols; drops the rest. */
function strip(s: string): string {
  return s
    .replace(/[^\p{L}\p{N}\p{M}'’\-%$&@#.,]/gu, '')
    // drop . and , unless they sit between digits (3.5, 1,000)
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, '')
    .replace(/^['’\-]+|['’\-]+$/g, '')
}

/**
 * Removes punctuation from Whisper's words. We remember where sentences ended
 * (`brk`) first, so captions still break naturally.
 */
export function normalizeWords(raw: Word[]): Word[] {
  const out: Word[] = []
  for (const w of raw) {
    const brk = SENTENCE_END.test(w.text.trim())
    const text = strip(w.text)
    if (!text) {
      if (brk && out.length) out[out.length - 1].brk = true
      continue
    }
    out.push({ ...w, text, brk })
  }
  return out
}
