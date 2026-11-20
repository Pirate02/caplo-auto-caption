import { useEffect, useMemo, useRef, useState } from 'react'
import { Footer, Logo } from './components/Brand'
import { Landing } from './components/Landing'
import { Stage } from './components/Stage'
import { TranscriptList } from './components/TranscriptList'
import { Button, Field, Section, Segmented, Select, Slider } from './components/ui'
import { extractAudio } from './lib/audio'
import { buildCues, replaceCueText } from './lib/cues'
import { exportVideo } from './lib/exportVideo'
import { DEFAULT_SETTINGS, STYLES, getStyle } from './lib/styles'
import { toSrt } from './lib/srt'
import { transcribe } from './lib/transcribe'
import type { AnimationId, CaptionSettings, Cue, ModelSize, VerticalPosition, Word, WordsPerCaption } from './lib/types'

const LANGUAGES = [
  ['auto', 'Auto-detect'],
  ['english', 'English'],
  ['hindi', 'Hindi'],
  ['nepali', 'Nepali'],
  ['spanish', 'Spanish'],
  ['french', 'French'],
  ['german', 'German'],
  ['portuguese', 'Portuguese'],
  ['arabic', 'Arabic'],
  ['japanese', 'Japanese'],
]

const ANIMATIONS: { value: AnimationId; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'bounce', label: 'Bounce' },
]

const POSITIONS: { value: VerticalPosition; label: string }[] = [
  { value: 'upper', label: 'Upper third' },
  { value: 'middle', label: 'Middle' },
  { value: 'lower', label: 'Lower third' },
]

interface Job {
  label: string
  progress: number | null
}

const SETTINGS_KEY = 'caplo:settings'
function loadSettings(): CaptionSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [settings, setSettings] = useState<CaptionSettings>(loadSettings)
  const [model, setModel] = useState<ModelSize>('base')
  const [language, setLanguage] = useState('auto')
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const style = getStyle(settings.styleId)
  const cues = useMemo(() => buildCues(words, settings.wordsPerCaption), [words, settings.wordsPerCaption])
  const set = <K extends keyof CaptionSettings>(k: K, v: CaptionSettings[K]) => setSettings((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      /* storage unavailable, fine */
    }
  }, [settings])

  // make sure custom fonts are ready before the canvas needs them
  useEffect(() => {
    STYLES.forEach((s) => document.fonts.load(`${s.fontWeight} 40px "${s.fontFamily}"`))
  }, [])

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('video/') && !f.type.startsWith('audio/')) {
      setError('That does not look like a video file.')
      return
    }
    if (url) URL.revokeObjectURL(url)
    setError(null)
    setWords([])
    setFile(f)
    setUrl(URL.createObjectURL(f))
  }

  const run = async (label: string, task: (signal: AbortSignal) => Promise<void>) => {
    const ac = new AbortController()
    abortRef.current = ac
    setError(null)
    setJob({ label, progress: null })
    try {
      await task(ac.signal)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : String(e))
    } finally {
      setJob(null)
      abortRef.current = null
    }
  }

  const generate = () =>
    file &&
    run('Reading audio…', async (signal) => {
      const audio = await extractAudio(file)
      const result = await transcribe(
        audio,
        model,
        language === 'auto' ? null : language,
        {
          onStatus: (label) => setJob({ label, progress: null }),
          onDownload: (p) => setJob({ label: 'Downloading model (first run only)…', progress: p / 100 }),
          onProgress: (p) => setJob({ label: 'Transcribing…', progress: p }),
        },
        signal,
      )
      if (!result.length) throw new Error('No speech found in this file.')
      setWords(result)
    })

  const exportMp4 = () =>
    file &&
    run('Rendering video…', async (signal) => {
      const { blob, ext } = await exportVideo({
        file,
        cues,
        settings,
        style,
        signal,
        onProgress: (p) => setJob({ label: 'Rendering video… keep this tab visible', progress: p }),
      })
      download(blob, `${file.name.replace(/\.[^.]+$/, '')}-captioned.${ext}`)
    })

  const exportSrt = () =>
    file &&
    download(new Blob([toSrt(cues, settings.uppercase)], { type: 'text/plain' }), `${file.name.replace(/\.[^.]+$/, '')}.srt`)

  const seek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t
  }
  const editCue = (cue: Cue, text: string) => setWords((w) => replaceCueText(w, cue, text))

  const busy = job !== null
  const hasCaptions = words.length > 0

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-xl font-bold tracking-tight">caplo</span>
        </div>
        <a href="#privacy" className="text-sm text-mute hover:text-text">
          Private by design
        </a>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {url ? (
            <>
              <Stage url={url} cues={cues} settings={settings} style={style} videoRef={videoRef} onTime={setTime} />
              <div className="mt-3 flex items-center justify-between text-sm text-mute">
                <span className="truncate">{file?.name}</span>
                <label className="cursor-pointer underline hover:text-text">
                  Choose another
                  <input type="file" accept="video/*,audio/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
                </label>
              </div>
            </>
          ) : (
            <Landing onFile={pickFile} />
          )}
          <TranscriptList cues={cues} time={time} uppercase={settings.uppercase} onSeek={seek} onEdit={editCue} />
        </div>

        <aside className="space-y-4">
          <Section title="Transcribe">
            <Field label="Model" hint={model === 'tiny' ? '~40 MB' : model === 'base' ? '~150 MB' : '~480 MB'}>
              <Select value={model} onChange={(v) => setModel(v as ModelSize)}>
                <option value="tiny">Tiny: fastest, rougher</option>
                <option value="base">Base: good balance</option>
                <option value="small">Small: most accurate</option>
              </Select>
            </Field>
            <Field label="Language">
              <Select value={language} onChange={setLanguage}>
                {LANGUAGES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Button onClick={generate} disabled={!file || busy} className="w-full">
              {hasCaptions ? 'Regenerate captions' : 'Generate captions'}
            </Button>
          </Section>

          <Section title="Style">
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === settings.styleId}
                  onClick={() => setSettings((p) => ({ ...p, styleId: s.id, activeColor: null }))}
                  className={`rounded-lg border px-3 py-3 text-lg leading-none ${
                    s.id === settings.styleId ? 'border-accent bg-raise' : 'border-line bg-ink hover:bg-raise'
                  }`}
                  style={{
                    fontFamily: `"${s.fontFamily}"`,
                    fontWeight: s.fontWeight,
                    color: s.highlight === 'pill' ? s.pillText : s.fill,
                    background: s.highlight === 'pill' ? s.activeFill : undefined,
                    WebkitTextStroke: s.strokeWidth ? '1px #000' : undefined,
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <Field label="Words per caption">
              <Segmented
                value={settings.wordsPerCaption}
                onChange={(v) => set('wordsPerCaption', v as WordsPerCaption)}
                options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
              />
            </Field>
            <Field label="Text case">
              <Segmented
                value={settings.uppercase ? 'upper' : 'normal'}
                onChange={(v) => set('uppercase', v === 'upper')}
                options={[
                  { value: 'normal', label: 'As spoken' },
                  { value: 'upper', label: 'UPPERCASE' },
                ]}
              />
            </Field>
            <Field label="Animation">
              <Segmented value={settings.animation} onChange={(v) => set('animation', v)} options={ANIMATIONS} />
            </Field>
            <Field label="Size">
              <Slider label="Caption size" min={0.05} max={0.14} step={0.005} value={settings.fontScale} onChange={(v) => set('fontScale', v)} />
            </Field>
            <Field label="Position">
              <Segmented value={settings.position} onChange={(v) => set('position', v)} options={POSITIONS} />
            </Field>
            {style.highlight !== 'none' && (
              <Field label="Highlight color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    aria-label="Highlight color"
                    value={settings.activeColor ?? style.activeFill}
                    onChange={(e) => set('activeColor', e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded border border-line bg-ink"
                  />
                  {settings.activeColor && (
                    <button type="button" className="text-sm text-mute underline" onClick={() => set('activeColor', null)}>
                      Reset
                    </button>
                  )}
                </div>
              </Field>
            )}
          </Section>

          <Section title="Export">
            <div className="flex gap-2">
              <Button onClick={exportMp4} disabled={!hasCaptions || busy} className="flex-1">
                Video with captions
              </Button>
              <Button variant="ghost" onClick={exportSrt} disabled={!hasCaptions || busy}>
                .srt
              </Button>
            </div>
          </Section>

          {job && (
            <div className="rounded-xl border border-line bg-panel p-4" role="status">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>{job.label}</span>
                <button type="button" className="text-mute underline" onClick={() => abortRef.current?.abort()}>
                  Cancel
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-ink">
                <div
                  className={`h-full bg-accent transition-[width] ${job.progress === null ? 'w-1/3 animate-pulse' : ''}`}
                  style={job.progress === null ? undefined : { width: `${Math.round(job.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl border border-accent/50 bg-panel p-4 text-sm">
              {error}
            </p>
          )}
        </aside>
      </main>
      <Footer />
    </div>
  )
}
