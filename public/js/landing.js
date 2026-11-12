// Front page: the red-flag hunt, the reading-level dial and the sample question.
document.documentElement.classList.add('js');

// 1. Tap the four red flags in the scam message.
(() => {
  const wrap = document.querySelector('[data-hunt]');
  if (!wrap) return;
  const flags = [...wrap.querySelectorAll('.lp-flag')];
  const status = wrap.querySelector('[data-status]');
  const done = wrap.querySelector('[data-done]');
  const nudge = document.querySelector('[data-nudge]');
  let found = 0;
  flags.forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    b.setAttribute('aria-pressed', 'true');
    const li = wrap.querySelector(`.lp-flags [data-for="${b.dataset.flag}"]`);
    li?.classList.add('on');
    found += 1;
    const why = li?.querySelector('em')?.textContent || '';
    status.textContent = found < flags.length ? `${found} of ${flags.length} found. ${b.dataset.flag}: ${why}` : `${found} of ${flags.length}. It’s a scam.`;
    if (found === flags.length) {
      wrap.classList.add('solved');
      done.hidden = false;
      if (nudge) { nudge.classList.add('done'); nudge.querySelector('span').textContent = 'Nice. You read it the way a scammer writes it.'; }
    }
  }));
})();

// 2. Reading-level dial (tabs with arrow keys).
(() => {
  const reader = document.querySelector('[data-reader]');
  if (!reader) return;
  const tabs = [...reader.querySelectorAll('[role=tab]')];
  const pick = (t, focus) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      pick(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });
})();

// 3. Try a real question.
(() => {
  const box = document.querySelector('[data-try]');
  if (!box) return;
  const fb = box.querySelector('.lp-try-fb');
  const btns = [...box.querySelectorAll('button')];
  btns.forEach((b) => b.addEventListener('click', () => {
    const right = b.dataset.right === '1';
    btns.forEach((x) => { x.disabled = true; if (x.dataset.right === '1') x.classList.add('right'); });
    if (!right) b.classList.add('wrong');
    fb.textContent = `${right ? 'Yes.' : 'Not quite.'} ${fb.dataset.explain}${right ? '' : ' In the app, this one would come back tomorrow.'}`;
  }));
})();
