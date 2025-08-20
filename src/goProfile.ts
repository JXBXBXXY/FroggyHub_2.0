export function goProfile() {
  // если MPA со страницей /profile.html
  if (document.querySelector('link[href*="profile.html"]') || window.location.pathname.endsWith('.html')) {
    window.location.href = '/profile.html';
    return;
  }
  // SPA fallback
  try {
    // если используем React Router и есть navigate
    // (если компонента не в React-контексте — просто хардовый переход)
    // @ts-ignore
    if (window.navigate) { window.navigate('/profile'); return; }
  } catch {}
  window.location.assign('/profile.html');
}
