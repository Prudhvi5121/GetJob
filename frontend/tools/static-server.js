const http = require('http');
const fs = require('fs');
const path = require('path');
const dist = path.resolve(__dirname, '..', 'dist');
const port = process.env.PORT || 4300;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Proxy API requests to backend
  if (req.url.startsWith('/api')) {
    const backendReq = http.request({ hostname: '127.0.0.1', port: 3000, path: req.url, method: req.method, headers: req.headers }, backendRes => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res, { end: true });
    });
    req.pipe(backendReq, { end: true });
    return;
  }

  let p = path.join(dist, req.url.split('?')[0]);
  if (req.url === '/' || req.url === '') p = path.join(dist, 'index.html');
  fs.stat(p, (err, st) => {
    if (err || st.isDirectory()) {
      // fallback to index.html for SPA
      p = path.join(dist, 'index.html');
    }
    fs.readFile(p, (err2, data) => {
      if (err2) { res.statusCode = 404; res.end('Not found'); return; }
      const ext = path.extname(p);
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
});

server.listen(port, () => console.log('Static server listening on http://127.0.0.1:' + port));

process.on('SIGINT', () => server.close(() => process.exit()));
