// Pure text formatting, shared by the browser and the tests.
// Written as a plain script that attaches to globalThis (no import/export) so it
// loads via a classic <script> tag on file:// and can still be imported by Node.
(function (root) {
  'use strict';

  const LIMIT = 3000;

  // Start code points of the Unicode "Mathematical Alphanumeric Symbols" blocks.
  // null means the style has no digits, so digits are left as they are.
  const STYLES = {
    bold:       { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
    italic:     { upper: 0x1d608, lower: 0x1d622, digit: null },
    boldItalic: { upper: 0x1d63c, lower: 0x1d656, digit: null },
    monospace:  { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
  };

  const STRIKE = '̶';

  // Reverse lookup: styled character -> plain ASCII character.
  const PLAIN = new Map();
  Object.values(STYLES).forEach((s) => {
    for (let i = 0; i < 26; i++) {
      PLAIN.set(String.fromCodePoint(s.upper + i), String.fromCharCode(65 + i));
      PLAIN.set(String.fromCodePoint(s.lower + i), String.fromCharCode(97 + i));
    }
    if (s.digit) {
      for (let i = 0; i < 10; i++) PLAIN.set(String.fromCodePoint(s.digit + i), String(i));
    }
  });

  function toPlain(text) {
    return Array.from(String(text).replaceAll(STRIKE, ''), (ch) => PLAIN.get(ch) || ch).join('');
  }

  function applyStyle(text, style) {
    const plain = toPlain(text);
    if (style === 'plain') return plain;
    if (style === 'strike') {
      return Array.from(plain, (ch) => (/\s/.test(ch) ? ch : ch + STRIKE)).join('');
    }
    const s = STYLES[style];
    if (!s) throw new Error(`Unknown style: ${style}`);
    return Array.from(plain, (ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(s.upper + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(s.lower + c - 97);
      if (c >= 48 && c <= 57 && s.digit) return String.fromCodePoint(s.digit + c - 48);
      return ch;
    }).join('');
  }

  // Prefix every non-empty line with a bullet. Existing bullets are replaced.
  const BULLET_RE = /^\s*(?:[•▪►✅➜→\-*]|\d+\.)\s+/u;
  function bulletLines(text, bullet) {
    let n = 0;
    return String(text).split('\n').map((line) => {
      if (!line.trim()) return line;
      const body = line.replace(BULLET_RE, '');
      n += 1;
      return (bullet === 'number' ? `${n}.` : bullet) + ' ' + body;
    }).join('\n');
  }

  // LinkedIn counts UTF-16 code units, so styled letters count as 2 each.
  function stats(text) {
    const t = String(text);
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    const length = t.length;
    // Roughly where LinkedIn cuts the post with "...see more".
    const preview = t.split('\n').slice(0, 3).join('\n').slice(0, 210);
    return { length, words, remaining: LIMIT - length, over: length > LIMIT, preview, truncated: preview.length < t.length };
  }

  root.Formatter = { LIMIT, STYLES: Object.keys(STYLES).concat('strike'), applyStyle, toPlain, bulletLines, stats };
})(globalThis);
