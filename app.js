// UI wiring: applies Formatter styles to the selection, updates the stats,
// and remembers the draft in localStorage.
(function () {
  'use strict';

  const STORAGE_KEY = 'linkedin-text-formatter:v1';
  const SAMPLE = 'We closed 12 new clients in Q3.\n\nThree things that made the difference:\nReplying to every lead within 1 hour\nSending a short video instead of a PDF proposal\nFollowing up 5 times, not 2\n\nWhat would you add?';

  const $ = (id) => document.getElementById(id);
  const post = $('post');
  const nf = new Intl.NumberFormat();

  function load() {
    try { const v = localStorage.getItem(STORAGE_KEY); return v === null ? SAMPLE : v; } catch { return SAMPLE; }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, post.value); } catch { /* storage unavailable */ }
  }

  function render() {
    const s = Formatter.stats(post.value);
    $('count').textContent = nf.format(s.length);
    $('remaining').textContent = nf.format(s.remaining);
    $('words').textContent = nf.format(s.words);
    $('over').hidden = !s.over;
    $('meter-bar').style.width = Math.min(100, (s.length / Formatter.LIMIT) * 100) + '%';
    $('meter-bar').classList.toggle('over', s.over);
    $('preview').textContent = s.preview + (s.truncated ? '…see more' : '');
    save();
  }

  // Replace the selection (or everything) with fn(selectedText) and keep it selected.
  function transform(fn, wholeLines) {
    let start = post.selectionStart;
    let end = post.selectionEnd;
    if (start === end) { start = 0; end = post.value.length; }
    if (wholeLines) {
      start = post.value.lastIndexOf('\n', start - 1) + 1;
      if (end > start && post.value[end - 1] === '\n') end -= 1;
      const nl = post.value.indexOf('\n', end);
      end = nl === -1 ? post.value.length : nl;
    }
    const out = fn(post.value.slice(start, end));
    post.setRangeText(out, start, end, 'select');
    post.focus();
    render();
  }

  document.querySelectorAll('[data-style]').forEach((b) => {
    b.addEventListener('click', () => transform((t) => Formatter.applyStyle(t, b.dataset.style)));
  });
  document.querySelectorAll('[data-bullet]').forEach((b) => {
    b.addEventListener('click', () => transform((t) => Formatter.bulletLines(t, b.dataset.bullet), true));
  });

  post.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const style = { b: 'bold', i: 'italic' }[e.key.toLowerCase()];
    if (style) { e.preventDefault(); transform((t) => Formatter.applyStyle(t, style)); }
  });
  post.addEventListener('input', render);

  function flash(msg) {
    $('status').textContent = msg;
    setTimeout(() => { $('status').textContent = ''; }, 2000);
  }

  $('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(post.value); flash('Copied'); } catch {
      post.select(); document.execCommand('copy'); flash('Copied');
    }
  });

  $('reset').addEventListener('click', () => { post.value = SAMPLE; render(); });

  post.value = load();
  render();
})();
