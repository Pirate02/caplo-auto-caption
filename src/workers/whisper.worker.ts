import { pipeline } from '@huggingface/transformers'
import type { ModelSize, Word, WorkerIn, WorkerOut } from '../lib/types'

const SR = 16000
const CHUNK_S = 29 // 30 s windows hit a timestamp bug in transformers.js
const post = (m: WorkerOut) => (self as unknown as Worker).postMessage(m)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Asr = (audio: Float32Array, opts: Record<string, unknown>) => Promise<any>

async function loadModel(model: ModelSize): Promise<Asr> {
  const id = `onnx-community/whisper-${model}_timestamped`
  const progress_callback = (p: { status: string; progress?: number }) => {
    if (p.status === 'progress' && typeof p.progress === 'number') post({ type: 'download', progress: p.progress })
  }

  // WebGPU first (fast), then WASM fallbacks (works everywhere, slower)
  const attempts: Record<string, unknown>[] = [
    { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } },
    { device: 'wasm', dtype: 'q8' },
    { device: 'wasm', dtype: 'fp32' },
  ]
  let lastError: unknown
  for (const opts of attempts) {
    if (opts.device === 'webgpu' && !('gpu' in navigator)) continue
    try {
      post({ type: 'status', text: `Loading ${model} model (${opts.device})…` })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await (pipeline as any)('automatic-speech-recognition', id, { ...opts, progress_callback })) as Asr
    } catch (e) {
      lastError = e
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not load the model')
}

/** Pick the quietest 100 ms window near the end of a chunk so we don't cut words in half. */
function quietCut(audio: Float32Array, from: number, to: number): number {
  const win = SR / 10
  let best = to
  let bestE = Infinity
  for (let s = Math.max(0, from); s + win <= to; s += win / 2) {
    let e = 0
    for (let i = s; i < s + win; i++) e += audio[i] * audio[i]
    if (e < bestE) {
      bestE = e
      best = s + win / 2
    }
  }
  return Math.floor(best)
}

const rms = (a: Float32Array) => {
  let e = 0
  for (let i = 0; i < a.length; i += 8) e += a[i] * a[i]
  return Math.sqrt(e / (a.length / 8))
}

self.onmessage = async (e: MessageEvent<WorkerIn>) => {
  try {
    const { audio, model, language } = e.data
    const asr = await loadModel(model)
    post({ type: 'status', text: 'Transcribing…' })

    const words: Word[] = []
    let pos = 0
    while (pos < audio.length) {
      let end = Math.min(pos + CHUNK_S * SR, audio.length)
      if (end < audio.length) end = quietCut(audio, end - 3 * SR, end)
      const slice = audio.subarray(pos, end)

      // skip near-silent chunks: Whisper hallucinates text on silence
      if (slice.length > SR * 0.2 && rms(slice) > 0.002) {
        const out = await asr(slice, {
          return_timestamps: 'word',
          task: 'transcribe',
          ...(language ? { language } : {}),
        })
        const offset = pos / SR
        for (const c of out.chunks ?? []) {
          const text = String(c.text ?? '').trim()
          if (!text) continue
          const [s, en] = c.timestamp as [number, number | null]
          words.push({ text, start: offset + s, end: offset + (en ?? s + 0.3) })
        }
      }
      pos = end
      post({ type: 'progress', value: pos / audio.length })
    }
    post({ type: 'done', words })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
