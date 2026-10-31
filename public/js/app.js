// Level Up — small progressive enhancements. Everything works without JS
// except read-aloud and the auto-playing explainer.
(() => {
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice = null;
  // Prefer neural voices: Edge's free "Natural" voices, then Google's online voices,
  // then any Australian, British or other English voice.
  const pickVoice = () => {
    if (!synth) return;
    const vs = synth.getVoices().filter((v) => v.lang.replace('_', '-').startsWith('en'));
    // Browsers don't say which voices are male or female, so go by the name.
    const want = document.body.dataset.voice;
    const MALE = /\bMale\b|William|James|Ryan|Guy|Christopher|Daniel|George|Thomas|Liam|Mark\b|David|Brian|Eric|Roger|Andrew|Davis|Tony|Jason|Duncan|Elliot|Oliver|Fred|Alex\b|Aaron|Arthur|Gordon|Mitchell|Connor|Noah|Ethan|Luke|Ken\b|Neil/i;
    const FEMALE = /\bFemale\b|Natasha|Catherine|Karen|Hayley|Libby|Sonia|Aria|Jenny|Zira|Hazel|Susan|Samantha|Moira|Tessa|Fiona|Victoria|Kate|Serena|Annette|Carly|Elsie|Freya|Joanne|Tina|Clara|Emily|Ava\b|Allison|Michelle|Nancy|Sara|Maisie|Abbi|Bella|Hollie|Olivia|Heather|Linda/i;
    const score = (v) => {
      const lang = v.lang.replace('_', '-');
      let n = 0;
      if (want === 'male') n += MALE.test(v.name) ? 200 : FEMALE.test(v.name) ? -200 : 0;
      if (want === 'female') n += FEMALE.test(v.name) ? 200 : MALE.test(v.name) ? -200 : 0;
      if (/Natural|Neural/i.test(v.name)) n += 100;
      else if (/Online|Google/i.test(v.name)) n += 60;
      if (lang === 'en-AU') n += 30; else if (lang === 'en-GB') n += 15; else if (lang === 'en-NZ') n += 20;
      if (v.localService === false) n += 5;
      return n;
    };
    voice = vs.sort((a, b) => score(b) - score(a))[0] || null;
  };
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  const baseRate = document.body.dataset.rl === 'support' ? 0.82 : 0.95;
  function speak(text, { onend, rate = baseRate } = {}) {
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
    const player = new Audio();
    const hasRecordings = scenes.some((sc) => sc.dataset.audio);
    let i = 0, playing = false, timer = null, raf = null, voiceOn = !!synth || hasRecordings, startT = 0, dur = 0;
    // Scenes are designed on a 960x540 canvas and scaled to fit, like a video.
    const stage = ex.querySelector('.ex-stage');
    const fit = () => stage.style.setProperty('--k', stage.clientWidth / 960);
    fit(); new ResizeObserver(fit).observe(stage);

    const durationFor = (t) => Math.max(3500, t.split(/\s+/).length * 420);
    const label = ex.querySelector('[data-ex-voice-label]');
    function showVoice() {
      if (!label) return;
      label.textContent = !voiceOn ? 'Voice off'
        : scenes[i].dataset.audio ? `Recorded voice: ${ex.dataset.recordedVoice || 'Google'}`
        : voice ? `Browser voice: ${voice.name}` : 'No voice available in this browser';
    }
    if (synth) synth.addEventListener?.('voiceschanged', () => setTimeout(showVoice, 0));
    function show(n) {
      i = Math.max(0, Math.min(scenes.length - 1, n));
      scenes.forEach((s, k) => s.classList.toggle('active', k === i));
      bars.forEach((b, k) => { b.classList.toggle('past', k < i); b.querySelector('i').style.width = k < i ? '100%' : '0'; });
      caption.textContent = scenes[i].dataset.say || '';
      showVoice();
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
      clearTimeout(timer); cancelAnimationFrame(raf); player.pause(); player.onended = null;
      const text = scenes[i].dataset.say || '';
      dur = durationFor(text); startT = performance.now(); tick();
      const rec = scenes[i].dataset.audio;
      if (voiceOn && rec) {
        // Recorded narration (Google natural voice). Foundation readers hear it a little slower.
        synth?.cancel();
        player.src = rec;
        player.playbackRate = baseRate < 0.9 ? 0.9 : 1;
        player.onended = () => { timer = setTimeout(advance, 600); };
        player.onloadedmetadata = () => { if (isFinite(player.duration)) { dur = player.duration * 1000 / player.playbackRate; startT = performance.now(); } };
        player.onerror = () => { player.onerror = null; delete scenes[i].dataset.audio; run(); };
        player.play().catch(() => { timer = setTimeout(advance, dur); });
      } else if (voiceOn) {
        let ended = false;
        speak(text, { onend: () => { if (!ended) { ended = true; timer = setTimeout(advance, 700); } } });
        // Safety net if the speech engine never fires onend.
        timer = setTimeout(() => { if (!ended) { ended = true; advance(); } }, dur + 6000);
      } else {
        timer = setTimeout(advance, dur);
      }
    }
    function play() { playing = true; ex.classList.add('playing', 'started'); if (i === scenes.length - 1) show(0); run(); }
    function stop() { playing = false; ex.classList.remove('playing'); clearTimeout(timer); cancelAnimationFrame(raf); synth?.cancel(); player.pause(); }

    ex.querySelector('[data-ex-play]').addEventListener('click', play);
    ex.querySelector('[data-ex-toggle]').addEventListener('click', () => (playing ? stop() : play()));
    ex.querySelector('[data-ex-next]').addEventListener('click', () => { show(i + 1); playing ? run() : null; });
    ex.querySelector('[data-ex-prev]').addEventListener('click', () => { show(i - 1); playing ? run() : null; });
    ex.querySelector('[data-ex-cc]').addEventListener('click', (e) => {
      const on = ex.classList.toggle('no-cc'); e.currentTarget.setAttribute('aria-pressed', String(!on));
    });
    const vbtn = ex.querySelector('[data-ex-voice]');
    if (!voiceOn) vbtn.setAttribute('aria-pressed', 'false');
    vbtn.addEventListener('click', () => {
      voiceOn = synth || hasRecordings ? !voiceOn : false; vbtn.setAttribute('aria-pressed', String(voiceOn));
      if (!voiceOn) { synth?.cancel(); player.pause(); }
      showVoice();
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
