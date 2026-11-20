import type { CaptionSettings, CaptionStyle, VerticalPosition } from './types'

/** vertical center of each third of the frame (0 = top, 1 = bottom) */
export const POSITION_Y: Record<VerticalPosition, number> = { upper: 0.17, middle: 0.5, lower: 0.8 }

const base = {
  strokeWidth: 0,
  stroke: '#000',
  pillText: '#111',
  activeScale: 1,
  dimUnspoken: false,
  shadow: true,
}

export const STYLES: CaptionStyle[] = [
  { ...base, id: 'bold-pop', name: 'Bold Pop', fontFamily: 'Montserrat', fontWeight: 800, fill: '#ffffff', strokeWidth: 0.16, activeFill: '#ffd60a', highlight: 'color', activeScale: 1.08 },
  { ...base, id: 'marker', name: 'Marker', fontFamily: 'Montserrat', fontWeight: 800, fill: '#ffffff', activeFill: '#ffe600', highlight: 'pill', activeScale: 1.04 },
  { ...base, id: 'karaoke', name: 'Karaoke', fontFamily: 'Anton', fontWeight: 400, fill: '#ffffff', strokeWidth: 0.1, activeFill: '#2bd9ff', highlight: 'color', dimUnspoken: true },
  { ...base, id: 'comic', name: 'Comic', fontFamily: 'Bangers', fontWeight: 400, fill: '#ffffff', strokeWidth: 0.14, activeFill: '#ff4d6d', highlight: 'color', activeScale: 1.12 },
  { ...base, id: 'clean', name: 'Clean', fontFamily: 'DM Sans', fontWeight: 700, fill: '#ffffff', activeFill: '#ffffff', highlight: 'none' },
  { ...base, id: 'box', name: 'Boxed', fontFamily: 'DM Sans', fontWeight: 700, fill: '#ffffff', activeFill: '#ffd60a', highlight: 'color', shadow: false, box: 'rgba(0,0,0,0.72)' },
]

export const DEFAULT_SETTINGS: CaptionSettings = {
  styleId: 'bold-pop',
  animation: 'pop',
  uppercase: true,
  wordsPerCaption: 3,
  fontScale: 0.085,
  position: 'lower',
  activeColor: null,
}

export const getStyle = (id: string): CaptionStyle => STYLES.find((s) => s.id === id) ?? STYLES[0]
