// ── Auth Logic ──
function switchTab(tab) {
  document.getElementById('login-section').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-section').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('medicare_token', data.token);
    localStorage.setItem('medicare_user', JSON.stringify(data.user));
    showToast('Welcome back, ' + data.user.name + '! 👋', 'success');
    setTimeout(() => window.location.href = '/dashboard.html', 800);
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span data-i18n="sign_in">Sign In</span>';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) {
    showToast('Passwords do not match', 'error');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    localStorage.setItem('medicare_token', data.token);
    localStorage.setItem('medicare_user', JSON.stringify(data.user));
    showToast('Account created! Welcome, ' + data.user.name + ' 🎉', 'success');
    setTimeout(() => window.location.href = '/dashboard.html', 800);
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span data-i18n="get_started">Get Started</span>';
  }
}

// Redirect to dashboard if already logged in
if (localStorage.getItem('medicare_token')) {
  window.location.href = '/dashboard.html';
}
