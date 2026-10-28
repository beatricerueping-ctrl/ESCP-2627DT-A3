const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');
let server, origin;
before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
test('serves the app and camera module with a self-only camera policy', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('permissions-policy'), 'camera=(self), microphone=()');
  assert.match(await response.text(), /camera.js/);
  for (const file of ['app.js', 'camera.js', 'geo.js', 'style.css', 'leaflet.min.css', 'manifest.webmanifest', 'icon.svg']) {
    assert.equal((await fetch(`${origin}/${file}`)).status, 200, file);
  }
});
test('does not expose repository files or accept writes', async () => {
  assert.equal((await fetch(`${origin}/package.json`)).status, 404);
  assert.equal((await fetch(`${origin}/%2e%2e%2fpackage.json`)).status, 400);
  assert.equal((await fetch(origin, {method:'POST'})).status, 405);
});
test('AI endpoint rejects cross-origin spending and invalid request formats', async () => {
  assert.equal((await fetch(`${origin}/api/analyze`, {method:'POST', headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'})).status, 403);
  assert.equal((await fetch(`${origin}/api/analyze`, {method:'POST', body:'{}'})).status, 415);
  assert.equal((await fetch(`${origin}/api/analyze`, {method:'POST',headers:{'Content-Type':'application/json'},body:'not-json'})).status, 400);
});
