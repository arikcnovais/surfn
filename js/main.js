import { Game } from './surf/game.js';
import { setupTouch } from './engine/touch.js';

const canvas = document.getElementById('game');
const boot = document.getElementById('boot');

async function start() {
  const game = new Game(canvas);
  try {
    await game.boot();
    setupTouch(game);
    window.__surfn = game;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) game.persist();
    });
    window.addEventListener('beforeunload', () => game.persist());
    if (boot) {
      boot.classList.add('hidden');
      setTimeout(() => boot.remove(), 700);
    }
  } catch (err) {
    console.error(err);
    window.__bootError = err;
    if (boot) {
      boot.innerHTML = `<div class="boot-inner">
        <div class="title">O MODEM NÃO CONECTOU</div>
        <div class="sub">${String(err.message || err)}</div>
        <div class="sub">sirva a pasta por http: python3 tools/serve.py</div>
      </div>`;
    }
  }
}

start();
