// ── Audio Engine & Autoplay Unblocker ──
// Browsers block audio.play() unless the user has interacted with the document.
// We play a silent snippet on the first interaction to "unlock" the Audio context globally.

let audioUnlocked = false;
const buzzerAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

function unlockAudioLayout() {
  if (audioUnlocked) return;
  // Play silent base64 to unlock audio permission
  const silentPlayer = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
  
  Promise.all([
    silentPlayer.play().catch(() => {}),
    buzzerAudio.load() // Prefetch buzzer audio
  ]).then(() => {
    audioUnlocked = true;
    document.removeEventListener('click', unlockAudioLayout);
    document.removeEventListener('touchstart', unlockAudioLayout);
    console.log('[MediCare] Audio unlocked for session');
  }).catch(e => console.warn('[MediCare] Unlock silently failed:', e));
}
document.addEventListener('click', unlockAudioLayout);
document.addEventListener('touchstart', unlockAudioLayout);

window.playBuzzer = function() {
  if (document.visibilityState === 'visible') {
    try {
      // Create a fresh audio object in case buzzerAudio is busy
      const instance = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      instance.play().catch(e => console.warn('[MediCare] Buzzer play blocked:', e));
    } catch(e) {
      console.warn('[MediCare] Buzzer fallback failed:', e);
    }
  }
};

// ── Toast Notification System ──
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

