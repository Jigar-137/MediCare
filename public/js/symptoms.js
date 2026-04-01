// ── Symptom Checker Module ──
const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Sore Throat', 'Fatigue',
  'Vomiting', 'Diarrhea', 'Back Pain', 'Joint Pain', 'Rash',
  'Chest Pain', 'Shortness of Breath'
];

let selectedSymptoms = [];

function initSymptomChips() {
  const container = document.getElementById('symptom-chips');
  if (!container) return;
  container.innerHTML = COMMON_SYMPTOMS.map(s => `
    <button class="symptom-chip" onclick="toggleSymptom(this, '${s.toLowerCase()}')">${s}</button>
  `).join('');
}

function toggleSymptom(el, symptom) {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
  } else {
    el.classList.add('selected');
    selectedSymptoms.push(symptom);
  }
}

function addCustomSymptom() {
  const input = document.getElementById('custom-symptom');
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  if (selectedSymptoms.includes(val)) { showToast('Symptom already added', 'warning'); return; }
  selectedSymptoms.push(val);
  const container = document.getElementById('symptom-chips');
  const btn = document.createElement('button');
  btn.className = 'symptom-chip selected';
  btn.textContent = val.charAt(0).toUpperCase() + val.slice(1) + ' ✕';
  btn.onclick = () => { selectedSymptoms = selectedSymptoms.filter(s => s !== val); btn.remove(); };
  container.appendChild(btn);
  input.value = '';
  showToast('Symptom added', 'info', 1500);
}

async function checkSymptoms() {
  if (!selectedSymptoms.length) { showToast('Please select at least one symptom', 'warning'); return; }
  const btn = document.getElementById('check-btn');
  btn.disabled = true; btn.textContent = 'Checking…';
  try {
    const data = await apiFetch('/api/symptoms/check', {
      method: 'POST',
      body: JSON.stringify({ symptoms: selectedSymptoms })
    });
    renderSymptomResults(data);
    speak(data.generalAdvice);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 <span>Check Symptoms</span>';
  }
}

function renderSymptomResults(data) {
  const resultsDiv = document.getElementById('symptom-results');
  const banner = document.getElementById('general-advice-banner');
  const list = document.getElementById('symptom-results-list');

  const severityIcon = { severe: '🚨', moderate: '⚠️', mild: '✅', unknown: 'ℹ️' };
  banner.className = `general-advice-banner ${data.overallSeverity}`;
  banner.innerHTML = `<span style="font-size:24px">${severityIcon[data.overallSeverity] || 'ℹ️'}</span> ${data.generalAdvice}`;

  list.innerHTML = data.results.map(r => `
    <div class="symptom-result-card ${r.severity}" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:17px;font-weight:700;text-transform:capitalize">
          ${r.symptom.charAt(0).toUpperCase() + r.symptom.slice(1)}
        </div>
        <span class="badge badge-${r.severity}">${r.severity.toUpperCase()}</span>
      </div>
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">${r.advice}</p>
      ${r.warnings?.length ? `
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">⚠️ Warnings</div>
        <div class="warning-list">${r.warnings.map(w => `<div class="warning-item">⚠️ ${w}</div>`).join('')}</div>
      ` : ''}
      ${r.tips?.length ? `
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-top:10px;margin-bottom:6px">💡 Tips</div>
        <div class="tips-list">${r.tips.map(tp => `<div class="tip-item">✅ ${tp}</div>`).join('')}</div>
      ` : ''}
    </div>
  `).join('');

  resultsDiv.style.display = 'block';
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearSymptoms() {
  selectedSymptoms = [];
  document.querySelectorAll('.symptom-chip').forEach(c => c.classList.remove('selected'));
  const customInput = document.getElementById('custom-symptom');
  if (customInput) customInput.value = '';
  document.getElementById('symptom-results').style.display = 'none';
  initSymptomChips();
}

window.setSymptomsFromVoice = function(symptomsList) {
  selectedSymptoms = Array.from(new Set([...selectedSymptoms, ...symptomsList]));
  initSymptomChips();
  setTimeout(() => {
    selectedSymptoms.forEach(s => {
      const chip = Array.from(document.querySelectorAll('.symptom-chip')).find(c => c.textContent.toLowerCase() === s.toLowerCase());
      if (chip) chip.classList.add('selected');
      else {
        // Add custom chip if not found in common list
        const container = document.getElementById('symptom-chips');
        if (container) {
          const btn = document.createElement('button');
          btn.className = 'symptom-chip selected';
          btn.textContent = s.charAt(0).toUpperCase() + s.slice(1) + ' ✕';
          btn.onclick = () => { selectedSymptoms = selectedSymptoms.filter(x => x !== s); btn.remove(); };
          container.appendChild(btn);
        }
      }
    });
  }, 100);
};
