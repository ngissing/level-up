# Narration voices

**Which voice is playing?** Look under the explainer's controls. It says either *Recorded voice: en-AU-…* (a Google recording) or *Browser voice: …* (the browser's built-in voice, used when nothing has been recorded).

**Male or female:** an admin chooses this under **Accounts → Settings → Narrator voice**. It applies to:
- browser voices straight away, e.g. "Google UK English Male" in Chrome or "William (Natural)" in Edge
- new recordings: run `npm run voices -- --force` after changing it


Two things in each mini course speak: the explainer on the **Watch** step, and the **Read to me** buttons (on the brief, key words, readings, case studies and quiz questions). There are two ways they can sound.

## 1. Recorded Google voices (best)

`npm run voices` records every narration line and every read-aloud passage once with Google Cloud Text-to-Speech, using its natural Australian voices (Chirp 3 HD where available, then Neural2 or WaveNet). The recordings are saved in `public/audio/` as part of the course, so:

- every student hears the same natural voice on any device or browser
- it plays instantly, even on a slow school network
- nothing is sent to Google while students use the app; Google is only contacted when you run the command

Foundation readers hear the same recording played a little slower.

### One-time setup (about 10 minutes)

1. Go to <https://console.cloud.google.com> and sign in. A school Google Workspace account may have Google Cloud switched off; if so, use a personal account or ask IT.
2. Create a project (e.g. "Level Up voices").
3. **Billing:** Google requires a billing account on the project, even though Text-to-Speech has a free monthly allowance. Check current free limits at <https://cloud.google.com/text-to-speech/pricing>. One mini course uses about 13,000 characters across all three reading levels with read-aloud included (about 1,200 for the explainer alone, using `--explainer-only`). All 32 courses come to roughly 400,000 characters, recorded once.
4. Search for **Cloud Text-to-Speech API** and click **Enable**.
5. Go to **APIs & Services → Credentials → Create credentials → API key**. Edit the key and, under *API restrictions*, restrict it to the Cloud Text-to-Speech API. Keep the key private: don't put it in the project files.

### Make the recordings

In PowerShell, in the project folder:

```powershell
$env:GOOGLE_TTS_API_KEY="paste-your-key-here"
npm run voices
```

On a Mac, use `export GOOGLE_TTS_API_KEY=...` instead of the first line.

- **Hear the options:** run `npm run voices -- --list` to see the Australian voices available, with their gender. You can listen to them at <https://cloud.google.com/text-to-speech> (“Try it”). To use a particular voice:

  ```powershell
  $env:TTS_VOICE="en-AU-Neural2-C"
  npm run voices -- --force
  ```

- **After editing a narration line** (a scene's `say`), run `npm run voices` again. Only new or changed lines are recorded.
- **Just one skill:** `npm run voices -- spot-the-scam`
- **Explainer only** (fewest characters): `npm run voices -- --explainer-only`
- After recording, the **Narrator voice** setting switches to match the recorded voice (male or female), so anything that falls back to the browser voice matches too.
- Refresh the page in the browser afterwards. Recordings don't need an app restart.

If a line hasn't been recorded, the app falls back to the browser's own voice for that line.

## 2. The browser's voice (no setup)

Without recordings, the app uses the best voice the browser offers. It picks neural voices first, then Australian ones.

- **Microsoft Edge** on Windows has free, natural-sounding neural voices, including Australian ones (“Natasha” and “William”, marked *Natural*). They sound far better than the default voices. If your school uses Windows, ask students to open Level Up in Edge.
- **Chrome** has “Google” online voices (British and US English). They're good, but there's no Australian accent.

## Troubleshooting

- **The Watch explainer sounds right, but Read to me buttons don't:** you recorded with `--explainer-only`, or with a version before v0.7.0. Run `npm run voices` again.
- **The voice didn't change after re-recording:** check the label under the player. If it says *Browser voice*, the recordings weren't made. Run `npm run voices` again and look for errors. A key is only remembered in the PowerShell window where you set it, so set it again in a new window.
- **"Set GOOGLE_TTS_API_KEY first":** you haven't set the key in this PowerShell window (see above).
- **"API key not valid" or "has not been used in project":** the Text-to-Speech API isn't enabled for the key's project, or billing isn't set up yet.
