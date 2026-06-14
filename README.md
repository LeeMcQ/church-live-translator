# Church Live Translator v4.1 MVP

Afrikaans ↔ English church caption translator PWA.

## What v4 adds

- Typed translation test first, so you can prove translation works before microphone testing.
- Bottom caption bar fixed to the bottom of the screen.
- Church Service Mode: hides controls and leaves only the presentation area plus captions.
- Microphone permission test.
- Speech-recognition diagnostics.
- PWA service worker with versioned cache for GitHub Pages.
- API-ready translation adapter in `app.js`.

## Important technical note

This is still an MVP. Browser speech recognition is not consistently available on every browser. Use Chrome or Edge for the first test. The built-in online fallback uses a public demo endpoint and should be replaced with a proper paid API before real church use.

## Least-step GitHub Pages update

1. Delete the old files in your GitHub repository.
2. Upload all files from this folder.
3. Commit changes.
4. Open:

```text
https://leemcq.github.io/church-live-translator/?v=4.1
```

## Test sequence

1. Type `Laat ons bid` and click `Translate typed text`.
2. Type `Good morning church` and click `Translate typed text`.
3. Click `Check microphone` and allow permission.
4. Select `Afrikaans (South Africa)` and click `Start listening`.
5. Speak clearly: `Laat ons bid`.
6. Click `Church Service Mode` to confirm bottom caption operation.

## Production improvement path

- Replace public translation fallback with a controlled API such as Google Cloud, Azure Translator, DeepL, or a private backend.
- Add authenticated API-key protection server-side, not in browser JavaScript.
- Add offline speech-to-text proof of concept using Whisper/WebGPU/WASM.
- Add OBS/projector overlay mode.


## v4.1 release-gate fixes
- Service Mode can now be exited using the visible Exit button or Escape key.
- Body-level service-mode class now applies correctly to the caption bar.
- Microphone check now reports unsupported browser/context cleanly.
- Speech Start is disabled where browser speech recognition is unavailable.
