const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { analyzePhoto } = require('./ai');

const root = path.join(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function createServer({ analyze = analyzePhoto } = {}) {
  let aiBusy = false;
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.url === '/api/analyze' && req.method === 'POST') {
      const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(body)); };
      // Only same-origin JSON requests can spend the configured API quota.
      if (req.headers.origin && ![`http://${req.headers.host}`, `https://${req.headers.host}`].includes(req.headers.origin)) return send(403, {error:'Request origin is not allowed.'});
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, {error:'Expected JSON.'});
      if (aiBusy) return send(429, {error:'Another photo is being analyzed. Try again shortly.'});
      aiBusy = true;
      try {
        const chunks = []; let length = 0;
        for await (const chunk of req) {
          length += chunk.length;
          if (length > 4_100_000) { send(413, {error:'Photo is too large.'}); return; }
          chunks.push(chunk);
        }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString()); }
        catch { return send(400, {error:'Invalid JSON.'}); }
        const observations = await analyze(body.image);
        send(200, {observations});
      } catch (error) {
        send(error.status || 502, {error:error.status ? error.message : 'AI analysis failed. Try again or continue manually.'});
      } finally { aiBusy = false; }
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    let filename;
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filename.startsWith(root + path.sep) || pathname.includes('\\') || pathname.includes('\0')) throw new Error();
    } catch {
      res.writeHead(400);
      return res.end('Invalid path');
    }
    try {
      const content = await fs.readFile(filename);
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

if (require.main === module) {
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(Number(process.env.PORT || 8000), process.env.HOST || '127.0.0.1', () => {
    console.log(`Shelf Life: http://localhost:${server.address().port}`);
  });
}
module.exports = { createServer };
