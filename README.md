# caplo

Private auto-captions for shorts and long videos. Drop a video, get word-timed captions, pick a style, export.

Everything runs in your browser. Speech recognition is Whisper (via transformers.js), captions are drawn on a canvas, and the export is recorded locally. Your video is never uploaded.

## What you can do

- Auto-transcribe with word-level timing (Tiny, Base or Small Whisper model)
- 6 caption styles: Bold Pop, Marker, Karaoke, Comic, Clean, Boxed
- Words per caption: 1, 2, 3 or 4 (default 3)
- UPPERCASE or as spoken
- Animations: none, pop, fade, slide, bounce
- Position: upper third, middle or lower third
- Size and highlight color
- Fix any caption inline (click the time to jump to it, press Enter to save)
- Export a video with captions burned in, or an `.srt` file

Punctuation is removed from captions automatically.

## Requirements

| Thing | Needed |
| --- | --- |
| Node.js | 22 LTS recommended (20.19 or newer works) |
| Package manager | pnpm (npm or yarn also work) |
| Browser | Chrome or Edge, recent version (best choice) |
| Disk | about 500 MB free for the model cache if you use Small |
| Internet | only for installing and for the first model download |

## Setup

### macOS

1. Install Node. Easiest with Homebrew:

   ```bash
   brew install node
   ```

2. Enable pnpm:

   ```bash
   corepack enable
   ```

   If that says permission denied, run `npm install -g pnpm` instead.

3. Unpack and run:

   ```bash
   tar xzf caplo.tar.gz
   cd caplo
   pnpm install
   pnpm dev
   ```

4. Open the URL it prints (usually http://localhost:5173) in Chrome.

### Windows

1. Install Node 22 LTS from https://nodejs.org (the installer is fine) or with winget:

   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

2. Open a new PowerShell window and enable pnpm:

   ```powershell
   corepack enable
   ```

   If that fails, run PowerShell as Administrator, or use `npm install -g pnpm`.

3. Unpack the archive. Windows 10 and 11 include `tar`:

   ```powershell
   tar xzf caplo.tar.gz
   cd caplo
   pnpm install
   pnpm dev
   ```

   Or right-click the archive and extract it with 7-Zip, then `cd` into the folder.

4. Open http://localhost:5173 in Chrome or Edge.

If PowerShell blocks scripts ("running scripts is disabled"), run this once and retry:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Linux

1. Install Node 22 LTS. Distro packages are often old, so use your distro's NodeSource setup, `nvm`, or `fnm`. With nvm:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   # restart the terminal, then:
   nvm install 22
   ```

2. Enable pnpm:

   ```bash
   corepack enable
   ```

3. Unpack and run:

   ```bash
   tar xzf caplo.tar.gz
   cd caplo
   pnpm install
   pnpm dev
   ```

4. Open http://localhost:5173 in Chrome, Chromium or Edge.

   WebGPU on Linux is often off by default. Without it caplo still works through the slower WASM fallback.

## Using it

1. **Drop a video** on the start screen, or click to choose one. Shorts and long videos both work.
2. **Transcribe.** Pick a model and language, then press Generate captions.
   - Tiny: fastest, roughest (about 40 MB)
   - Base: good balance, the default (about 150 MB)
   - Small: most accurate, slowest (about 480 MB)

   The first run downloads the model. After that your browser keeps it.
3. **Style it.** Choose a style, words per caption, case, animation, size, position and highlight color. The preview updates live.
4. **Fix mistakes** in the Edit captions list under the video.
5. **Export.**
   - Video with captions: plays the video through a canvas and records it. It runs in real time, so a 60 second short takes about 60 seconds. Keep the tab visible while it renders.
   - .srt: instant subtitle file.

The finished video is saved as `.mp4` when your browser can record MP4 (recent Chrome and Edge), otherwise `.webm`.

## Run it as a built app

To serve a production build on your own machine:

```bash
pnpm build
pnpm preview
```

`pnpm build` also type-checks the code. The `dist/` folder is a static site you can host anywhere, but remember the model still downloads from Hugging Face on first use.

## Troubleshooting

**It is slow or the fan spins up.** Your browser probably has no WebGPU, so Whisper runs on the CPU. Use Chrome or Edge, update it, and try the Tiny or Base model. You can check support at `chrome://gpu`.

**Model download fails or stalls.** The first run needs a connection to Hugging Face. Check your network, VPN or firewall, then press Generate captions again.

**"No speech found".** The file has no audio track, or the audio is very quiet. Try another file.

**Wrong or garbled words.** Choose the language manually instead of Auto-detect, or switch to the Small model. Whisper is weaker on Nepali than on English or Hindi.

**Export has no sound or is not MP4.** Use recent Chrome or Edge. Other browsers may save `.webm` or lack video recording.

**Export stops or stutters.** Keep the tab in the foreground. Browsers slow down hidden tabs.

**Very long videos run out of memory.** The whole audio track is decoded in memory. Around an hour is fine on most machines. Beyond that, split the video first.

**Captions look wrong right after loading.** Reload once. Fonts are bundled, but the first frame can draw before they finish loading.

**`pnpm: command not found`.** Run `corepack enable`, or `npm install -g pnpm`, then open a new terminal.

**Node version errors on install or dev.** Run `node -v`. Anything below 20.19 needs an upgrade.

**Port already in use.** Vite picks the next free port and prints it. Use the URL it shows.

## Privacy

- Video, audio and captions stay on your device.
- No accounts, no analytics, no caplo server.
- The only network request is the one-time Whisper model download from Hugging Face. The browser caches it.
- Style settings are saved in your browser's local storage. Clearing site data resets them.

## Project layout

```
src/
  App.tsx                   page, state, wiring
  components/
    Landing.tsx             start screen and animated headline
    Stage.tsx               video plus live caption canvas
    TranscriptList.tsx      caption editor
    Brand.tsx               logo and footer
    ui.tsx                  small shared controls
  lib/
    text.ts                 punctuation removal
    cues.ts                 words into captions (N words, pauses, sentence breaks)
    styles.ts               style presets and position values
    render.ts               canvas drawing, shared by preview and export
    exportVideo.ts          canvas plus MediaRecorder export
    audio.ts                decode audio to 16 kHz mono
    transcribe.ts           talks to the worker
    srt.ts                  .srt output
  workers/
    whisper.worker.ts       Whisper with word timestamps, chunked, with progress
```

## Customizing

**Add a style.** Add an entry to `STYLES` in `src/lib/styles.ts`. Fonts come from `@fontsource` packages: install one (`pnpm add @fontsource/your-font`) and import its CSS in `src/main.tsx`.

**Change defaults** (words per caption, size, animation, position) in `DEFAULT_SETTINGS` in the same file. Saved browser settings override defaults, so clear site data to see a change.

**Tune caption timing.** `MAX_GAP` and `HOLD` at the top of `src/lib/cues.ts` control when a pause starts a new caption and how long a caption lingers.

**Change models.** Model ids are built in `src/workers/whisper.worker.ts` as `onnx-community/whisper-<size>_timestamped`.

## Known limits

- Export is real time and needs the tab visible.
- Chunking is 29 seconds per Whisper pass, cut at the quietest nearby moment.
- If you edit a caption so its word count changes, word timing inside it is spread evenly.

© 2026 dumzan@caplo. All rights reserved.
