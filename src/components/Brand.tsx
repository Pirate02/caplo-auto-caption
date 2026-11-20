export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#ff6b81" />
      <rect x="6" y="9" width="20" height="5" rx="2.5" fill="#1c1f26" />
      <rect x="6" y="18" width="12" height="5" rx="2.5" fill="#ffd60a" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer id="privacy" className="mx-auto mt-10 w-full max-w-6xl border-t border-line px-6 py-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-sm font-bold">Privacy</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
            Your videos never leave this device. Audio is decoded and transcribed in your browser, captions are drawn
            locally, and exports are made on your machine. There are no accounts, no analytics and no caplo server.
            The only network request is the one-time Whisper model download from Hugging Face, which your browser then
            keeps. Your style settings are saved in this browser only.
          </p>
        </div>
        <p className="text-sm text-mute sm:text-right">© 2026 dumzan@caplo. All rights reserved.</p>
      </div>
    </footer>
  )
}
