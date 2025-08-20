(() => {
  const form = document.querySelector('#login-form');
  const nick = document.querySelector('#login-nick');
  const pass = document.querySelector('#login-pass');

  if (!form || !nick || !pass) { console.warn('login form not found'); return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const nickname = nick.value.trim();
    const password = pass.value;

    if (!nickname || !password) return;

    const res = await fetch('/.netlify/functions/local-login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nickname, password })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.token) {
      localStorage.setItem('FH_JWT', data.token);
      location.assign('/'); // на страницу выбора “создать / присоединиться”
    } else {
      alert(data?.error || 'Ошибка входа');
    }
  }, { once: true });

  console.log('Login submit hooked');
})();
