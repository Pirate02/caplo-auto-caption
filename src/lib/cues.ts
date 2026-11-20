import type { Cue, Word } from './types'

/** a pause longer than this always starts a new caption */
const MAX_GAP = 0.6
/** how long a caption lingers after its last word */
const HOLD = 0.25

export function buildCues(words: Word[], perCue: number): Cue[] {
  const cues: Cue[] = []
  let first = 0
  let cur: Word[] = []

  const flush = () => {
    if (!cur.length) return
    cues.push({ first, words: cur, start: cur[0].start, until: cur[cur.length - 1].end + HOLD })
    first += cur.length
    cur = []
  }

  for (const w of words) {
    const prev = cur[cur.length - 1]
    if (prev && w.start - prev.end > MAX_GAP) flush()
    cur.push(w)
    if (cur.length >= perCue || w.brk) flush()
  }
  flush()

  // never overlap the next caption
  for (let i = 0; i < cues.length - 1; i++) {
    cues[i].until = Math.max(cues[i].start + 0.1, Math.min(cues[i].until, cues[i + 1].start))
  }
  return cues
}

/** Replace the words of one cue with edited text, keeping timing sensible. */
export function replaceCueText(words: Word[], cue: Cue, text: string): Word[] {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  const count = cue.words.length
  let next: Word[]
  if (parts.length === count) {
    next = cue.words.map((w, i) => ({ ...w, text: parts[i] }))
  } else if (parts.length === 0) {
    next = []
  } else {
    const start = cue.words[0].start
    const end = cue.words[count - 1].end
    const step = (end - start) / parts.length
    next = parts.map((p, i) => ({ text: p, start: start + step * i, end: start + step * (i + 1) }))
  }
  return [...words.slice(0, cue.first), ...next, ...words.slice(cue.first + count)]
}
