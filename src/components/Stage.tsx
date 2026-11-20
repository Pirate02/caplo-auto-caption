import { useEffect, useRef } from 'react'
import { drawCaptions } from '../lib/render'
import type { CaptionSettings, CaptionStyle, Cue } from '../lib/types'

interface Props {
  url: string
  cues: Cue[]
  settings: CaptionSettings
  style: CaptionStyle
  videoRef: React.RefObject<HTMLVideoElement | null>
  onTime: (t: number) => void
}

/** Video with a transparent canvas on top that draws the live captions. */
export function Stage({ url, cues, settings, style, videoRef, onTime }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // latest values for the render loop, without restarting it on every change
  const live = useRef({ cues, settings, style })
  live.current = { cues, settings, style }

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const v = videoRef.current
      const c = canvasRef.current
      if (v && c && v.videoWidth) {
        const k = Math.min(1, 1920 / Math.max(v.videoWidth, v.videoHeight))
        const w = Math.round(v.videoWidth * k)
        const h = Math.round(v.videoHeight * k)
        if (c.width !== w || c.height !== h) {
          c.width = w
          c.height = h
        }
        const ctx = c.getContext('2d')!
        ctx.clearRect(0, 0, w, h)
        const { cues, settings, style } = live.current
        drawCaptions(ctx, w, h, v.currentTime, cues, settings, style)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [videoRef])

  return (
    <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={url}
        controls
        playsInline
        onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
        className="block max-h-[72vh] max-w-full"
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
}
