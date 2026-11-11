(function (root) {
  function assignCodes(keys, existing = {}) {
    const assignments = Object.assign(Object.create(null), existing);
    const used = new Set();
    for (const code of Object.values(assignments)) {
      if (typeof code !== 'string' || !/^\d{4}$/.test(code) || used.has(code)) throw new Error('Invalid code registry');
      used.add(code);
    }
    for (const key of keys) {
      if (Object.hasOwn(assignments, key)) continue;
      let hash = 2166136261;
      for (const character of key) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
      const start = (hash >>> 0) % 10000;
      for (let offset = 0; offset < 10000; offset++) {
        const code = String((start + offset) % 10000).padStart(4, '0');
        if (!used.has(code)) { assignments[key] = code; used.add(code); break; }
      }
    }
    return assignments;
  }
  if (typeof module === 'object' && module.exports) module.exports = { assignCodes };
  else root.ShelfLifeDiscountCodes = { assignCodes };
})(typeof window === 'object' ? window : globalThis);
