# Church Live Translator PWA

A first testable demo for a church-focused live translator:

- Afrikaans → English
- English → Afrikaans
- Shows only the translated words
- Visual output limited to 3 lines
- Installable PWA structure
- Online translation first, offline phrase fallback
- Demo test button for browsers without speech recognition

## Run locally

Use any static web server. Example:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the root of the repository.
3. Go to **Settings → Pages**.
4. Select **Deploy from branch**.
5. Select `main` branch and `/root`.
6. Open the GitHub Pages URL.

## Important browser notes

- For speech recognition, test in Google Chrome or Microsoft Edge.
- iPhone/iPad browser support for speech recognition can be limited.
- Offline mode in this demo is a phrase-dictionary fallback only, not full AI translation.
- Full offline Afrikaans/English translation will require a later local AI model phase.

## Test phrases

Afrikaans → English:

- Laat ons bid
- Maak u Bybels oop
- Die Here is goed
- Welkom by die kerk

English → Afrikaans:

- Let us pray
- Open your Bibles
- The Lord is good
- Welcome to church

## Next improvements

- Add proper offline speech-to-text using Whisper WASM or a local model.
- Add a better Afrikaans/English translation engine.
- Add projector mode with remote control.
- Add saved church vocabulary and Bible-book names.
- Add Android/iOS/Huawei packaging using Capacitor.

## Bottom caption bar mode

The demo now includes **Display mode → Bottom caption bar**. This keeps the translation fixed at the bottom of the screen, while the area above can be used for slides, Bible verses, livestream content, or sermon notes.

For projector use, open the app in full screen and select Bottom caption bar.
