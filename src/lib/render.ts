import { POSITION_Y } from './styles'
import type { CaptionSettings, CaptionStyle, Cue } from './types'

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)
const easeOutBack = (p: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}
const easeOutBounce = (p: number) => {
  const n = 7.5625
  const d = 2.75
  if (p < 1 / d) return n * p * p
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375
  return n * (p -= 2.625 / d) * p + 0.984375
}

/** Binary search for the cue visible at time t (or -1). */
export function findCue(cues: Cue[], t: number): number {
  let lo = 0
  let hi = cues.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cues[mid].start <= t) {
      ans = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return ans >= 0 && t < cues[ans].until ? ans : -1
}

/**
 * Draws the caption for time `t`. The same function powers the live preview
 * and the exported video, so what you see is what you get.
 */
export function drawCaptions(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  cues: Cue[],
  s: CaptionSettings,
  style: CaptionStyle,
) {
  const idx = findCue(cues, t)
  if (idx < 0) return
  const cue = cues[idx]

  const size = Math.min(w, h) * s.fontScale
  ctx.save()
  ctx.font = `${style.fontWeight} ${size}px "${style.fontFamily}", sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2

  const words = cue.words.map((x) => (s.uppercase ? x.text.toUpperCase() : x.text))
  const widths = words.map((x) => ctx.measureText(x).width)
  const space = ctx.measureText(' ').width

  // greedy line wrap so long words never run off-screen
  const maxW = w * 0.88
  const lines: number[][] = [[]]
  let lineW = 0
  words.forEach((_, i) => {
    const line = lines[lines.length - 1]
    const add = (line.length ? space : 0) + widths[i]
    if (line.length && lineW + add > maxW) {
      lines.push([i])
      lineW = widths[i]
    } else {
      line.push(i)
      lineW += add
    }
  })

  const lineH = size * 1.18
  const blockH = lineH * lines.length
  const lineWidths = lines.map((l) => l.reduce((a, i) => a + widths[i], 0) + space * (l.length - 1))

  let active = 0
  for (let i = 0; i < cue.words.length; i++) if (cue.words[i].start <= t) active = i

  // entrance animation
  const age = t - cue.start
  let scale = 1
  let alpha = 1
  let dy = 0
  switch (s.animation) {
    case 'pop': {
      const p = clamp(age / 0.18)
      scale = 0.6 + 0.4 * easeOutBack(p)
      alpha = clamp(p * 3)
      break
    }
    case 'fade':
      alpha = clamp(age / 0.15)
      break
    case 'slide': {
      const p = clamp(age / 0.2)
      dy = (1 - easeOutCubic(p)) * size * 0.7
      alpha = clamp(p * 2)
      break
    }
    case 'bounce': {
      const p = clamp(age / 0.4)
      dy = -(1 - easeOutBounce(p)) * size * 1.2
      alpha = clamp(age / 0.08)
      break
    }
  }

  ctx.translate(w / 2, h * (POSITION_Y[s.position] ?? POSITION_Y.lower) + dy)
  ctx.scale(scale, scale)

  if (style.box) {
    const padX = size * 0.35
    const padY = size * 0.22
    const bw = Math.max(...lineWidths) + padX * 2
    ctx.globalAlpha = alpha
    ctx.fillStyle = style.box
    ctx.beginPath()
    ctx.roundRect(-bw / 2, -blockH / 2 - padY, bw, blockH + padY * 2, size * 0.28)
    ctx.fill()
  }

  const activeColor = s.activeColor ?? style.activeFill

  lines.forEach((idxs, li) => {
    let x = -lineWidths[li] / 2
    const y = -blockH / 2 + lineH * (li + 0.5)
    for (const i of idxs) {
      const isActive = i === active
      ctx.save()
      ctx.translate(x + widths[i] / 2, y)
      if (isActive && style.activeScale !== 1) ctx.scale(style.activeScale, style.activeScale)
      ctx.globalAlpha = alpha * (style.dimUnspoken && i > active ? 0.5 : 1)

      if (isActive && style.highlight === 'pill') {
        ctx.fillStyle = activeColor
        ctx.beginPath()
        ctx.roundRect(-widths[i] / 2 - size * 0.22, -size * 0.58, widths[i] + size * 0.44, size * 1.16, size * 0.22)
        ctx.fill()
      }

      let fill = style.fill
      if (isActive && style.highlight === 'pill') fill = style.pillText
      else if (isActive && style.highlight === 'color') fill = activeColor

      const hasStroke = style.strokeWidth > 0
      const showShadow = style.shadow && !(isActive && style.highlight === 'pill')
      if (hasStroke) {
        ctx.lineWidth = size * style.strokeWidth
        ctx.strokeStyle = style.stroke
        if (showShadow) setShadow(ctx, size)
        ctx.strokeText(words[i], -widths[i] / 2, 0)
        ctx.shadowColor = 'transparent'
      }
      ctx.fillStyle = fill
      if (showShadow && !hasStroke) setShadow(ctx, size)
      ctx.fillText(words[i], -widths[i] / 2, 0)
      ctx.restore()
      x += widths[i] + space
    }
  })

  ctx.restore()
}

function setShadow(ctx: CanvasRenderingContext2D, size: number) {
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = size * 0.12
  ctx.shadowOffsetY = size * 0.05
}
