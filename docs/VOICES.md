# Narration voices

The explainer on each skill's **Watch** step is narrated. There are two ways it can sound.

## 1. Recorded Google voices (best)

`npm run voices` records every narration line once with Google Cloud Text-to-Speech, using its natural Australian voices (Chirp 3 HD where available, then Neural2 or WaveNet). The recordings are saved in `public/audio/` as part of the course, so:

- every student hears the same natural voice on any device or browser
- it plays instantly, even on a slow school network
- nothing is sent to Google while students use the app; Google is only contacted when you run the command

Foundation readers hear the same recording played a little slower.

### One-time setup (about 10 minutes)

1. Go to <https://console.cloud.google.com> and sign in. A school Google Workspace account may have Google Cloud switched off; if so, use a personal account or ask IT.
2. Create a project (e.g. "Level Up voices").
3. **Billing:** Google requires a billing account on the project, even though Text-to-Speech has a free monthly allowance. Check current free limits at <https://cloud.google.com/text-to-speech/pricing>. One mini course uses roughly 1,200 characters across all three reading levels, so all 32 courses come to about 40,000 characters.
4. Search for **Cloud Text-to-Speech API** and click **Enable**.
5. Go to **APIs & Services → Credentials → Create credentials → API key**. Edit the key and, under *API restrictions*, restrict it to the Cloud Text-to-Speech API. Keep the key private: don't put it in the project files.

### Make the recordings

In PowerShell, in the project folder:

```powershell
$env:GOOGLE_TTS_API_KEY="paste-your-key-here"
npm run voices
```

On a Mac, use `export GOOGLE_TTS_API_KEY=...` instead of the first line.

- **Hear the options:** run `npm run voices -- --list` to see the Australian voices available. You can listen to them at <https://cloud.google.com/text-to-speech> (“Try it”). To use a particular voice:

  ```powershell
  $env:TTS_VOICE="en-AU-Neural2-C"
  npm run voices -- --force
  ```

- **After editing a narration line** (a scene's `say`), run `npm run voices` again. Only new or changed lines are recorded.
- **Just one skill:** `npm run voices -- spot-the-scam`

If a line hasn't been recorded, the app falls back to the browser's own voice for that line.

## 2. The browser's voice (no setup)

Without recordings, the app uses the best voice the browser offers. It picks neural voices first, then Australian ones.

- **Microsoft Edge** on Windows has free, natural-sounding neural voices, including Australian ones (“Natasha” and “William”, marked *Natural*). They sound far better than the default voices. If your school uses Windows, ask students to open Level Up in Edge.
- **Chrome** has “Google” online voices (British and US English). They're good, but there's no Australian accent.
- Read-aloud buttons on readings and key words always use the browser voice.
