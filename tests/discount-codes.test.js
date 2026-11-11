const {test} = require('node:test');
const assert = require('node:assert/strict');
const {assignCodes} = require('../public/discount-codes');
test('item/location pairs have distinct, stable four-digit codes', () => {
  const keys = Array.from({length:160}, (_, index) => JSON.stringify(['sample', `store-${Math.floor(index / 16)}`, `item-${index % 16}`]));
  const codes = assignCodes(keys);
  assert.equal(new Set(Object.values(codes)).size, keys.length);
  assert.ok(Object.values(codes).every(code => /^\d{4}$/.test(code)));
  assert.deepEqual(assignCodes([...keys].reverse(), JSON.parse(JSON.stringify(codes))), codes);
});
test('hash collisions are resolved without changing existing assignments', () => {
  const candidate = assignCodes(['new']).new;
  const codes = assignCodes(['new'], {existing:candidate});
  assert.equal(codes.existing, candidate);
  assert.notEqual(codes.new, candidate);
});
test('full code space never reuses codes or returns a fifth digit', () => {
  const existing = Object.fromEntries(Array.from({length:10000}, (_, index) => [`item-${index}`, String(index).padStart(4,'0')]));
  const codes = assignCodes(['extra'], existing);
  assert.equal(codes.extra, undefined);
  assert.equal(Object.keys(codes).length, 10000);
});
