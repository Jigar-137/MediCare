// ── Smart Health AI Engine (`ai.js`) ──

// Dynamic username — reads from auth data stored at login; never hardcoded
function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem('medicare_user') || '{}');
    return (user.name && user.name.trim()) ? user.name.trim().split(' ')[0] : 'User';
  } catch { return 'User'; }
}

// ── UI Interactions ──
function toggleAIPanel() {
  const panel = document.getElementById('ai-floating-panel');
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'flex';
    if (!document.getElementById('ai-chat-content').innerHTML.trim()) {
      showSmartGreeting();
    }
  } else {
    panel.style.display = 'none';
  }
}

function closeAIPanel() {
  document.getElementById('ai-floating-panel').style.display = 'none';
}

function appendAIMessage(sender, message) {
  const content = document.getElementById('ai-chat-content');
  const div = document.createElement('div');
  div.className = `ai-msg ${sender === 'ai' ? 'ai-bubble' : 'user-bubble'}`;
  div.innerHTML = message;
  content.appendChild(div);
  content.scrollTop = content.scrollHeight;
}

function showSmartGreeting() {
  const h = new Date().getHours();
  let greeting = 'Good morning';
  if (h >= 12 && h < 17) greeting = 'Good afternoon';
  else if (h >= 17) greeting = 'Good evening';
  const name = getUserName();
  const msg = `👋 ${greeting} ${name}!<br><br>I'm your MediCare AI companion. I constantly monitor your steps, water, symptoms, and appointments.<br><br>You can ask me things like:<br>• <i>"How is my health today?"</i><br>• <i>"Should I book a doctor?"</i>`;
  appendAIMessage('ai', msg);
}

// ── Intelligence Logic ──

window.submitAIChat = function() {
  const input = document.getElementById('ai-text-input');
  if(!input) return;
  const val = input.value.trim();
  if(!val) return;
  input.value = '';
  // ensure panel is open
  const panel = document.getElementById('ai-floating-panel');
  if (panel.style.display === 'none' || !panel.style.display) {
    toggleAIPanel();
  }
  askAI(val, false);
}

async function askAI(query, isVoice = false) {
  if (!query) return;
  appendAIMessage('user', query);
  
  // Create a loading bubble
  const content = document.getElementById('ai-chat-content');
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-msg ai-bubble typing-indicator';
  loadingDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
  content.appendChild(loadingDiv);
  content.scrollTop = content.scrollHeight;

  try {
    const data = await apiFetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: query })
    });
    
    // Remove loading
    if(loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
    
    let text = data.reply || "Sorry, I couldn't process your request right now. Please try again.";
    
    // Simple markdown formatting
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
    appendAIMessage('ai', htmlText);
    
    // Voice output strictly if enabled AND triggered via voice
    if (isVoice && typeof isVoiceEnabled === 'function' && isVoiceEnabled() && typeof speak === 'function') {
      speak(text.replace(/[\*\_]/g, '')); // clean text for Speech Synthesis
    }
  } catch (err) {
    if(loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
    appendAIMessage('ai', "Sorry, I couldn't process your request right now. Please try again.");
  }
}

// Global hook for Voice module to pipe to AI UI
window.pipeToAI = function(query, isVoice = true) {
  const panel = document.getElementById('ai-floating-panel');
  if (panel && (panel.style.display === 'none' || !panel.style.display)) {
    toggleAIPanel();
  }
  askAI(query, isVoice);
}

function generateHealthReport() {
  const steps = parseInt(localStorage.getItem('medicare_steps') || 0);
  const water = parseInt(localStorage.getItem('medicare_water') || 0);
  const name = getUserName();
  let symptomsStr = JSON.parse(localStorage.getItem('medicare_symptoms_history') || '[]');
  const recentSymptoms = symptomsStr.length > 0 ? symptomsStr[symptomsStr.length-1].symptoms : [];
  
  // Check for completely empty data state
  if (steps === 0 && water === 0 && (!recentSymptoms || recentSymptoms.length === 0)) {
    return `Hello ${name}, your health dashboard is currently empty for today.<br><br><b>👉 My Recommendation:</b><br>To provide you with accurate insights, please track your daily steps, log your water intake, or report any symptoms. I'm ready to help!`;
  }

  let report = `<b>${name}, here's your health summary for today:</b><br><br>`;
  
  // 1. Steps Analysis
  if (steps === 0) {
    report += `• <b>Steps:</b> You haven't tracked any steps yet. Let's get moving!<br>`;
  } else if (steps < 4000) {
    report += `• <b>Steps:</b> ${steps.toLocaleString()} 📉 (Below goal). A short walk would do wonders.<br>`;
  } else if (steps < 8000) {
    report += `• <b>Steps:</b> ${steps.toLocaleString()} 🚶 (Good progress!). Keep it up.<br>`;
  } else {
    report += `• <b>Steps:</b> ${steps.toLocaleString()} 🔥 (Excellent!). You're crushing it today.<br>`;
  }

  // 2. Water Intake Analysis
  if (water === 0) {
    report += `• <b>Water:</b> 0 glasses. Dehydration alert! Please drink water immediately.<br>`;
  } else if (water < 4) {
    report += `• <b>Water:</b> ${water}/8 glasses 💧 (Low). Remember to hydrate every hour.<br>`;
  } else if (water < 8) {
    report += `• <b>Water:</b> ${water}/8 glasses 🧊 (Almost there!). Just a few more to go.<br>`;
  } else {
    report += `• <b>Water:</b> ${water}/8 glasses 🌊 (Goal reached!). Perfect hydration.<br>`;
  }

  // 3. Symptoms Insight
  let hasSevereSymptoms = false;
  if (recentSymptoms && recentSymptoms.length > 0) {
    report += `• <b>Symptoms:</b> You recently reported feeling <i>${recentSymptoms.join(', ')}</i>.<br>`;
    hasSevereSymptoms = true;
  } else {
    report += `• <b>Symptoms:</b> No issues reported today. Feeling good!<br>`;
  }

  // 4. Clear Recommendation
  report += `<br><b>👉 My Recommendation:</b><br>`;
  if (hasSevereSymptoms) {
      report += `Given your reported symptoms, please take it easy today. If your discomfort persists, I strongly advise booking a consultation.<br><br><button class="btn btn-primary btn-sm" onclick="closeAIPanel(); navigateTo('appointments')">📅 Book a Doctor</button>`;
  } else if (steps < 4000 && water < 4) {
      report += `Your activity and hydration are quite low today. Grab a quick glass of water and try a 10-minute walk indoors!`;
  } else if (steps >= 8000 && water >= 8) {
      report += `You are having a fantastic, healthy day! Keep up this active lifestyle for optimal well-being.`;
  } else {
      report += `You're on the right track! Try to fill the small gaps in your daily goals. A little consistent effort goes a long way.`;
  }

  return report;
}

function generateDoctorRecommendation() {
  let symptomsStr = JSON.parse(localStorage.getItem('medicare_symptoms_history') || '[]');
  const recentSymptoms = symptomsStr.length > 0 ? symptomsStr[symptomsStr.length-1].symptoms.join(', ').toLowerCase() : '';
  
  let recSpec = 'General Physician';
  if (recentSymptoms.includes('chest') || recentSymptoms.includes('heart')) recSpec = 'Cardiologist';
  else if (recentSymptoms.includes('teeth') || recentSymptoms.includes('tooth') || recentSymptoms.includes('gum')) recSpec = 'Dentist';
  else if (recentSymptoms.includes('bone') || recentSymptoms.includes('joint') || recentSymptoms.includes('back')) recSpec = 'Orthopedist';
  else if (recentSymptoms.includes('headache') || recentSymptoms.includes('dizz')) recSpec = 'Neurologist';
  
  if (recentSymptoms) {
    return `Based on your recent complaint of <b>${recentSymptoms}</b>, I strongly recommend you book a <b>${recSpec}</b>.<br><br><button class="btn btn-primary btn-sm" onclick="closeAIPanel(); navigateTo('appointments'); setTimeout(()=>document.getElementById('smart-appt-domain').value='${recSpec}',100);">Book ${recSpec}</button>`;
  }
  return `You have no recent severe symptoms recorded. However, an annual check-up with a <b>General Physician</b> is always a great idea!<br><br><button class="btn btn-outline btn-sm" onclick="closeAIPanel(); navigateTo('appointments')">Go to Appointments</button>`;
}

// ── Smart Dynamic Timers ──
window.getDynamicWaterIntervalMs = function() {
  // Instead of a rigid 1-hour interval (3600000 ms), the AI determines frequency!
  const w = parseInt(localStorage.getItem('medicare_water') || 0);
  const hour = new Date().getHours();
  
  // Standard 60 mins
  let intervalMs = 60 * 60 * 1000;
  
  // If it's already 4 PM (16:00) and they've drank less than 3 glasses... they are severely behind!
  if (hour >= 16 && w <= 3) {
    console.log("[AI] User critically behind on water. Shrinking reminder timer to 45 mins.");
    intervalMs = 45 * 60 * 1000;
  }
  // If they are ahead of schedule early in the day (e.g., 6 glasses by noon)
  else if (hour <= 12 && w >= 6) {
    console.log("[AI] User ahead on water. Relaxing reminder timer to 1.5 hours.");
    intervalMs = 90 * 60 * 1000; 
  }
  
  return intervalMs;
}
