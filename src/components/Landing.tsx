import { useEffect, useState } from 'react'

const LINES = [['Drop', 'a', 'video'], ['get', 'captions'], ['zero', 'uploads']]
const TOTAL = LINES.flat().length

/** The headline lights up word by word, like the captions it makes. */
function Headline() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(-1)
      return
    }
    const id = setInterval(() => setActive((a) => (a + 1) % (TOTAL + 2)), 480)
    return () => clearInterval(id)
  }, [])

  let n = 0
  return (
    <h1
      className="text-5xl leading-[0.98] tracking-tight sm:text-7xl"
      style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}
    >
      {LINES.map((line, li) => (
        <span key={li} className="block">
          {line.map((word) => {
            const on = n++ === active
            return (
              <span
                key={word}
                className="mr-[0.25em] inline-block transition-[color,transform] duration-150"
                style={{
                  color: on ? '#ffd60a' : '#e9eaee',
                  transform: on ? 'scale(1.06)' : 'scale(1)',
                  textShadow: '0 3px 0 rgba(0,0,0,0.35)',
                }}
              >
                {word}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

const POINTS = ['Runs on this device', 'No account needed', 'Model downloads once']

export function Landing({ onFile }: { onFile: (f: File | undefined) => void }) {
  const [over, setOver] = useState(false)
  return (
    <div className="flex min-h-[62vh] flex-col justify-center gap-8">
      <Headline />
      <p className="max-w-md text-mute">
        Auto captions for shorts and long videos. Pick a style, choose words per caption, export.
      </p>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onFile(e.dataTransfer.files[0])
        }}
        className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-6 transition-colors sm:max-w-md ${
          over ? 'border-accent bg-panel' : 'border-line hover:border-mute hover:bg-panel'
        }`}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-ink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
          </svg>
        </span>
        <span>
          <span className="block font-bold">Choose a video</span>
          <span className="block text-sm text-mute">or drag it onto this box</span>
        </span>
        <input type="file" accept="video/*,audio/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
        {POINTS.map((p) => (
          <li key={p} className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
