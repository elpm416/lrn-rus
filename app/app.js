/* Learning Russian — lesson player.
   All content lives in lessons/. This file never needs to change to add a lesson. */
(function () {
  'use strict';

  // ---------- small helpers ----------
  const $app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STRESS = /́/g;
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem('ru-lessons:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem('ru-lessons:' + key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const ICONS = {
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    house: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    pot: '<path d="M3 11h18"/><path d="M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"/><path d="M9 7c0-1 1-1 1-2s-1-1-1-2"/><path d="M14 7c0-1 1-1 1-2s-1-1-1-2"/>',
    paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    snowflake: '<line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/><line x1="19.1" y1="4.9" x2="4.9" y2="19.1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>',
    star: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.6 5.8 21 7 14 2 9.3 9 8.5 12 2"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    ball: '<circle cx="12" cy="12" r="10"/><polygon points="12 7.5 16 10.5 14.5 15 9.5 15 8 10.5 12 7.5"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    speakerLoud: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    replay: '<path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    voice: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M17 6a4 4 0 0 1 0 5"/><path d="M20 3.5a8 8 0 0 1 0 10"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  };
  const icon = (name, size, width) => '<svg width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (width || 2.2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.star) + '</svg>';
  const PLAY = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 4.8v14.4a1 1 0 0 0 1.5.86l11.5-7.2a1 1 0 0 0 0-1.72L9.5 3.94A1 1 0 0 0 8 4.8Z"/></svg>';
  const PAUSE = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.5"/></svg>';
  const STAR = (on) => '<svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" class="' + (on ? '' : 'off') + '" aria-hidden="true"><path d="M12 2l2.9 6.26 6.86.6-5.2 4.52 1.56 6.72L12 16.6 5.88 20.1l1.56-6.72-5.2-4.52 6.86-.6Z"/></svg>';
  const COLORS = {
    orange: ['#FCE3CF', '#D9621A'], blue: ['#E2EAF8', '#2B4C9B'], yellow: ['#FBEFC9', '#8A5E00'],
    green: ['#E3F1E4', '#2E6B33'], teal: ['#E5F2F8', '#1F6E8C'], purple: ['#F3E6F6', '#7A3E8C']
  };

  // ---------- text parsing ----------
  // "Бел|ка" -> syllables ["Бел","ка"], display "Белка", key "белка", speak "Белка"
  function parseWord(raw) {
    const display = raw.replace(/\|/g, '');
    return {
      display,
      syllables: raw.split('|'),
      key: display.replace(STRESS, '').toLowerCase().replace(/[^\p{L}-]/gu, ''),
      speak: display.replace(STRESS, '')
    };
  }
  function parseSentence(s) {
    const words = s.text.trim().split(/\s+/).map(parseWord);
    let pos = 0;
    words.forEach((w) => { w.start = pos; pos += w.speak.length + 1; });
    return { words, speak: words.map((w) => w.speak).join(' '), en: s.en, image: s.image };
  }
  const plain = (t) => t.replace(/\|/g, '').replace(STRESS, '');

  // ---------- loading + light validation ----------
  async function getJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load ' + url + ' (HTTP ' + res.status + ')');
    try { return await res.json(); } catch (e) { throw new Error(url + ' is not valid JSON: ' + e.message); }
  }
  function check(lesson, id) {
    const where = 'lessons/' + id + '/lesson.json';
    const fail = (msg) => { throw new Error(where + ': ' + msg); };
    if (lesson.id !== id) fail('"id" is "' + lesson.id + '" but the folder is "' + id + '"');
    if (!lesson.title || !lesson.title.ru) fail('missing title.ru');
    if (!Array.isArray(lesson.sentences) || !lesson.sentences.length) fail('needs at least one sentence');
    lesson.sentences.forEach((s, i) => { if (!lesson.images || !lesson.images[s.image]) fail('sentence ' + (i + 1) + ' uses image "' + s.image + '", which is not in "images"'); });
    (lesson.quiz || []).forEach((q, i) => { if (!q.options || q.answer < 0 || q.answer >= q.options.length) fail('quiz question ' + (i + 1) + ': "answer" must point at one of its options (counting from 0)'); });
  }
  async function loadLessons() {
    const index = await getJSON('lessons/index.json');
    const ids = index.lessons || [];
    return Promise.all(ids.map(async (id) => {
      const lesson = await getJSON('lessons/' + id + '/lesson.json');
      check(lesson, id);
      lesson.base = 'lessons/' + id + '/';
      lesson.parsed = lesson.sentences.map(parseSentence);
      lesson.words = lesson.words || {};
      lesson.quiz = lesson.quiz || [];
      return lesson;
    }));
  }

  // ---------- speech ----------
  const tts = {
    ok: 'speechSynthesis' in window,
    voices: [],
    voice: null,
    rate: store.get('rate', 0.8),
    token: 0,
    load() {
      if (!this.ok) return;
      const rank = (v) => (/natural|online|neural/i.test(v.name) ? 0 : /microsoft/i.test(v.name) ? 1 : /google/i.test(v.name) ? 2 : 3);
      this.voices = speechSynthesis.getVoices().filter((v) => /^ru/i.test(v.lang)).sort((a, b) => rank(a) - rank(b));
      const saved = store.get('voice', null);
      this.voice = this.voices.find((v) => v.name === saved) || this.voices[0] || null;
    },
    stop() { this.token++; if (this.ok) speechSynthesis.cancel(); },
    // Speaks text; callbacks are ignored once a newer speak/stop happens.
    say(text, cb, queue) {
      if (!this.ok) { if (cb && cb.end) setTimeout(cb.end, 0); return; }
      if (!queue) this.stop();
      const t = this.token;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU';
      if (this.voice) u.voice = this.voice;
      u.rate = this.rate;
      cb = cb || {};
      u.onstart = () => { if (t === this.token && cb.start) cb.start(); };
      u.onboundary = (e) => { if (t === this.token && cb.word && (e.name === 'word' || e.name == null)) cb.word(e.charIndex); };
      u.onend = () => { if (t === this.token && cb.end) cb.end(); };
      u.onerror = (e) => { if (t === this.token && cb.end && e.error !== 'interrupted' && e.error !== 'canceled') cb.end(); };
      speechSynthesis.speak(u);
    }
  };
  if (tts.ok) {
    tts.load();
    speechSynthesis.onvoiceschanged = () => { tts.load(); render(); };
  }

  // ---------- state ----------
  const S = {
    lessons: [],
    lesson: null,
    step: 'listen',
    cur: 0, word: -1, playing: false, voiceMenu: false,
    syl: false, en: false, popup: null, confirmReset: null,
    q: 0, picked: null, firstTry: [], order: []
  };
  const progress = (id) => store.get('progress:' + id, {});
  const mark = (step) => { const p = progress(S.lesson.id); p[step] = true; store.set('progress:' + S.lesson.id, p); };

  // ---------- views ----------
  function voiceBanner() {
    if (tts.ok && tts.voices.length) return '';
    const why = tts.ok ? 'No Russian voice on this computer yet.' : 'This browser cannot speak.';
    return '<div class="banner">' + icon('alert') + '<strong>' + why + '</strong><span>Open this page in Microsoft Edge, or add Russian under Windows Settings › Time &amp; language › Speech.</span></div>';
  }

  function viewHome() {
    const cards = S.lessons.map((l) => {
      const c = COLORS[l.color] || COLORS.blue;
      const p = progress(l.id);
      const started = p.listen || p.read || p.quiz;
      const chips = started
        ? '<div class="chips">' + ['listen', 'read', 'quiz'].map((k) => '<span class="chip' + (p[k] ? ' done' : '') + '">' + (p[k] ? '✓ ' : '') + k[0].toUpperCase() + k.slice(1) + '</span>').join('') + '</div>'
        : '<span class="muted" style="font-weight:700">Not started</span>';
      const reset = started
        ? (S.confirmReset === l.id
          ? '<div class="reset-confirm" role="dialog" aria-label="Reset progress"><strong>Start this lesson over?</strong><span class="muted">Its progress will be cleared.</span>' +
            '<div class="reset-actions"><button class="pill" data-act="reset-no">Cancel</button><button class="pill danger" data-act="reset-yes" data-id="' + esc(l.id) + '">Reset</button></div></div>'
          : '<button class="reset-btn" data-act="reset-ask" data-id="' + esc(l.id) + '" aria-label="Reset progress for ' + esc(l.title.en) + '" title="Reset progress">' + icon('replay', 22, 2.4) + '</button>')
        : '';
      return '<div class="card-wrap"><a class="lesson-card" href="#' + esc(l.id) + '">' +
        '<div class="tile" style="background:' + c[0] + ';color:' + c[1] + '">' + icon(l.icon, 84, 1.8) + '</div>' +
        '<div class="body"><div><div class="ru">' + esc(l.title.ru) + '</div><div class="en">' + esc(l.title.en) + '</div></div>' + chips + '</div></a>' + reset + '</div>';
    }).join('');
    return '<div class="home"><header class="home-head"><div class="brand"><div class="brand-mark" aria-hidden="true">Аб</div><div><h1>Учим русский</h1><p>Pick a lesson to start</p></div></div></header>' +
      voiceBanner() + '<div class="grid">' + cards + '</div></div>';
  }

  function viewTop() {
    const l = S.lesson;
    const c = COLORS[l.color] || COLORS.blue;
    const p = progress(l.id);
    const steps = [['listen', '1 · Listen'], ['read', '2 · Read'], ['quiz', '3 · Quiz']].map(([k, label]) => {
      if (S.step === k) return '<span class="pill current" aria-current="step">' + label + '</span>';
      return '<button class="pill' + (p[k] ? ' done' : '') + '" data-act="step" data-step="' + k + '">' + (p[k] ? icon('check', 18, 3) : '') + label + '</button>';
    }).join('');
    return '<header class="top"><div class="top-left">' +
      '<a class="pill" href="#" data-act="home">' + icon('back', 20, 2.4) + 'Lessons</a>' +
      '<div class="badge" aria-hidden="true" style="background:' + c[0] + ';color:' + c[1] + '">' + icon(l.icon, 28, 2) + '</div>' +
      '<div class="lesson-title"><span class="ru">' + esc(l.title.ru) + '</span><span class="en">' + esc(l.title.en) + '</span></div>' +
      '</div><nav class="steps" aria-label="Lesson steps">' + steps + '</nav></header>';
  }

  function picture(key) {
    const l = S.lesson;
    const img = l.images[key];
    return '<div class="picture"><img src="' + esc(l.base + img.file) + '" alt="' + esc(img.alt) + '"></div>';
  }

  function viewListen() {
    const l = S.lesson;
    const s = l.parsed[S.cur];
    const keys = Object.keys(l.images);
    const usedKeys = keys.filter((k) => l.parsed.some((p) => p.image === k));
    const dots = usedKeys.length > 1 ? '<div class="dots" aria-hidden="true">' + usedKeys.map((k) => '<span class="dot' + (k === s.image ? ' on' : '') + '"></span>').join('') + '</div>' : '';
    const sentences = l.parsed.map((p, i) => {
      const cls = i === S.cur ? ' current' : (i < S.cur ? ' past' : '');
      const words = p.words.map((w, j) => '<button class="word' + (i === S.cur && j === S.word ? ' speaking' : '') + '" data-act="say-word" data-s="' + i + '" data-w="' + j + '" id="w-' + i + '-' + j + '">' + esc(w.display) + '</button>').join('');
      return '<div class="sentence' + cls + '" id="s-' + i + '">' + words + '</div>';
    }).join('');
    const voiceItems = tts.voices.length
      ? tts.voices.map((v, k) => '<button class="' + (v === tts.voice ? 'on' : '') + '" data-act="voice" data-v="' + k + '">' + (v === tts.voice ? '✓ ' : '') + esc(v.name.replace(/^Microsoft\s+/, '').replace(/\s+-\s+Russian.*$/i, '')) + '</button>').join('')
      : '<span class="label">No Russian voices found</span>';
    return viewTop() + '<main class="stage">' +
      '<section class="col-pic" aria-label="Picture">' + picture(s.image) + dots + '</section>' +
      '<section class="col-text" aria-label="Story">' + voiceBanner() +
      '<div class="card story"><span class="story-label">Слушай и следи · Listen and follow along</span>' + sentences + '</div>' +
      '<div class="controls">' +
      '<button class="round big" data-act="play" aria-label="' + (S.playing ? 'Pause' : 'Play') + '">' + (S.playing ? PAUSE : PLAY) + '</button>' +
      '<button class="round" data-act="replay" aria-label="Repeat sentence">' + icon('replay', 24, 2.4) + '</button>' +
      '<div class="voice-wrap"><button class="round" data-act="voice-menu" aria-label="Choose voice" aria-expanded="' + S.voiceMenu + '">' + icon('voice') + '</button>' +
      (S.voiceMenu ? '<div class="voice-menu"><span class="label">Голос · Voice</span>' + voiceItems + '</div>' : '') + '</div>' +
      '<label class="speed"><span aria-hidden="true">Slow</span><input type="range" min="0.5" max="1.2" step="0.1" value="' + tts.rate + '" aria-label="Speed" data-act="rate"><span aria-hidden="true">Fast</span></label>' +
      '<span class="counter">' + (S.cur + 1) + ' / ' + l.parsed.length + '</span></div>' +
      '<div class="row-end"><span class="muted">Tap any word to hear it again.</span><button class="pill primary" data-act="step" data-step="read" data-mark="listen">Next: Read →</button></div>' +
      '</section></main>';
  }

  function viewRead() {
    const l = S.lesson;
    const firstImage = l.parsed[0].image;
    const lines = l.parsed.map((p, i) => {
      const words = p.words.map((w, j) => {
        const inner = S.syl ? w.syllables.map((t, k) => '<span class="s' + (k % 2) + '">' + esc(t) + '</span>').join('') : esc(w.display);
        const picked = S.popup && S.popup[0] === i && S.popup[1] === j;
        return '<button class="word' + (picked ? ' picked' : '') + '" data-act="popup" data-s="' + i + '" data-w="' + j + '" aria-label="' + esc(w.display) + ': show syllables">' + inner + '</button>';
      }).join('');
      return '<div class="rline"><button class="round small" data-act="say-sentence" data-s="' + i + '" aria-label="Hear this sentence">' + icon('speaker', 20, 2.4) + '</button>' +
        '<div><div class="rtext">' + words + '</div>' + (S.en ? '<div class="ren">' + esc(p.en) + '</div>' : '') + '</div></div>';
    }).join('');
    return viewTop() + '<main class="stage">' +
      '<section class="col-pic" aria-label="Picture" style="flex-basis:360px">' + picture(firstImage) + '</section>' +
      '<section class="col-text" aria-label="Story" style="flex-basis:580px">' +
      '<div class="hero"><div class="hero-icon" aria-hidden="true">' + icon('book', 38, 2) + '</div><div><strong>Прочитай вслух!</strong><span>Read the story out loud. Take your time.</span></div></div>' +
      '<div class="toggles"><button class="toggle" data-act="toggle-syl" aria-pressed="' + S.syl + '"><span class="track"></span>По слогам</button>' +
      '<button class="toggle" data-act="toggle-en" aria-pressed="' + S.en + '"><span class="track"></span>English</button></div>' +
      '<div class="card reading' + (S.syl ? ' syl' : '') + '">' + lines + '</div>' +
      '<div class="row-end" style="justify-content:flex-end"><button class="pill primary" data-act="step" data-step="quiz" data-mark="read">I read it! Next: Quiz →</button></div>' +
      '</section></main>' + viewPopup();
  }

  function viewPopup() {
    if (!S.popup) return '';
    const w = S.lesson.parsed[S.popup[0]].words[S.popup[1]];
    const parts = w.syllables.map((t) => t.replace(/[^\p{L}́-]/gu, '')).filter(Boolean);
    const meaning = S.lesson.words[w.key] || '';
    return '<div class="overlay" data-act="close-popup"><div class="popup" role="dialog" aria-modal="true" aria-label="Word by syllables">' +
      '<button class="round close" data-act="close-popup" aria-label="Close">' + icon('close', 22, 2.6) + '</button>' +
      '<span class="kicker">ПО СЛОГАМ</span>' +
      '<div class="syls" style="font-size:' + (parts.join('').length > 9 ? 52 : parts.join('').length > 7 ? 62 : 76) + 'px">' + parts.map((t, k) => '<span class="s' + (k % 2) + '">' + esc(t) + '</span>').join('') + '</div>' +
      '<div><div class="whole">' + esc(parts.join('')) + '</div>' + (meaning ? '<div class="meaning">' + esc(meaning) + '</div>' : '') + '</div>' +
      '<button class="hear" data-act="say-popup">' + icon('speaker', 22, 2.4) + 'Hear it</button>' +
      '</div></div>';
  }

  function viewQuiz() {
    const l = S.lesson;
    const q = l.quiz[S.q];
    const bars = l.quiz.map((_, i) => '<span class="' + (i < S.q ? (S.firstTry[i] ? 'ok' : 'miss') : i === S.q ? 'now' : '') + '"></span>').join('');
    const right = S.picked === q.answer;
    const opts = S.order.map((idx) => {
      const o = q.options[idx];
      let cls = '';
      if (S.picked === idx) cls = idx === q.answer ? ' right' : ' wrong';
      return '<button class="option' + cls + '" data-act="pick" data-o="' + idx + '"' + (right ? ' disabled' : '') + '>' +
        (o.image ? '<span class="img"><img src="' + esc(l.base + o.image) + '" alt=""></span>' : '') +
        '<span class="txt">' + esc(plain(o.text)) + '</span>' +
        (S.picked === idx && right ? '<span class="tick" aria-hidden="true">' + icon('check', 20, 3.2) + '</span>' : '') + '</button>';
    }).join('');
    let fb = '<span class="muted" style="font-size:18px;font-weight:700">Tap the right answer.</span>';
    if (S.picked != null) fb = right
      ? '<div class="feedback good">' + STAR(true).replace('width="56" height="56"', 'width="30" height="30"') + '<strong>Молодец!</strong><span>That\'s right.</span></div>'
      : '<div class="feedback bad"><strong>Попробуй ещё раз</strong><span>Try again</span></div>';
    const last = S.q === l.quiz.length - 1;
    return viewTop() + '<main class="quiz">' +
      '<div style="display:flex;flex-direction:column;gap:10px"><span style="font-size:16px;font-weight:800;color:var(--ink-2)">Вопрос ' + (S.q + 1) + ' из ' + l.quiz.length + ' · Question ' + (S.q + 1) + ' of ' + l.quiz.length + '</span>' +
      '<div class="progress" style="grid-template-columns:repeat(' + l.quiz.length + ',minmax(0,1fr))" aria-hidden="true">' + bars + '</div></div>' +
      '<div class="card question"><button class="round big" data-act="say-q" aria-label="Hear the question">' + icon('speakerLoud', 34, 2.2) + '</button>' +
      '<div><div class="ru">' + esc(plain(q.prompt.ru)) + '</div><div class="en">' + esc(q.prompt.en) + '</div></div></div>' +
      '<div class="options">' + opts + '</div>' +
      '<div class="row-end" style="min-height:76px">' + fb + '<button class="pill primary" data-act="next-q"' + (right ? '' : ' disabled') + '>' + (last ? 'Finish →' : 'Next question →') + '</button></div>' +
      '</main>';
  }

  function viewDone() {
    const total = S.lesson.quiz.length;
    const good = S.firstTry.filter(Boolean).length;
    const stars = good === total ? 3 : good >= Math.ceil(total / 2) ? 2 : 1;
    return viewTop().replace('aria-current="step">3 · Quiz', 'aria-current="step">✓ Done') +
      '<div class="card finish"><div class="stars">' + STAR(stars >= 1) + STAR(stars >= 2) + STAR(stars >= 3) + '</div>' +
      '<h2>Урок пройден!</h2><p class="muted" style="font-size:20px;margin:0">Lesson complete — ' + good + ' of ' + total + ' right on the first try.</p>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><button class="pill" style="height:54px" data-act="step" data-step="listen">Start again</button><a class="pill primary" href="#" data-act="home">Back to lessons</a></div></div>';
  }

  function viewError(err) {
    return '<div class="card error"><h2 style="font-family:var(--display);margin-top:0">Something is wrong with the lessons</h2>' +
      '<p>The app could not load. The message below says which file to fix.</p><pre>' + esc(err.message || err) + '</pre>' +
      '<p class="muted">Tip: opening index.html by double-click does not work — the page has to be served (GitHub Pages, or a local server).</p></div>';
  }

  // ---------- render + routing ----------
  function render() {
    if (!S.lessons.length && !S.lesson) return;
    let html;
    if (!S.lesson) html = viewHome();
    else if (S.step === 'listen') html = viewListen();
    else if (S.step === 'read') html = viewRead();
    else if (S.step === 'quiz') html = viewQuiz();
    else html = viewDone();
    $app.innerHTML = html;
  }

  function goStep(step) {
    tts.stop();
    Object.assign(S, { step, playing: false, word: -1, voiceMenu: false, popup: null });
    if (step === 'listen') S.cur = 0;
    if (step === 'quiz') startQuestion(0, true);
    render();
    window.scrollTo(0, 0);
  }

  function startQuestion(i, reset) {
    if (reset) S.firstTry = [];
    S.q = i; S.picked = null;
    S.order = shuffle(S.lesson.quiz[i].options.map((_, k) => k));
  }

  function route() {
    tts.stop();
    const id = decodeURIComponent(location.hash.slice(1));
    S.lesson = S.lessons.find((l) => l.id === id) || null;
    S.playing = false;
    if (S.lesson) goStep('listen'); else render();
  }

  // ---------- listen playback ----------
  function highlightWord(i, j) {
    document.querySelectorAll('.word.speaking').forEach((el) => el.classList.remove('speaking'));
    const el = document.getElementById('w-' + i + '-' + j);
    if (el) el.classList.add('speaking');
  }
  function playFrom(i, single) {
    const l = S.lesson;
    S.cur = i; S.word = -1; S.playing = true;
    render();
    const s = l.parsed[i];
    tts.say(s.speak, {
      word: (ci) => {
        let j = 0;
        while (j + 1 < s.words.length && s.words[j + 1].start <= ci) j++;
        S.word = j; highlightWord(i, j);
      },
      end: () => {
        S.word = -1;
        if (!single && i + 1 < l.parsed.length) { playFrom(i + 1, false); return; }
        S.playing = false;
        if (!single && i + 1 >= l.parsed.length) mark('listen');
        render();
      }
    });
  }

  // ---------- events ----------
  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const l = S.lesson;
    switch (act) {
      case 'reset-ask': S.confirmReset = el.dataset.id; render(); break;
      case 'reset-no': S.confirmReset = null; render(); break;
      case 'reset-yes': store.set('progress:' + el.dataset.id, {}); S.confirmReset = null; render(); break;
      case 'home': e.preventDefault(); location.hash = ''; if (!location.hash) route(); break;
      case 'step': if (el.dataset.mark) mark(el.dataset.mark); goStep(el.dataset.step); break;
      case 'play':
        if (S.playing) { tts.stop(); S.playing = false; S.word = -1; render(); }
        else playFrom(S.cur >= l.parsed.length - 1 && S.word === -1 && S.cur !== 0 ? 0 : S.cur, false);
        break;
      case 'replay': playFrom(S.cur, true); break;
      case 'voice-menu': S.voiceMenu = !S.voiceMenu; render(); break;
      case 'voice':
        tts.voice = tts.voices[+el.dataset.v] || tts.voice;
        if (tts.voice) store.set('voice', tts.voice.name);
        S.voiceMenu = false; render();
        tts.say('Привет! Давай читать.');
        break;
      case 'say-word': {
        const w = l.parsed[+el.dataset.s].words[+el.dataset.w];
        S.playing = false; tts.say(w.speak.replace(/[^\p{L}\s-]/gu, ''));
        if (S.step === 'listen') { S.cur = +el.dataset.s; S.word = +el.dataset.w; render(); }
        break;
      }
      case 'say-sentence': tts.say(l.parsed[+el.dataset.s].speak); break;
      case 'toggle-syl': S.syl = !S.syl; render(); break;
      case 'toggle-en': S.en = !S.en; render(); break;
      case 'popup': S.popup = [+el.dataset.s, +el.dataset.w]; render(); break;
      case 'close-popup': if (e.target === el || el.classList.contains('close')) { S.popup = null; render(); } break;
      case 'say-popup': {
        const w = l.parsed[S.popup[0]].words[S.popup[1]];
        tts.say(w.speak.replace(/[^\p{L}\s-]/gu, ''));
        break;
      }
      case 'say-q': tts.say(plain(l.quiz[S.q].prompt.ru)); break;
      case 'pick': {
        const q = l.quiz[S.q];
        const idx = +el.dataset.o;
        if (S.picked === q.answer) break;
        if (S.firstTry[S.q] === undefined) S.firstTry[S.q] = idx === q.answer;
        S.picked = idx;
        render();
        tts.say(plain(q.options[idx].text));
        tts.say(idx === q.answer ? 'Молодец!' : 'Попробуй ещё раз.', null, true);
        break;
      }
      case 'next-q':
        tts.stop();
        if (S.q + 1 < l.quiz.length) { startQuestion(S.q + 1); render(); }
        else { mark('quiz'); S.step = 'done'; render(); }
        window.scrollTo(0, 0);
        break;
    }
  });
  $app.addEventListener('input', (e) => {
    if (e.target.dataset.act === 'rate') { tts.rate = +e.target.value; store.set('rate', tts.rate); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.popup) { S.popup = null; render(); }
    else if (S.confirmReset) { S.confirmReset = null; render(); }
  });
  window.addEventListener('hashchange', route);

  // ---------- start ----------
  loadLessons()
    .then((lessons) => { S.lessons = lessons; route(); })
    .catch((err) => { console.error(err); $app.innerHTML = viewError(err); });
})();
