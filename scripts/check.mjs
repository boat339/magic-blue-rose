import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
assert.match(html, /^<!doctype html>/i);
assert.match(html, /<title>[^<]+<\/title>/);
assert.match(html, /lang="zh-CN"/);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
for (const m of html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g))
  assert.ok(existsSync(resolve(root, m[1])), m[1]);
const app = readFileSync(resolve(root, 'assets/js/app.js'), 'utf8');
new Script(app);
for (const m of app.matchAll(/getElementById\('([^']+)'\)/g))
  if (!['fish'].includes(m[1]))
    assert.ok(ids.includes(m[1]), 'Missing ID: ' + m[1]);
console.log(
  'PASS: HTML, local assets, unique IDs, JavaScript syntax and literal DOM references',
);
