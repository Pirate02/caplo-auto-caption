import { normalizeWords } from './text'
import type { ModelSize, Word, WorkerIn, WorkerOut } from './types'

export interface TranscribeHandlers {
  onStatus: (text: string) => void
  onDownload: (progress: number) => void
  onProgress: (value: number) => void
}

export function transcribe(
  audio: Float32Array,
  model: ModelSize,
  language: string | null,
  h: TranscribeHandlers,
  signal: AbortSignal,
): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), { type: 'module' })
    const finish = (fn: () => void) => {
      worker.terminate() // frees GPU/WASM memory
      fn()
    }

    signal.addEventListener('abort', () => finish(() => reject(new DOMException('Cancelled', 'AbortError'))))
    worker.onerror = (e) => finish(() => reject(new Error(e.message || 'Worker crashed')))
    worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data
      if (m.type === 'status') h.onStatus(m.text)
      else if (m.type === 'download') h.onDownload(m.progress)
      else if (m.type === 'progress') h.onProgress(m.value)
      else if (m.type === 'done') finish(() => resolve(normalizeWords(m.words)))
      else finish(() => reject(new Error(m.message)))
    }

    const msg: WorkerIn = { type: 'transcribe', audio, model, language }
    worker.postMessage(msg, [audio.buffer])
  })
}
