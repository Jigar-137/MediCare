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

// ── TTS Engine ──────────────────────────────────────────────────────────────

let ttsQueue = [];
let isSpeaking = false;

/**
 * isVoiceEnabled() — Reads the global voice toggle from localStorage.
 * Key: 'voice_enabled'  Values: 'true' (default) | 'false'
 */
function isVoiceEnabled() {
  // Default ON if not set
  const stored = localStorage.getItem('voice_enabled');
  return stored !== 'false';
}

function clearTtsQueue() {
  ttsQueue = [];
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isSpeaking = false;
}

function processTtsQueue() {
  if (ttsQueue.length === 0 || isSpeaking) return;
  if (!window.speechSynthesis) return;

  // Gate: voice globally disabled
  if (!isVoiceEnabled()) {
    ttsQueue = [];
    return;
  }

  isSpeaking = true;
  const { text, lang } = ttsQueue.shift();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || getLangCode();
  utterance.rate = 0.9;
  utterance.pitch = 1;

  utterance.onend = () => {
    setTimeout(() => {
      isSpeaking = false;
      processTtsQueue();
    }, 250);
  };

  utterance.onerror = (e) => {
    console.warn('TTS Error:', e);
    isSpeaking = false;
    processTtsQueue();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    isSpeaking = false;
    processTtsQueue();
  }
}

/**
 * speak(text, lang)
 * REMINDER-ONLY voice output.
 * Gated by the global voice_enabled flag — if voice is OFF, does nothing.
 * Do NOT call for UI actions (buttons, navigation, confirmations).
 */
function speak(text, lang) {
  if (!text || !text.trim()) return;
  if (!isVoiceEnabled()) return;         // ← GLOBAL GATE
  ttsQueue.push({ text: text.trim(), lang });
  processTtsQueue();
}

/**
 * speakReminderOnly(text, lang)
 * For medicine/water reminder alerts ONLY.
 * Cancels any in-flight speech, then speaks immediately.
 * Also gated by voice_enabled.
 */
function speakReminderOnly(text, lang) {
  if (!isVoiceEnabled()) return;         // ← GLOBAL GATE
  clearTtsQueue();
  speak(text, lang);
}

// ── Voice Toggle Helper (called from UI) ────────────────────────────────────
window.setVoiceEnabled = function(enabled) {
  localStorage.setItem('voice_enabled', enabled ? 'true' : 'false');
  if (!enabled) clearTtsQueue();
  showToast(`Voice assistant ${enabled ? 'enabled 🔊' : 'disabled 🔇'}`, 'info');

  // Keep the two checkboxes in sync
  const globalToggle = document.getElementById('global-voice-toggle');
  const alertToggle  = document.getElementById('voice-alerts-toggle');
  if (globalToggle) globalToggle.checked = enabled;
  if (alertToggle)  alertToggle.checked  = enabled;
};

// ── Time / schedule helpers ──────────────────────────────────────────────────

function extractTimeInfo(text) {
  let time24h = null;
  let delayMs = null;
  let cleanText = text;

  // Pattern 1: "at 10 pm", "at 22:00"
  let atMatch = text.match(/\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (atMatch) {
    let h = parseInt(atMatch[1], 10);
    let m = parseInt(atMatch[2] || '0', 10);
    let ampm = (atMatch[3] || '').toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    time24h = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    cleanText = text.replace(atMatch[0], '');

    let now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    delayMs = target - now;
  }
  // Pattern 2: "in X hour(s)/minute(s)" or "after X hour(s)/minute(s)"
  else {
    let inMatch = text.match(/\s+(?:in|after)\s+(\d+)\s+(hour|minute)s?/i);
    if (inMatch) {
      let val = parseInt(inMatch[1], 10);
      let unit = inMatch[2].toLowerCase();
      delayMs = val * (unit === 'hour' ? 3600000 : 60000);

      let target = new Date(Date.now() + delayMs);
      time24h = `${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`;
      cleanText = text.replace(inMatch[0], '');
    }
    // Pattern 3: "in the morning", "at night"
    else {
      let todMatch = text.match(/\s+(?:in the morning|this morning|morning)/i);
      if (todMatch) { time24h = '09:00'; cleanText = text.replace(todMatch[0], ''); delayMs = getDelayMs('09:00'); }
      else if (text.match(/\s+(?:at night|tonight|night)/i)) { time24h = '21:00'; cleanText = text.replace(/\s+(?:at night|tonight|night)/i, ''); delayMs = getDelayMs('21:00'); }
      else { time24h = '09:00'; delayMs = getDelayMs('09:00'); } // fallback
    }
  }

  return { time24h, delayMs, cleanText: cleanText.trim() };
}

function getDelayMs(timeStr) {
  let [h, m] = timeStr.split(':').map(Number);
  let now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

// Schedules a one-off general (non-medicine) reminder set via voice
function scheduleGeneralReminder(task, delayMs, timeMsg) {
  setTimeout(() => {
    showToast(`⏰ Reminder: ${task}`, 'info', 8000);
    // Show OS notification if granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('MediCare Reminder ⏰', { body: task });
    }
    // Buzzer
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
    // Voice only if enabled
    speakReminderOnly(`Reminder: ${task}`);
  }, delayMs);

  showToast(`⏰ Reminder set for ${timeMsg}`, 'success');
}

// ── Intent Handler ──────────────────────────────────────────────────────────

async function handleVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  showToast(`🎤 Heard: "${transcript}"`, 'info', 3000);

  // Ensure notification permission
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // ── 1. INTENT: General Reminder ──────────────────────────────────────────
  const remindMatch = lower.match(/^remind me to (.+)/i);
  if (remindMatch && !lower.includes('medicine') && !lower.includes('med ')) {
    const rawTask = remindMatch[1];
    const { time24h, delayMs, cleanText } = extractTimeInfo(' ' + rawTask);
    let timeMsg = time24h;
    let inMatch = lower.match(/(?:in|after)\s+(\d+)\s+(hour|minute)s?/i);
    if (inMatch) timeMsg = inMatch[0].trim().replace('after', 'in');

    scheduleGeneralReminder(cleanText, delayMs || getDelayMs(time24h), timeMsg);
    return;
  }

  // ── 2. INTENT: Add Medicine ───────────────────────────────────────────────
  const addMedPrefix = lower.match(/^(?:add|new|remind me to take) (?:medicine|med|tablet|pill)?\s*(.+)/i) ||
    (lower.startsWith('add ') ? [null, lower.substring(4)] : null);

  if (addMedPrefix && (lower.includes('medicine') || lower.includes('med ') || lower.startsWith('add '))) {
    let rawInput = addMedPrefix[1];
    if (rawInput.startsWith('medicine ')) rawInput = rawInput.substring(9);

    const { time24h, cleanText } = extractTimeInfo(' ' + rawInput);
    const name = cleanText;

    if (name.length > 0) {
      // No voice — show toast as written confirmation instead
      showToast(`💊 Saving medicine: ${name}…`, 'info');

      try {
        await apiFetch('/api/medicines', {
          method: 'POST',
          body: JSON.stringify({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            dosage: '1 pill', time: time24h, frequency: 'daily',
            notes: 'Added via voice'
          })
        });

        // Written feedback — NO voice for UI actions
        showToast(`✅ ${name} saved for ${time24h}!`, 'success');

        if (typeof navigateTo === 'function') navigateTo('medicines');
        if (typeof loadMedicines === 'function') setTimeout(loadMedicines, 300);
      } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
      }
      return;
    }
  }

  // ── 3. INTENT: Check Symptoms ─────────────────────────────────────────────
  const symptomMatch = lower.match(/(?:i have|my symptoms are|check symptoms for) (.+)/i);
  if (symptomMatch) {
    let symptomsStr = symptomMatch[1]
      .replace(/^(a|an|some|severe|mild)\s+/gi, '')
      .replace(/ and /g, ',')
      .replace(/\.$/, '');
    let symptomsArr = symptomsStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s);

    if (symptomsArr.length > 0) {
      showToast('🩺 Checking symptoms…', 'info');
      if (typeof navigateTo === 'function') navigateTo('symptoms');
      if (typeof window.setSymptomsFromVoice === 'function') window.setSymptomsFromVoice(symptomsArr);

      try {
        const data = await apiFetch('/api/symptoms/check', {
          method: 'POST',
          body: JSON.stringify({ symptoms: symptomsArr })
        });
        if (typeof renderSymptomResults === 'function') {
          setTimeout(() => renderSymptomResults(data), 500);
        }
        // Show advice as toast — NO voice for symptom results
        if (data.generalAdvice) showToast(`🩺 ${data.generalAdvice}`, 'info', 6000);
      } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
      }
      return;
    }
  }

  // ── 4. INTENT: Navigation (silent — toast only) ───────────────────────────
  if (lower.includes('medicine') || lower.includes('दवा') || lower.includes('દવા')) {
    navigateTo('medicines');
    showToast('💊 Opening Medicines', 'info', 2000);
  } else if (lower.includes('appointment') || lower.includes('अपॉइंटमेंट') || lower.includes('મુલાકાત')) {
    navigateTo('appointments');
    showToast('📅 Opening Appointments', 'info', 2000);
  } else if (lower.includes('symptom') || lower.includes('लक्षण') || lower.includes('લક્ષણ')) {
    navigateTo('symptoms');
    showToast('🩺 Opening Symptom Checker', 'info', 2000);
  } else if (lower.includes('fitness') || lower.includes('फिटनेस') || lower.includes('ફિટ')) {
    navigateTo('fitness');
    showToast('🏃 Opening Fitness Tracker', 'info', 2000);
  } else if (lower.includes('profile') || lower.includes('प्रोफाइल') || lower.includes('પ્રોફ')) {
    navigateTo('profile');
    showToast('👤 Opening Profile', 'info', 2000);
  } else if (lower.includes('home') || lower.includes('dashboard')) {
    navigateTo('home');
    showToast('🏠 Going to Dashboard', 'info', 2000);
  } else {
    if (typeof window.pipeToAI === 'function') {
      window.pipeToAI(transcript);
    } else {
      showToast('Command not understood. Try: "add medicine" or "check symptoms"', 'warning');
    }
  }
}
