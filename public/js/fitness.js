// ── Fitness & Health Tracking Module ──
const HEALTH_TIPS = [
  { id: 't1', type: 'activity', icon: '🚶', title: 'Stay Active', text: 'Walk 5000+ steps daily' },
  { id: 't2', type: 'hydration', icon: '💧', title: 'Stay Hydrated', text: 'Drink water every hour' },
  { id: 't3', type: 'wellness', icon: '😴', title: 'Quality Sleep', text: 'Avoid screens 1h before bed' },
  { id: 't4', type: 'wellness', icon: '🧘', title: 'Manage Stress', text: 'Take deep breaths right now' },
  { id: 't5', type: 'nutrition', icon: '🥗', title: 'Eat a Rainbow', text: 'Include colourful veggies' },
  { id: 't6', type: 'wellness', icon: '🌞', title: 'Morning Light', text: 'Get 15 mins of sun early' },
  { id: 't7', type: 'fitness', icon: '🏃', title: 'Stretch Daily', text: 'Take a 5 min stretch break' },
  { id: 't8', type: 'wellness', icon: '👁️', title: 'Eye Care', text: 'Follow the 20-20-20 rule' },
];

let waterCount = parseInt(localStorage.getItem('medicare_water') || '0');
let stepsCount = parseInt(localStorage.getItem('medicare_steps') || '0');

let autoStepsEnabled = localStorage.getItem('medicare_auto_steps') === 'true';
let waterReminderEnabled = localStorage.getItem('medicare_water_reminder') === 'true';
let historyData = JSON.parse(localStorage.getItem('medicare_fitness_history')) || {};
let chartInstance = null;

let waterReminderTimer = null;
let nextWaterTargetMs = parseInt(localStorage.getItem('medicare_next_water')) || 0;

// Pedometer State (State-based Peak Detection & Filtering)
let isPedometerRunning = false;
let stepPeakTime = 0;
let isPeak = false;
let lastMag = 0;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── INIT ──
function initFitness() {
  // 1. Cross-Device Check
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) {
    const autoTrackLabel = document.getElementById('auto-track-label');
    if (autoTrackLabel) {
      autoTrackLabel.innerHTML = `<span style="color:var(--text-secondary);font-size:12px;font-style:italic">Auto-tracking requires a mobile device</span>`;
    }
  }

  // 2. Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'ALARM_TRIGGERED') {
        if (event.data.ids.includes('water_reminder')) {
          onWaterReminderFired();
        }
      }
    });
  }
  
  // 3. Battery Optimizer - Pause sensors if tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (isPedometerRunning) {
        window.removeEventListener('devicemotion', handleMotion);
        setSensorStatus('#f59e0b', 'Paused (Battery Saver)');
      }
    } else {
      if (autoStepsEnabled && isPedometerRunning) {
        window.addEventListener('devicemotion', handleMotion);
        setSensorStatus('#10b981', 'Running');
      }
    }
  });

  checkNewDay();
  renderWaterGlasses();
  renderSteps();
  renderFitnessTips();
  
  // UI Toggles sync
  const autoCheckbox = document.getElementById('auto-track-steps');
  if (autoCheckbox && isMobile) autoCheckbox.checked = autoStepsEnabled;
  const remCheckbox = document.getElementById('water-reminder-toggle');
  if (remCheckbox) remCheckbox.checked = waterReminderEnabled;

  if (autoStepsEnabled && isMobile) startPedometer();
  if (waterReminderEnabled) handleStartupWaterSync();
  
  updateMasterProgress();
  setTimeout(renderChart, 200); 
}

// ── DRIFT/MIDNIGHT SYNC ──
function checkNewDay() {
  const today = getTodayString();
  const lastRecorded = localStorage.getItem('medicare_last_date');
  if (lastRecorded && lastRecorded !== today) {
    // Save yesterday's data
    if (!historyData[lastRecorded]) historyData[lastRecorded] = { steps: 0, water: 0 };
    historyData[lastRecorded].steps = stepsCount;
    historyData[lastRecorded].water = waterCount;
    localStorage.setItem('medicare_fitness_history', JSON.stringify(historyData));
    
    // Reset today
    waterCount = 0;
    stepsCount = 0;
    localStorage.setItem('medicare_water', 0);
    localStorage.setItem('medicare_steps', 0);
  }
  localStorage.setItem('medicare_last_date', today);
  if (!historyData[today]) historyData[today] = { steps: stepsCount, water: waterCount };
}

function saveHistory() {
  checkNewDay(); // Ensure dates haven't crossed during session
  const today = getTodayString();
  historyData[today].steps = stepsCount;
  historyData[today].water = waterCount;
  localStorage.setItem('medicare_fitness_history', JSON.stringify(historyData));
  if (chartInstance) renderChart();
}

// ── WATER TRACKING ──
function renderWaterGlasses() {
  const el = document.getElementById('water-glasses');
  if (!el) return;
  el.innerHTML = Array.from({ length: 8 }, (_, i) => `
    <div class="water-glass ${i < waterCount ? 'filled' : ''}" onclick="setWater(${i + 1})" title="Glass ${i + 1}" role="button" aria-label="Glass ${i+1}"></div>
  `).join('');
  
  const countEl = document.getElementById('water-count');
  if (countEl) countEl.textContent = waterCount;
  const statEl = document.getElementById('stat-water');
  if (statEl) statEl.textContent = waterCount;
  updateMasterProgress();
}

function setWater(n) {
  waterCount = n;
  localStorage.setItem('medicare_water', waterCount);
  saveHistory();
  renderWaterGlasses();
  if (waterCount === 8) {
    showToast('🎉 Daily water goal reached! Great job!', 'success');
    // Voice only if globally enabled
    if (typeof speakReminderOnly === 'function') speakReminderOnly('Congratulations! You have completed your daily water goal.');
  }
}

function addWater() {
  if (waterCount >= 8) { showToast('Daily goal already reached! 🎉', 'info'); return; }
  setWater(waterCount + 1);
  showToast(`💧 Glass ${waterCount} of 8 — keep it up!`, 'info', 1800);
}

function resetWater() {
  waterCount = 0;
  localStorage.setItem('medicare_water', 0);
  saveHistory();
  renderWaterGlasses();
  showToast('Water tracker reset', 'info', 1500);
}

// ── SENSORS (STEP TRACKER) ──
function toggleAutoSteps() {
  const el = document.getElementById('auto-track-steps');
  if (!el) return;
  autoStepsEnabled = el.checked;
  localStorage.setItem('medicare_auto_steps', autoStepsEnabled);
  
  if (autoStepsEnabled) {
    startPedometer();
  } else {
    stopPedometer();
  }
}

function setSensorStatus(color, title) {
  const dot = document.getElementById('sensor-status-dot');
  if (dot) {
    dot.style.background = color;
    dot.title = title;
  }
}

function startPedometer() {
  if (!window.DeviceMotionEvent) {
    autoStepsEnabled = false;
    const cb = document.getElementById('auto-track-steps');
    if (cb) cb.checked = false;
    showToast('Device sensor not supported on this device/browser.', 'error');
    setSensorStatus('#ef4444', 'Error: Not Supported');
    return;
  }
  
  setSensorStatus('#f59e0b', 'Connecting...');
  
  // Request OS Permissions if required
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(state => {
      if (state === 'granted') {
        window.addEventListener('devicemotion', handleMotion);
        isPedometerRunning = true;
        setSensorStatus('#10b981', 'Running');
        showToast('Auto-tracking sensory active', 'success');
      } else {
        setSensorStatus('#ef4444', 'Permission Denied');
        showToast('Step tracking requires motion access. Using manual mode.', 'warning', 4000);
        autoStepsEnabled = false;
        const cb = document.getElementById('auto-track-steps');
        if(cb) cb.checked = false;
      }
    }).catch(e => {
      setSensorStatus('#ef4444', 'Error securing sensors');
      showToast('Step tracking requires motion access. Using manual mode.', 'error', 4000);
      autoStepsEnabled = false;
      const cb = document.getElementById('auto-track-steps');
      if(cb) cb.checked = false;
    });
  } else {
    window.addEventListener('devicemotion', handleMotion);
    isPedometerRunning = true;
    setSensorStatus('#10b981', 'Running');
    showToast('Auto-tracking active', 'success');
  }
}

function stopPedometer() {
  if (isPedometerRunning) {
    window.removeEventListener('devicemotion', handleMotion);
    isPedometerRunning = false;
    setSensorStatus('#ccc', 'Inactive');
    showToast('Auto-tracking stopped', 'info');
  }
}

function handleMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  
  // Smoothing low-pass filter formula
  const magRaw = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const mag = magRaw * 0.1 + lastMag * 0.9; 
  lastMag = mag;
  
  const highThreshold = 11.5;
  const lowThreshold = 9.0;
  
  // Step State Machine to prevent shaking double-counts
  if (mag > highThreshold && !isPeak) {
    isPeak = true;
  }
  
  if (mag < lowThreshold && isPeak) {
    isPeak = false;
    
    // Delay boundary: Ignore if step happened < 400ms ago (impossible walking speed)
    if (Date.now() - stepPeakTime > 400) {
      stepPeakTime = Date.now();
      
      stepsCount += 1;
      localStorage.setItem('medicare_steps', stepsCount);
      saveHistory(); // also evaluates cross-day boundary implicitly
      renderSteps();
    }
  }
}

function updateSteps() {
  const input = document.getElementById('steps-input');
  const val = parseInt(input.value);
  if (isNaN(val) || val < 0) return;
  stepsCount = val;
  localStorage.setItem('medicare_steps', stepsCount);
  saveHistory();
  renderSteps();
  input.value = '';
}

function renderSteps() {
  const valEl = document.getElementById('steps-val');
  const ring = document.getElementById('steps-ring');
  const calEl = document.getElementById('cal-estimate');
  const statEl = document.getElementById('stat-steps');
  
  if (valEl) valEl.textContent = stepsCount.toLocaleString();
  if (statEl) statEl.textContent = stepsCount.toLocaleString();
  
  if (ring) {
    const circumference = 364.4;
    const pct = Math.min(stepsCount / 10000, 1);
    ring.style.strokeDashoffset = circumference * (1 - pct);
  }
  if (calEl) {
    const kcal = Math.round(stepsCount * 0.04);
    calEl.textContent = `🔥 ${kcal} kcal burned`;
  }
  
  updateMasterProgress();
}

function updateMasterProgress() {
  const masterPctEl = document.getElementById('master-progress-pct');
  const masterBar = document.getElementById('master-progress-bar');
  const suggestion = document.getElementById('ai-suggestion');
  
  if (!masterPctEl || !masterBar) return;
  const stepPct = Math.min(stepsCount / 10000, 1);
  const waterPct = Math.min(waterCount / 8, 1);
  const overall = Math.round(((stepPct + waterPct) / 2) * 100);
  
  masterPctEl.textContent = `${overall}%`;
  masterBar.style.width = `${overall}%`;
  
  if (suggestion) {
    if (stepsCount < 2000 && waterCount < 3) suggestion.innerHTML = `💡 <span>Take a quick walk and drink a glass of water to kickstart your day!</span>`;
    else if (stepsCount < 5000) suggestion.innerHTML = `💡 <span>You're doing okay, but breaking a mild sweat could do wonders right now!</span>`;
    else if (waterCount < 6) suggestion.innerHTML = `💡 <span>Great step progress! Don't forget to keep hydrating!</span>`;
    else if (overall >= 100) suggestion.innerHTML = `🏆 <span style="color:var(--success)">Perfect day! You nailed your health goals.</span>`;
    else suggestion.innerHTML = `💡 <span>Almost there! Just a final push!</span>`;
  }
}

// ── SMART REMINDERS & BACKGROUND DRIFT DEFENSE ──
function toggleWaterReminder() {
  const el = document.getElementById('water-reminder-toggle');
  if (!el) return;
  waterReminderEnabled = el.checked;
  localStorage.setItem('medicare_water_reminder', waterReminderEnabled);
  
  if (waterReminderEnabled) {
    if (typeof Notification !== 'undefined') Notification.requestPermission();
    const interval = typeof window.getDynamicWaterIntervalMs === 'function' ? window.getDynamicWaterIntervalMs() : 3600000;
    setNextWaterReminder(Date.now() + interval);
    showToast('Water reminders ON. Background sync active.', 'success');
  } else {
    stopWaterReminders();
    showToast('Water reminders OFF', 'info');
  }
}

function handleStartupWaterSync() {
  // Drift check: Has the alarm passed while tab was closed?
  if (nextWaterTargetMs > 0) {
    if (Date.now() >= nextWaterTargetMs) {
      onWaterReminderFired();
    } else {
      rearmWaterTimerUI();
    }
  } else {
      setNextWaterReminder(Date.now() + 3600000);
  }
}

function setNextWaterReminder(timestamp) {
  nextWaterTargetMs = timestamp;
  localStorage.setItem('medicare_next_water', nextWaterTargetMs);
  
  // Forward to Service Worker if active
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_ALARM',
      id: 'water_reminder',
      timestamp: nextWaterTargetMs,
      title: 'MediCare Reminder',
      body: 'Time to drink your hourly glass of water! 💧',
      icon: '💧'
    });
  }
  
  rearmWaterTimerUI();
}

function rearmWaterTimerUI() {
  if (waterReminderTimer) clearTimeout(waterReminderTimer);
  const driftDelay = nextWaterTargetMs - Date.now();
  
  waterReminderTimer = setTimeout(() => {
    onWaterReminderFired();
  }, driftDelay > 0 ? driftDelay : 0);
  
  updateReminderUI();
}

function stopWaterReminders() {
  if (waterReminderTimer) clearTimeout(waterReminderTimer);
  nextWaterTargetMs = 0;
  localStorage.setItem('medicare_next_water', 0);
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALARM', id: 'water_reminder' });
  }
  updateReminderUI();
}

function onWaterReminderFired() {
  if (!waterReminderEnabled) return;
  if (waterCount < 8) {
    const msg = 'Time to drink your hourly glass of water! 💧';
    showToast(`⏰ Reminder Triggered: ${msg}`, 'info', 10000);
    // Sound via mobile-safe global unlock wrapper
    if (typeof window.playBuzzer === 'function') {
      window.playBuzzer();
    } else {
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
    }
    // Voice only if globally enabled
    if (typeof speakReminderOnly === 'function') speakReminderOnly('Time to drink water.');
  }
  // Immediately queue next one
  const interval = typeof window.getDynamicWaterIntervalMs === 'function' ? window.getDynamicWaterIntervalMs() : 3600000;
  setNextWaterReminder(Date.now() + interval);
}

function updateReminderUI() {
  const el = document.getElementById('next-water-reminder');
  if (!el) return;
  if (nextWaterTargetMs > 0 && waterReminderEnabled) {
    const d = new Date(nextWaterTargetMs);
    el.textContent = `Next alert at: ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  } else {
    el.textContent = '';
  }
}

// ── CHARTS ──
function renderChart() {
  const canvas = document.getElementById('fitnessChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  
  const days = [];
  const stepData = [];
  const waterData = [];
  
  for (let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    days.push(d.toLocaleDateString([], { weekday: 'short' }));
    if (historyData[key]) {
      stepData.push(historyData[key].steps || 0);
      waterData.push(historyData[key].water || 0);
    } else {
      stepData.push(0); waterData.push(0);
    }
  }

  if (chartInstance) {
    chartInstance.data.labels = days;
    chartInstance.data.datasets[0].data = stepData;
    chartInstance.data.datasets[1].data = waterData;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        { label: 'Steps', data: stepData, backgroundColor: '#7C3AED', borderRadius: 4, yAxisID: 'y' },
        { label: 'Water', data: waterData, backgroundColor: '#34D399', borderRadius: 4, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(0,0,0,0.05)' } },
        y1: { beginAtZero: true, position: 'right', max: 10, grid: { drawOnChartArea: false } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6 } },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.label === 'Water' ? `${ctx.parsed.y} glasses` : `${ctx.parsed.y} steps`
          }
        }
      }
    }
  });

  // Insights HUD Rendering
  const avgSteps = Math.round(stepData.reduce((a, b) => a + b, 0) / 7);
  let daysMetWater = waterData.filter(w => w >= 8).length;
  const waterConsistency = Math.round((daysMetWater / 7) * 100);

  const elSteps = document.getElementById('insight-avg-steps');
  const elWater = document.getElementById('insight-water-consistency');
  const elSummary = document.getElementById('insight-summary-msg');

  if (elSteps) elSteps.textContent = avgSteps.toLocaleString();
  if (elWater) elWater.textContent = `${waterConsistency}%`;
  if (elSummary) {
    if (avgSteps < 3000) elSummary.innerHTML = `💡 Try taking a 15-minute walk daily to boost your average!`;
    else if (waterConsistency < 50) elSummary.innerHTML = `💡 You're rocking the steps, but let's drink more water.`;
    else elSummary.innerHTML = `🏆 Amazing consistency! You're totally crushing your health goals.`;
  }
}

// ── DEMO EXPOSURES ──
window.injectDemoData = function() {
  const mockHistory = {};
  for (let i=0; i<=6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    mockHistory[key] = {
      steps: Math.floor(Math.random() * (12000 - 4000) + 4000), 
      water: Math.floor(Math.random() * (9 - 4) + 4)
    };
  }
  localStorage.setItem('medicare_fitness_history', JSON.stringify(mockHistory));
  historyData = mockHistory;
  
  // Also fix today's display
  const todayKey = getTodayString();
  stepsCount = mockHistory[todayKey].steps;
  waterCount = mockHistory[todayKey].water;
  localStorage.setItem('medicare_steps', stepsCount);
  localStorage.setItem('medicare_water', waterCount);
  
  renderSteps();
  renderWaterGlasses();
  renderChart();
  showToast('Demo history injected successfully!', 'success');
  // No voice for dev actions
  console.log('[MediCare] Demo data injected');
};

window.triggerWaterReminderNow = function() {
  console.log("Forcing Water Reminder Trigger via Demo Action...");
  onWaterReminderFired();
};

function calculateBMI() {
  const h = parseFloat(document.getElementById('bmi-height').value);
  const w = parseFloat(document.getElementById('bmi-weight').value);
  if (!h || !w || h < 50 || w < 10) return;
  const bmi = w / ((h / 100) ** 2);
  const bmiRounded = bmi.toFixed(1);

  let category, color, left;
  if (bmi < 18.5) { category = 'Underweight'; color = '#6EE7B7'; left = (bmi / 18.5) * 20; }
  else if (bmi < 25) { category = 'Normal Weight ✅'; color = '#34D399'; left = 20 + ((bmi - 18.5) / 6.5) * 30; }
  else if (bmi < 30) { category = 'Overweight ⚠️'; color = '#FDE68A'; left = 50 + ((bmi - 25) / 5) * 25; }
  else { category = 'Obese 🚨'; color = '#EF4444'; left = Math.min(75 + ((bmi - 30) / 10) * 25, 96); }

  document.getElementById('bmi-result').style.display = 'block';
  document.getElementById('bmi-val').textContent = bmiRounded;
  document.getElementById('bmi-val').style.color = color;
  document.getElementById('bmi-category').textContent = category;
  document.getElementById('bmi-category').style.color = color;
  const marker = document.getElementById('bmi-marker');
  if (marker) marker.style.left = `${left}%`;
}

function generateSmartTips(maxCount) {
  let selected = [];
  
  if (waterCount < 6) {
    selected.push(HEALTH_TIPS.find(t => t.type === 'hydration'));
  } else if (stepsCount < 5000) {
    selected.push(HEALTH_TIPS.find(t => t.type === 'activity'));
  }
  
  const available = HEALTH_TIPS.filter(t => !selected.includes(t));
  available.sort(() => 0.5 - Math.random());
  
  selected = [...selected, ...available].slice(0, maxCount);
  const marqueeItems = [...selected, ...selected]; // Duplicate for seamless infinite loop
  
  return marqueeItems.map((tip, index) => {
    // Only highlight the very first tip in the sequence
    const isHighlight = (index === 0);
    return `
      <div class="health-tip-card-compact ${isHighlight ? 'highlight' : ''}">
        <div class="health-tip-icon">${tip.icon}</div>
        <div>
          <div class="health-tip-title">${tip.title}</div>
          <div class="health-tip-text">${tip.text}</div>
        </div>
      </div>
    `;
  }).join('');
}

function generateVerticalSmartTips(maxCount) {
  let selected = [];
  
  if (waterCount < 6) {
    selected.push(HEALTH_TIPS.find(t => t.type === 'hydration'));
  } else if (stepsCount < 5000) {
    selected.push(HEALTH_TIPS.find(t => t.type === 'activity'));
  }
  
  const available = HEALTH_TIPS.filter(t => !selected.includes(t));
  available.sort(() => 0.5 - Math.random());
  
  selected = [...selected, ...available].slice(0, maxCount);
  
  return selected.map((tip, index) => {
    const isHighlight = (index === 0);
    return `
      <div class="health-tip-card-compact ${isHighlight ? 'highlight' : ''}" style="margin-bottom: 8px;">
        <div class="health-tip-icon">${tip.icon}</div>
        <div>
          <div class="health-tip-title">${tip.title}</div>
          <div class="health-tip-text">${tip.text}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFitnessTips() {
  const el = document.getElementById('fitness-tips');
  if (el) el.innerHTML = generateVerticalSmartTips(4); // limit to 4 to fit in the card
}

function renderHomeTips() {
  const el = document.getElementById('home-tips');
  if (el) el.innerHTML = generateSmartTips(8);
}
