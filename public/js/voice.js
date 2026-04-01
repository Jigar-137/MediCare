// ── Voice Module: Speech Recognition + TTS ──
let recognition = null;
let isListening = false;
let voiceCallback = null;

function initVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = true;
  r.lang = getLangCode();
  return r;
}

function getLangCode() {
  const lang = localStorage.getItem('medicare_lang') || 'en';
  return { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' }[lang] || 'en-IN';
}

function toggleVoice() {
  isListening ? stopVoice() : startVoice();
}

function startVoice(callback) {
  recognition = initVoice();
  if (!recognition) {
    showToast('Voice recognition not supported in this browser', 'warning');
    return;
  }
  voiceCallback = callback || handleVoiceCommand;
  isListening = true;

  const bar = document.getElementById('voice-bar');
  const micBtn = document.getElementById('mic-btn');
  if (bar) bar.style.display = 'flex';
  if (micBtn) micBtn.classList.add('active');

  recognition.lang = getLangCode();
  recognition.start();

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    const el = document.getElementById('voice-transcript');
    if (el) el.textContent = transcript;
  };

  recognition.onend = () => {
    const transcript = document.getElementById('voice-transcript')?.textContent || '';
    if (transcript && transcript !== 'Say something…') {
      if (voiceCallback) voiceCallback(transcript);
    }
    stopVoice();
  };

  recognition.onerror = (e) => {
    showToast('Voice error: ' + e.error, 'error');
    stopVoice();
  };
}

function stopVoice() {
  isListening = false;
  if (recognition) { try { recognition.stop(); } catch {} }
  const bar = document.getElementById('voice-bar');
  const micBtn = document.getElementById('mic-btn');
  if (bar) bar.style.display = 'none';
  if (micBtn) micBtn.classList.remove('active');
  const el = document.getElementById('voice-transcript');
  if (el) el.textContent = 'Say something…';
}

function speak(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || getLangCode();
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function handleVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  showToast(`🎤 Heard: "${transcript}"`, 'info', 3000);

  // Navigate commands
  if (lower.includes('medicine') || lower.includes('दवा') || lower.includes('દવા')) {
    navigateTo('medicines');
    speak('Opening medicines section');
  } else if (lower.includes('appointment') || lower.includes('अपॉइंटमेंट') || lower.includes('મુલાકાત')) {
    navigateTo('appointments');
    speak('Opening appointments section');
  } else if (lower.includes('symptom') || lower.includes('लक्षण') || lower.includes('લક્ષણ')) {
    navigateTo('symptoms');
    speak('Opening symptom checker');
  } else if (lower.includes('fitness') || lower.includes('फिटनेस') || lower.includes('ફિટ')) {
    navigateTo('fitness');
    speak('Opening fitness tracker');
  } else if (lower.includes('profile') || lower.includes('प्रोफाइल') || lower.includes('પ્રોફ')) {
    navigateTo('profile');
    speak('Opening your profile');
  } else if (lower.includes('home') || lower.includes('dashboard')) {
    navigateTo('home');
    speak('Going to dashboard');
  } else {
    // Try to parse "add medicine [name] at [time]"
    const medMatch = lower.match(/add (?:medicine|med|tablet)?\s*(.+?)(?:\s+at\s+(\d+(?::\d+)?\s*(?:am|pm)?))?\s*$/i);
    if (medMatch) {
      const name = medMatch[1]?.replace(/\s+at.*/, '').trim();
      const time = medMatch[2]?.trim();
      navigateTo('medicines');
      if (name) {
        const nameInput = document.getElementById('med-name');
        if (nameInput) nameInput.value = name.charAt(0).toUpperCase() + name.slice(1);
      }
      speak('Opening medicine form. ' + (name ? 'I filled in ' + name : ''));
      showToast('Medicine form pre-filled from voice!', 'success');
    } else {
      speak('Command not recognised. Try saying open medicines or add medicine.');
      showToast('Command not understood. Try "open medicines" or "check symptoms"', 'warning');
    }
  }
}
