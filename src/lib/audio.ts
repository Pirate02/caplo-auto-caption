/**
 * Decodes the audio track of a video/audio file to 16 kHz mono PCM,
 * which is what Whisper expects. Everything stays in the browser.
 */
export async function extractAudio(file: File): Promise<Float32Array> {
  const data = await file.arrayBuffer()
  const ctx = new OfflineAudioContext(1, 1, 16000)
  const audio = await ctx.decodeAudioData(data)
  if (audio.numberOfChannels === 1) return audio.getChannelData(0).slice()

  const out = new Float32Array(audio.length)
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const ch = audio.getChannelData(c)
    for (let i = 0; i < out.length; i++) out[i] += ch[i] / audio.numberOfChannels
  }
  return out
}
