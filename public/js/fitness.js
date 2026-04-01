// ── Fitness & Health Tracking Module ──
const HEALTH_TIPS = [
  { icon: '🥗', title: 'Eat a Rainbow', text: 'Include colourful fruits and vegetables in every meal for diverse nutrients and antioxidants.' },
  { icon: '💧', title: 'Stay Hydrated', text: 'Drink at least 8 glasses (2 litres) of water daily. Start your day with a glass of warm water.' },
  { icon: '🏃', title: 'Stay Active', text: 'Even a 30-minute brisk walk daily reduces the risk of heart disease, diabetes, and depression.' },
  { icon: '😴', title: 'Quality Sleep', text: 'Aim for 7–8 hours of quality sleep. Good sleep boosts immunity and mental health.' },
  { icon: '🧘', title: 'Manage Stress', text: 'Practice deep breathing or meditation for 10 minutes daily to reduce cortisol levels.' },
  { icon: '🦷', title: 'Oral Health', text: 'Brush twice and floss once daily. Poor oral health is linked to heart disease and diabetes.' },
  { icon: '🌞', title: 'Vitamin D', text: 'Spend 15–20 minutes in morning sunlight. Vitamin D supports bone strength and immunity.' },
  { icon: '❤️', title: 'Regular Check-ups', text: 'See your doctor at least once a year. Early detection saves lives.' },
];

let waterCount = parseInt(localStorage.getItem('medicare_water') || '0');
let stepsCount = parseInt(localStorage.getItem('medicare_steps') || '0');

function initFitness() {
  renderWaterGlasses();
  renderSteps();
  renderFitnessTips();
}

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
}

function setWater(n) {
  waterCount = n;
  localStorage.setItem('medicare_water', waterCount);
  renderWaterGlasses();
  if (waterCount === 8) {
    showToast('🎉 Daily water goal reached! Great job!', 'success');
    speak('Congratulations! You have completed your daily water goal.');
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
  renderWaterGlasses();
  showToast('Water tracker reset', 'info', 1500);
}

function updateSteps() {
  const input = document.getElementById('steps-input');
  const val = parseInt(input.value);
  if (isNaN(val) || val < 0) { showToast('Please enter a valid step count', 'error'); return; }
  stepsCount = val;
  localStorage.setItem('medicare_steps', stepsCount);
  renderSteps();
  input.value = '';
  const msg = val >= 10000 ? `Excellent! You've hit ${val.toLocaleString()} steps today! 🎉` : `Great effort! ${val.toLocaleString()} steps logged.`;
  showToast(msg, 'success');
  if (val >= 10000) speak('Congratulations! You have reached your 10,000 step goal today!');
}

function renderSteps() {
  const valEl = document.getElementById('steps-val');
  const ring = document.getElementById('steps-ring');
  if (valEl) valEl.textContent = stepsCount.toLocaleString();
  if (ring) {
    const circumference = 364.4;
    const pct = Math.min(stepsCount / 10000, 1);
    ring.style.strokeDashoffset = circumference * (1 - pct);
  }
  const statEl = document.getElementById('stat-steps');
  if (statEl) statEl.textContent = stepsCount.toLocaleString();
}

function calculateBMI() {
  const h = parseFloat(document.getElementById('bmi-height').value);
  const w = parseFloat(document.getElementById('bmi-weight').value);
  if (!h || !w || h < 50 || w < 10) { showToast('Please enter valid height and weight', 'error'); return; }
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
  speak(`Your BMI is ${bmiRounded}. ${category.replace(/[✅⚠️🚨]/g, '')}.`);
}

function renderFitnessTips(containerId = 'fitness-tips') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const tips = HEALTH_TIPS.slice(0, 4);
  el.innerHTML = tips.map(tip => `
    <div class="health-tip-card">
      <div class="health-tip-icon">${tip.icon}</div>
      <div>
        <div class="health-tip-title">${tip.title}</div>
        <div class="health-tip-text">${tip.text}</div>
      </div>
    </div>
  `).join('');
}

function renderHomeTips() {
  const el = document.getElementById('home-tips');
  if (!el) return;
  const tips = [...HEALTH_TIPS].sort(() => 0.5 - Math.random()).slice(0, 3);
  el.innerHTML = tips.map(tip => `
    <div class="health-tip-card">
      <div class="health-tip-icon">${tip.icon}</div>
      <div>
        <div class="health-tip-title">${tip.title}</div>
        <div class="health-tip-text">${tip.text}</div>
      </div>
    </div>
  `).join('');
}
