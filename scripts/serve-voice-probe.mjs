import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('./voice-feasibility.html', import.meta.url));
const server = createServer((request, response) => {
  if (request.method !== 'GET' || request.url !== '/') {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    'Permissions-Policy': 'microphone=(self)',
  });
  response.end(page);
});
server.on('error', () => { console.error('Cannot start local microphone probe on port 3001.'); process.exitCode = 1; });
server.listen(3001, '127.0.0.1', () => console.log('Local microphone probe: http://127.0.0.1:3001 — Ctrl+C to stop.'));
