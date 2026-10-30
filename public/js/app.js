// Level Up — small progressive enhancements. Everything works without JS
// except read-aloud and the auto-playing explainer.
(() => {
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice = null;
  const pickVoice = () => {
    if (!synth) return;
    const vs = synth.getVoices();
    voice = vs.find((v) => v.lang === 'en-AU') || vs.find((v) => v.lang.startsWith('en-GB')) || vs.find((v) => v.lang.startsWith('en')) || null;
  };
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  function speak(text, { onend, rate = 0.95 } = {}) {
    if (!synth) { onend && setTimeout(onend, 3000); return null; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-AU';
    u.rate = rate;
    if (onend) u.onend = onend;
    synth.speak(u);
    return u;
  }
  const clean = (el) => el.innerText.replace(/\s+/g, ' ').trim();

  // ----- Text size (remembered per device) -----
  const root = document.documentElement;
  try { const s = localStorage.getItem('lu-textsize'); if (s) root.dataset.textsize = s; } catch {}
  document.querySelectorAll('[data-textsize]').forEach((b) => b.addEventListener('click', () => {
    const next = ((Number(root.dataset.textsize) || 0) + 1) % 3;
    root.dataset.textsize = next;
    try { localStorage.setItem('lu-textsize', next); } catch {}
  }));

  // ----- Read-aloud buttons -----
  let speakingBtn = null;
  const stopSpeaking = () => { synth?.cancel(); speakingBtn?.classList.remove('speaking'); speakingBtn = null; };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-read],[data-say]');
    if (!btn) return;
    if (!synth) { alert('Read-aloud isn’t available in this browser.'); return; }
    if (speakingBtn === btn) { stopSpeaking(); return; }
    stopSpeaking();
    let text = btn.dataset.say;
    if (btn.dataset.read) {
      const target = document.querySelector(btn.dataset.read);
      if (!target) return;
      const copy = target.cloneNode(true);
      copy.querySelectorAll('button, .read-btn, .say, .source').forEach((n) => n.remove());
      document.body.appendChild(copy); copy.style.position = 'absolute'; copy.style.left = '-9999px';
      text = clean(copy); copy.remove();
    }
    speakingBtn = btn; btn.classList.add('speaking');
    speak(text, { onend: () => { btn.classList.remove('speaking'); if (speakingBtn === btn) speakingBtn = null; } });
  });

  // ----- Explainer player -----
  document.querySelectorAll('[data-explainer]').forEach((ex) => {
    const scenes = [...ex.querySelectorAll('.ex-scene')];
    const bars = [...ex.querySelectorAll('.ex-progress span')];
    const caption = ex.querySelector('.ex-caption');
    let i = 0, playing = false, timer = null, raf = null, voiceOn = !!synth, startT = 0, dur = 0;
    // Scenes are designed on a 960x540 canvas and scaled to fit, like a video.
    const stage = ex.querySelector('.ex-stage');
    const fit = () => stage.style.setProperty('--k', stage.clientWidth / 960);
    fit(); new ResizeObserver(fit).observe(stage);

    const durationFor = (t) => Math.max(3500, t.split(/\s+/).length * 420);
    function show(n) {
      i = Math.max(0, Math.min(scenes.length - 1, n));
      scenes.forEach((s, k) => s.classList.toggle('active', k === i));
      bars.forEach((b, k) => { b.classList.toggle('past', k < i); b.querySelector('i').style.width = k < i ? '100%' : '0'; });
      caption.textContent = scenes[i].dataset.say || '';
    }
    function tick() {
      const p = Math.min(1, (performance.now() - startT) / dur);
      bars[i].querySelector('i').style.width = (p * 100) + '%';
      if (playing) raf = requestAnimationFrame(tick);
    }
    function advance() {
      if (!playing) return;
      if (i < scenes.length - 1) { show(i + 1); run(); } else { stop(); bars.forEach((b) => b.classList.add('past')); }
    }
    function run() {
      clearTimeout(timer); cancelAnimationFrame(raf);
      const text = scenes[i].dataset.say || '';
      dur = durationFor(text); startT = performance.now(); tick();
      if (voiceOn) {
        let ended = false;
        speak(text, { onend: () => { if (!ended) { ended = true; timer = setTimeout(advance, 700); } } });
        // Safety net if the speech engine never fires onend.
        timer = setTimeout(() => { if (!ended) { ended = true; advance(); } }, dur + 6000);
      } else {
        timer = setTimeout(advance, dur);
      }
    }
    function play() { playing = true; ex.classList.add('playing', 'started'); if (i === scenes.length - 1) show(0); run(); }
    function stop() { playing = false; ex.classList.remove('playing'); clearTimeout(timer); cancelAnimationFrame(raf); synth?.cancel(); }

    ex.querySelector('[data-ex-play]').addEventListener('click', play);
    ex.querySelector('[data-ex-toggle]').addEventListener('click', () => (playing ? stop() : play()));
    ex.querySelector('[data-ex-next]').addEventListener('click', () => { show(i + 1); playing ? run() : null; });
    ex.querySelector('[data-ex-prev]').addEventListener('click', () => { show(i - 1); playing ? run() : null; });
    ex.querySelector('[data-ex-cc]').addEventListener('click', (e) => {
      const on = ex.classList.toggle('no-cc'); e.currentTarget.setAttribute('aria-pressed', String(!on));
    });
    const vbtn = ex.querySelector('[data-ex-voice]');
    if (!synth) vbtn.setAttribute('aria-pressed', 'false');
    vbtn.addEventListener('click', () => {
      voiceOn = synth ? !voiceOn : false; vbtn.setAttribute('aria-pressed', String(voiceOn));
      if (!voiceOn) synth?.cancel();
      if (playing) run();
    });
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') { show(i + 1); if (playing) run(); }
      if (e.key === 'ArrowLeft') { show(i - 1); if (playing) run(); }
      if (e.key === ' ' && document.body.classList.contains('board')) { e.preventDefault(); playing ? stop() : play(); }
    });
    show(0);
  });

  // ----- Confetti for new badges / unlocks -----
  document.querySelectorAll('[data-confetti]').forEach((box) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#c6f432', '#ffc53d', '#ff6b4a', '#4d7cfe', '#b57bff', '#ff5fa2', '#2ec4b6'];
    for (let k = 0; k < 40; k++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[k % colors.length];
      c.style.animationDuration = 1.2 + Math.random() * 1.6 + 's';
      c.style.animationDelay = Math.random() * 0.6 + 's';
      box.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  });
})();
