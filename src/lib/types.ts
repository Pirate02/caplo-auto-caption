export interface Word {
  text: string
  start: number
  end: number
  /** true if the original text ended a sentence (used to break captions) */
  brk?: boolean
}

export interface Cue {
  /** index of the first word in the flat word list */
  first: number
  words: Word[]
  start: number
  /** time the cue disappears (end + short hold, clipped by next cue) */
  until: number
}

export type AnimationId = 'none' | 'pop' | 'fade' | 'slide' | 'bounce'
export type HighlightMode = 'none' | 'color' | 'pill'
export type WordsPerCaption = 1 | 2 | 3 | 4
export type VerticalPosition = 'upper' | 'middle' | 'lower'

export interface CaptionStyle {
  id: string
  name: string
  fontFamily: string
  fontWeight: number
  fill: string
  stroke: string
  /** stroke width as a fraction of font size */
  strokeWidth: number
  activeFill: string
  highlight: HighlightMode
  pillText: string
  activeScale: number
  dimUnspoken: boolean
  shadow: boolean
  box?: string
}

export interface CaptionSettings {
  styleId: string
  animation: AnimationId
  uppercase: boolean
  wordsPerCaption: WordsPerCaption
  /** font size as a fraction of min(width, height) */
  fontScale: number
  /** which third of the frame the caption sits in */
  position: VerticalPosition
  /** overrides the style's highlight color when set */
  activeColor: string | null
}

export type ModelSize = 'tiny' | 'base' | 'small'

export type WorkerIn = {
  type: 'transcribe'
  audio: Float32Array
  model: ModelSize
  language: string | null
}

export type WorkerOut =
  | { type: 'status'; text: string }
  | { type: 'download'; progress: number }
  | { type: 'progress'; value: number }
  | { type: 'done'; words: Word[] }
  | { type: 'error'; message: string }
