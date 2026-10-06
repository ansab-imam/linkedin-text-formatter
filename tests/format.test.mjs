import test from 'node:test';
import assert from 'node:assert/strict';

// format.js is a classic script that registers itself on globalThis.
await import('../format.js');
const { applyStyle, toPlain, bulletLines, stats, LIMIT } = globalThis.Formatter;

test('bold converts letters and digits', () => {
  assert.equal(applyStyle('Hi 5', 'bold'), '𝗛𝗶 𝟱');
});

test('italic leaves digits and punctuation alone', () => {
  assert.equal(applyStyle('Go 2x!', 'italic'), '𝘎𝘰 2𝘹!');
});

test('bold italic and monospace', () => {
  assert.equal(applyStyle('Ab', 'boldItalic'), '𝘼𝙗');
  assert.equal(applyStyle('a1', 'monospace'), '𝚊𝟷');
});

test('strikethrough skips whitespace', () => {
  assert.equal(applyStyle('a b', 'strike'), 'a̶ b̶');
});

test('restyling starts from plain text', () => {
  assert.equal(applyStyle(applyStyle('Sales', 'bold'), 'italic'), applyStyle('Sales', 'italic'));
});

test('toPlain reverses every style', () => {
  const src = 'Q4 Pipeline: up 32%!';
  for (const s of ['bold', 'italic', 'boldItalic', 'monospace', 'strike']) {
    assert.equal(toPlain(applyStyle(src, s)), src, s);
  }
});

test('non-Latin text and emoji pass through', () => {
  assert.equal(applyStyle('café 🚀', 'bold'), '𝗰𝗮𝗳é 🚀');
});

test('unknown style throws', () => {
  assert.throws(() => applyStyle('x', 'neon'), /Unknown style/);
});

test('bullets skip blank lines and replace existing bullets', () => {
  assert.equal(bulletLines('one\n\n- two', '•'), '• one\n\n• two');
  assert.equal(bulletLines('a\nb\nc', 'number'), '1. a\n2. b\n3. c');
  assert.equal(bulletLines('1. a\n2. b', '✅'), '✅ a\n✅ b');
});

test('stats counts styled letters as two characters', () => {
  const s = stats(applyStyle('abc', 'bold') + ' de');
  assert.equal(s.length, 9);
  assert.equal(s.words, 2);
  assert.equal(s.remaining, LIMIT - 9);
  assert.equal(s.over, false);
});

test('stats flags posts over the limit and the see-more cut', () => {
  const s = stats('x'.repeat(3001));
  assert.equal(s.over, true);
  assert.equal(s.truncated, true);
  assert.equal(stats('').words, 0);
  assert.equal(stats('a\nb\nc\nd').preview, 'a\nb\nc');
});
