'use strict';

const VERSION = 'v4.1.0';
const $ = id => document.getElementById(id);
const els = {
  appShell:$('appShell'), sourceLang:$('sourceLang'), manualInput:$('manualInput'), translateBtn:$('translateBtn'),
  sampleAfBtn:$('sampleAfBtn'), sampleEnBtn:$('sampleEnBtn'), micCheckBtn:$('micCheckBtn'), startBtn:$('startBtn'), stopBtn:$('stopBtn'),
  speechLang:$('speechLang'), speechTranscript:$('speechTranscript'), speechSupport:$('speechSupport'), micStatus:$('micStatus'),
  translationEngine:$('translationEngine'), pwaStatus:$('pwaStatus'), displayMode:$('displayMode'), lastAction:$('lastAction'),
  captionBar:$('captionBar'), captionMeta:$('captionMeta'), captionText:$('captionText'), serviceModeBtn:$('serviceModeBtn'), exitServiceModeBtn:$('exitServiceModeBtn')
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

const phraseMap = new Map([
  ['laat ons bid',{en:'Let us pray'}], ['kom ons bid',{en:'Let us pray'}], ['goeie more gemeente',{en:'Good morning church'}],
  ['god is liefde',{en:'God is love'}], ['die here is my herder',{en:'The Lord is my shepherd'}],
  ['amen',{en:'Amen',af:'Amen'}], ['mag die Here julle seën',{en:'May the Lord bless you'}],
  ['let us pray',{af:'Laat ons bid'}], ['good morning church',{af:'Goeie more gemeente'}], ['god is love',{af:'God is liefde'}],
  ['the lord is my shepherd',{af:'Die Here is my herder'}], ['may the lord bless you',{af:'Mag die Here julle seën'}]
]);

function setStatus(id, msg){ els[id].textContent = msg; }
function setLast(msg){ els.lastAction.textContent = msg; }
function cleanText(text){ return (text || '').trim().replace(/\s+/g,' '); }
function detectLang(text){
  const t = text.toLowerCase();
  const afHints = [' die ',' en ',' ons ',' here ',' gemeente ',' bid ',' goeie ',' liefde ',' julle ',' seën ',' kom '];
  const enHints = [' the ',' and ',' let ',' pray ',' good ',' morning ',' church ',' lord ',' love ',' bless '];
  const padded = ` ${t} `;
  const af = afHints.reduce((n,w)=>n+(padded.includes(w)?1:0),0);
  const en = enHints.reduce((n,w)=>n+(padded.includes(w)?1:0),0);
  return af >= en ? 'af' : 'en';
}
function targetFor(source){ return source === 'af' ? 'en' : 'af'; }
function limitCaption(text){
  // Hard safety limit. CSS enforces 3 visual lines; this prevents excessive text from flooding the display.
  const words = cleanText(text).split(' ').filter(Boolean);
  return words.slice(0, 34).join(' ');
}
function showCaption(text, meta='Translation'){
  els.captionText.textContent = limitCaption(text) || 'No translation yet';
  els.captionMeta.textContent = meta;
}
function normalizeKey(text){ return cleanText(text).toLowerCase(); }

async function translateLocalFirst(text, chosenSource='auto'){
  const input = cleanText(text);
  if(!input) throw new Error('No text supplied.');
  const source = chosenSource === 'auto' ? detectLang(input) : chosenSource;
  const target = targetFor(source);
  const key = normalizeKey(input);
  const local = phraseMap.get(key);
  if(local && local[target]) return { translated:local[target], source, target, engine:'local phrase pack' };

  // Public fallback for demo only. Production should replace this with a controlled API endpoint.
  try{
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${source}|${target}`;
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if(translated) return { translated, source, target, engine:'public online fallback' };
    throw new Error('No translated text returned.');
  }catch(err){
    return { translated:`[Demo fallback] ${input}`, source, target, engine:`fallback only: ${err.message}` };
  }
}

async function handleTranslate(text){
  const input = cleanText(text || els.manualInput.value);
  setLast('Translating…');
  showCaption('Translating…','Working');
  try{
    const result = await translateLocalFirst(input, els.sourceLang.value);
    showCaption(result.translated, `${result.source.toUpperCase()} → ${result.target.toUpperCase()} · ${result.engine}`);
    setStatus('translationEngine', result.engine);
    setLast('Translation completed');
  }catch(err){
    showCaption('Translation failed. Type text first or check internet access.','Error');
    setLast(err.message);
  }
}

async function checkMicrophone(){
  setStatus('micStatus','Requesting permission…');
  try{
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia not available in this browser/context');
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    stream.getTracks().forEach(track=>track.stop());
    setStatus('micStatus','Permission OK');
    setLast('Microphone permission works');
  }catch(err){
    setStatus('micStatus',`Failed: ${err.name || err.message}`);
    setLast('Microphone failed or permission denied');
  }
}

function createRecognition(){
  if(!SpeechRecognition) return null;
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.lang = els.speechLang.value;
  rec.onstart = () => { listening = true; els.startBtn.disabled = true; els.stopBtn.disabled = false; setLast('Listening…'); showCaption('Listening…','Microphone active'); };
  rec.onerror = e => { setLast(`Speech error: ${e.error}`); els.speechTranscript.textContent = `Speech error: ${e.error}. Try Chrome/Edge and allow microphone.`; };
  rec.onend = () => { listening = false; els.startBtn.disabled = false; els.stopBtn.disabled = true; if(els.lastAction.textContent === 'Listening…') setLast('Listening stopped'); };
  rec.onresult = async event => {
    let interim = ''; let finalText = '';
    for(let i = event.resultIndex; i < event.results.length; i++){
      const txt = event.results[i][0].transcript;
      if(event.results[i].isFinal) finalText += txt; else interim += txt;
    }
    const display = cleanText(finalText || interim);
    if(display) els.speechTranscript.textContent = display;
    if(finalText) await handleTranslate(finalText);
  };
  return rec;
}
function startListening(){
  if(!SpeechRecognition){ setLast('Speech recognition not supported'); showCaption('Speech recognition is not supported in this browser. Use typed translation or Chrome/Edge.','Browser limitation'); return; }
  recognition = createRecognition();
  try{ recognition.start(); }catch(err){ setLast(`Could not start: ${err.message}`); }
}
function stopListening(){ if(recognition && listening) recognition.stop(); }
function toggleServiceMode(){
  document.body.classList.toggle('service-mode');
  const on = document.body.classList.contains('service-mode');
  els.serviceModeBtn.textContent = on ? 'Exit Service Mode' : 'Church Service Mode';
  setStatus('displayMode', on ? 'Church Service Mode' : 'Normal');
}
async function initPwa(){
  if('serviceWorker' in navigator){
    try{ await navigator.serviceWorker.register('./sw.js?v=4.1'); setStatus('pwaStatus','Service worker registered'); }
    catch(err){ setStatus('pwaStatus',`Service worker failed: ${err.message}`); }
  } else setStatus('pwaStatus','Not supported');
}
function init(){
  setStatus('speechSupport', SpeechRecognition ? 'Supported' : 'Not supported');
  if(!SpeechRecognition){ els.startBtn.disabled = true; }
  els.translateBtn.addEventListener('click',()=>handleTranslate());
  els.sampleAfBtn.addEventListener('click',()=>{ els.manualInput.value='Laat ons bid'; els.sourceLang.value='af'; handleTranslate(); });
  els.sampleEnBtn.addEventListener('click',()=>{ els.manualInput.value='Good morning church'; els.sourceLang.value='en'; handleTranslate(); });
  els.micCheckBtn.addEventListener('click',checkMicrophone);
  els.startBtn.addEventListener('click',startListening);
  els.stopBtn.addEventListener('click',stopListening);
  els.serviceModeBtn.addEventListener('click',toggleServiceMode);
  els.exitServiceModeBtn.addEventListener('click',toggleServiceMode);
  document.addEventListener('keydown',e=>{ if(e.key === 'Escape' && document.body.classList.contains('service-mode')) toggleServiceMode(); });
  els.manualInput.addEventListener('keydown',e=>{ if(e.ctrlKey && e.key === 'Enter') handleTranslate(); });
  showCaption('Translation will appear here','Ready');
  setLast(`Ready · ${VERSION}`);
  initPwa();
}
window.addEventListener('load',init);
