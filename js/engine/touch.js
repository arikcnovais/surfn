/* =========================================================================
   Touch — virtual stick and action buttons for phones/tablets. The DOM layer
   is intentionally dumb: it only translates gestures into the same virtual
   key codes the keyboard uses, so every screen and the racing HUD keep working.
   ========================================================================= */

const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];

export function setupTouch(game) {
  const isTouch = (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  const root = document.getElementById('touch');
  if (!root) return;
  document.documentElement.classList.add('touch');
  const input = game.input;
  const stick = root.querySelector('#stick');
  const knob = root.querySelector('#knob');
  if (!stick || !knob) return;

  let stickId = null;
  let active = new Set();

  const setMovement = (x, y) => {
    const next = new Set();
    if (x < -0.28) next.add('KeyA');
    if (x > 0.28) next.add('KeyD');
    if (y < -0.28) next.add('KeyW');
    if (y > 0.28) next.add('KeyS');
    for (const k of MOVE_KEYS) {
      if (active.has(k) && !next.has(k)) input.releaseVirtual(k);
      if (!active.has(k) && next.has(k)) input.pressVirtual(k);
    }
    active = next;
  };

  const resetStick = () => {
    stickId = null;
    knob.style.transform = 'translate(-50%, -50%)';
    for (const k of MOVE_KEYS) input.releaseVirtual(k);
    active = new Set();
  };

  const moveStick = (e) => {
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = r.width * 0.38;
    let dx = (e.clientX - cx) / max;
    let dy = (e.clientY - cy) / max;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    knob.style.transform = `translate(calc(-50% + ${dx * max}px), calc(-50% + ${dy * max}px))`;
    setMovement(dx, dy);
  };

  stick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    stickId = e.pointerId;
    stick.setPointerCapture?.(e.pointerId);
    moveStick(e);
  }, { passive: false });
  stick.addEventListener('pointermove', (e) => {
    if (stickId !== e.pointerId) return;
    e.preventDefault();
    moveStick(e);
  }, { passive: false });
  const endStick = (e) => {
    if (stickId !== e.pointerId) return;
    resetStick();
  };
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);

  for (const btn of root.querySelectorAll('[data-key]')) {
    const code = btn.dataset.key;
    const down = (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      input.pressVirtual(code);
      btn.setPointerCapture?.(e.pointerId);
    };
    const up = (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      input.releaseVirtual(code);
    };
    btn.addEventListener('pointerdown', down, { passive: false });
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  // On iOS the first gesture must also unlock WebAudio.
  window.addEventListener('pointerdown', () => game.audio.ensure(), { once: true });
  resetStick();
}
