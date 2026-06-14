const els = {};
let recognition = null;
let listening = false;
let deferredInstallPrompt = null;

const phraseDictionary = {
  'af-en': {
    'amen': 'Amen',
    'goeie more': 'Good morning',
    'goeie middag': 'Good afternoon',
    'goeie aand': 'Good evening',
    'laat ons bid': 'Let us pray',
    'ons gaan bid': 'We are going to pray',
    'maak u bybels oop': 'Open your Bibles',
    'kom ons sing': 'Let us sing',
    'die here is goed': 'The Lord is good',
    'god is liefde': 'God is love',
    'jesus kom weer': 'Jesus is coming again',
    'dankie here': 'Thank You Lord',
    'genade en vrede': 'Grace and peace',
    'welkom by die kerk': 'Welcome to church',
    'die woord van god': 'The Word of God'
  },
  'en-af': {
    'amen': 'Amen',
    'good morning': 'Goeie more',
    'good afternoon': 'Goeie middag',
    'good evening': 'Goeie aand',
    'let us pray': 'Laat ons bid',
    'we are going to pray': 'Ons gaan bid',
    'open your bibles': 'Maak u Bybels oop',
    'let us sing': 'Kom ons sing',
    'the lord is good': 'Die Here is goed',
    'god is love': 'God is liefde',
    'jesus is coming again': 'Jesus kom weer',
    'thank you lord': 'Dankie Here',
    'grace and peace': 'Genade en vrede',
    'welcome to church': 'Welkom by die kerk',
    'the word of god': 'Die Woord van God'
  }
};

function normalise(text) {
  return String(text || '').toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}

function limitToThreeLines(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  const maxWords = 24;
  return words.slice(0, maxWords).join(' ');
}

function offlineTranslate(text, direction) {
  const clean = normalise(text);
  const dictionary = phraseDictionary[direction] || {};
  if (dictionary[clean]) return dictionary[clean];
  const partial = Object.keys(dictionary).find(key => clean.includes(key));
  if (partial) return dictionary[partial];
  return `[offline demo] ${text}`;
}

async function onlineTranslate(text, direction) {
  const langpair = direction === 'af-en' ? 'af|en' : 'en|af';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error(`Translation service error: ${response.status}`);
  const data = await response.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error('No translation returned');
  return translated;
}

async function translate(text) {
  const direction = els.directionSelect.value;
  els.heardText.textContent = text;
  if (els.modeSelect.value === 'offline') {
    els.engineStatus.textContent = 'Offline phrase demo';
    return offlineTranslate(text, direction);
  }
  try {
    els.engineStatus.textContent = 'Online translation';
    return await onlineTranslate(text, direction);
  } catch (error) {
    els.engineStatus.textContent = `Offline fallback (${error.message})`;
    return offlineTranslate(text, direction);
  }
}

function setOutput(text) {
  els.translatedOutput.textContent = limitToThreeLines(text);
}

async function handleTranscript(text) {
  if (!text.trim()) return;
  const translated = await translate(text);
  setOutput(translated);
}

function createRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = els.directionSelect.value === 'af-en' ? 'af-ZA' : 'en-ZA';
  rec.onresult = event => {
    const last = event.results[event.results.length - 1];
    if (last && last[0]) handleTranscript(last[0].transcript);
  };
  rec.onerror = event => {
    els.engineStatus.textContent = `Speech error: ${event.error}`;
    stopListening(false);
  };
  rec.onend = () => {
    if (listening) {
      try { rec.start(); } catch (_) { stopListening(false); }
    }
  };
  return rec;
}

function startListening() {
  recognition = createRecognition();
  if (!recognition) {
    els.supportStatus.textContent = 'Speech recognition not available in this browser. Use Chrome/Edge or Run Demo Test.';
    return;
  }
  listening = true;
  els.startBtn.disabled = true;
  els.stopBtn.disabled = false;
  els.engineStatus.textContent = 'Listening';
  recognition.start();
}

function stopListening(updateStatus = true) {
  listening = false;
  els.startBtn.disabled = false;
  els.stopBtn.disabled = true;
  if (recognition) recognition.stop();
  if (updateStatus) els.engineStatus.textContent = 'Stopped';
}

async function runDemoTest() {
  const direction = els.directionSelect.value;
  const sample = direction === 'af-en' ? 'Laat ons bid' : 'Let us pray';
  await handleTranscript(sample);
}

function bindUi() {
  ['supportStatus','installBtn','directionSelect','modeSelect','sizeSlider','displayModeSelect','startBtn','stopBtn','testBtn','clearBtn','translatedOutput','heardText','engineStatus']
    .forEach(id => { els[id] = document.getElementById(id); });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  els.supportStatus.textContent = SpeechRecognition
    ? 'Speech recognition available. For best results use Chrome or Edge with a good microphone.'
    : 'Speech recognition not available here. Demo Test still works.';

  els.startBtn.addEventListener('click', startListening);
  els.stopBtn.addEventListener('click', () => stopListening(true));
  els.testBtn.addEventListener('click', runDemoTest);
  els.clearBtn.addEventListener('click', () => { setOutput('Ready'); els.heardText.textContent = '—'; els.engineStatus.textContent = 'Idle'; });
  els.directionSelect.addEventListener('change', () => { if (listening) { stopListening(); startListening(); } });
  els.sizeSlider.addEventListener('input', () => document.documentElement.style.setProperty('--output-size', `${els.sizeSlider.value}px`));
  els.displayModeSelect.addEventListener('change', () => {
    document.body.classList.toggle('bottom-caption-mode', els.displayModeSelect.value === 'bottom');
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.classList.remove('hidden');
  });
  els.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installBtn.classList.add('hidden');
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

document.addEventListener('DOMContentLoaded', bindUi);

window.__translatorTestApi = { normalise, limitToThreeLines, offlineTranslate };
