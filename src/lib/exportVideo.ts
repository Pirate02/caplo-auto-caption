import { drawCaptions } from './render'
import type { CaptionSettings, CaptionStyle, Cue } from './types'

const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.640028,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm',
]

interface Options {
  file: File
  cues: Cue[]
  settings: CaptionSettings
  style: CaptionStyle
  onProgress: (value: number) => void
  signal: AbortSignal
}

/**
 * Burns captions into the video by playing it through a canvas and recording
 * the result. Runs in real time, so keep the tab visible while it works.
 */
export async function exportVideo({ file, cues, settings, style, onProgress, signal }: Options) {
  const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))
  if (!mimeType) throw new Error('This browser cannot record video. Try Chrome.')

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.playsInline = true
  video.preload = 'auto'
  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res()
    video.onerror = () => rej(new Error('Could not read the video'))
  })

  // cap long edge at 1920 and keep dimensions even
  const k = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight))
  const w = Math.round((video.videoWidth * k) / 2) * 2
  const h = Math.round((video.videoHeight * k) / 2) * 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // route audio into the recording only (nothing plays out loud)
  const audioCtx = new AudioContext()
  const dest = audioCtx.createMediaStreamDestination()
  audioCtx.createMediaElementSource(video).connect(dest)
  await audioCtx.resume()

  const stream = canvas.captureStream(30)
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)

  const cleanup = () => {
    video.pause()
    audioCtx.close()
    URL.revokeObjectURL(url)
  }

  return new Promise<{ blob: Blob; ext: string }>((resolve, reject) => {
    let raf = 0
    const draw = () => {
      ctx.drawImage(video, 0, 0, w, h)
      drawCaptions(ctx, w, h, video.currentTime, cues, settings, style)
      onProgress(video.currentTime / video.duration)
      if (!video.ended) raf = requestAnimationFrame(draw)
    }

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf)
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      cleanup()
      reject(new DOMException('Cancelled', 'AbortError'))
    })

    video.onended = () => {
      cancelAnimationFrame(raf)
      draw()
      // give the recorder a beat to flush the last frames
      setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 300)
    }
    recorder.onstop = () => {
      cleanup()
      resolve({ blob: new Blob(chunks, { type: mimeType }), ext: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm' })
    }

    recorder.start(1000)
    video.play().then(draw).catch((e) => {
      cleanup()
      reject(e)
    })
  })
}
