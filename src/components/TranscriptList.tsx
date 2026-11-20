import type { Cue } from '../lib/types'

interface Props {
  cues: Cue[]
  time: number
  uppercase: boolean
  onSeek: (t: number) => void
  onEdit: (cue: Cue, text: string) => void
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function TranscriptList({ cues, time, uppercase, onSeek, onEdit }: Props) {
  if (!cues.length) return null
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold">Edit captions</h2>
      <ul className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-line bg-panel p-2">
        {cues.map((cue) => {
          const text = cue.words.map((w) => w.text).join(' ')
          const current = time >= cue.start && time < cue.until
          return (
            <li key={cue.first} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${current ? 'bg-raise' : ''}`}>
              <button
                type="button"
                onClick={() => onSeek(cue.start + 0.01)}
                className="w-10 shrink-0 text-left text-xs tabular-nums text-mute hover:text-text"
                aria-label={`Jump to ${fmt(cue.start)}`}
              >
                {fmt(cue.start)}
              </button>
              <input
                // remount when words change so the field never shows stale text
                key={`${cue.first}-${text}`}
                defaultValue={text}
                spellCheck={false}
                className={`min-w-0 flex-1 bg-transparent py-1 text-sm outline-none ${uppercase ? 'uppercase' : ''}`}
                onBlur={(e) => e.currentTarget.value !== text && onEdit(cue, e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
