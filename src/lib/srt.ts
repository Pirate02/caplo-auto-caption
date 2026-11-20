import type { Cue } from './types'

const pad = (n: number, l = 2) => String(n).padStart(l, '0')

function stamp(t: number) {
  const ms = Math.round(t * 1000)
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`
}

export function toSrt(cues: Cue[], uppercase: boolean): string {
  return cues
    .map((c, i) => {
      const text = c.words.map((w) => w.text).join(' ')
      return `${i + 1}\n${stamp(c.start)} --> ${stamp(c.until)}\n${uppercase ? text.toUpperCase() : text}\n`
    })
    .join('\n')
}
