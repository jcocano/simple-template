import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FIXTURES_DIR = path.join(REPO_ROOT, 'fixtures', 'test-docs');

function hasScriptTag(html) {
  return /<script[\s>]/i.test(html);
}

function hasInlineEventHandler(html) {
  return /<[^>]+\son\w+\s*=/i.test(html);
}

function hasJavascriptHref(html) {
  return /<a\b[^>]*\bhref\s*=\s*["']\s*javascript:/i.test(html);
}

async function loadDocToEmailHtml() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smoke-export-'));
  const bundlePath = path.join(tempDir, 'bundle.mjs');
  const exportHtmlPath = path.join(REPO_ROOT, 'src', 'lib', 'export-html.tsx');
  globalThis.window = globalThis.window || {};

  await build({
    entryPoints: [exportHtmlPath],
    outfile: bundlePath,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
    loader: { '.tsx': 'tsx' },
    define: {
      window: 'globalThis.window',
    },
  });

  await import(`${pathToFileURL(bundlePath).href}?v=${Date.now()}`);
  if (typeof globalThis.window.docToEmailHtml !== 'function') {
    throw new Error('No se pudo cargar docToEmailHtml para smoke tests.');
  }
  return globalThis.window.docToEmailHtml;
}

function validateGlobalSecurity(name, html) {
  assert.ok(!hasScriptTag(html), `${name}: se filtró <script>`);
  assert.ok(!hasInlineEventHandler(html), `${name}: se filtró on*=`);
  assert.ok(!hasJavascriptHref(html), `${name}: se filtró javascript: en href`);
  assert.ok(html.startsWith('<!DOCTYPE html>'), `${name}: falta <!DOCTYPE html>`);
}

function validateFixtureBasics(name, html, warnings) {
  if (name === 'empty') {
    assert.ok(!html.includes('class="st-sec-'), 'empty: no debería renderizar secciones');
    return;
  }

  if (name === 'all-blocks') {
    const ids = Array.from({ length: 24 }, (_, i) => `b${String(i + 1).padStart(2, '0')}`);
    for (const id of ids) {
      assert.ok(html.includes(`st-blk-${id}`), `all-blocks: falta render para ${id}`);
    }
    assert.ok(Array.isArray(warnings), 'all-blocks: warnings debe ser array');
    return;
  }

  if (name === 'mobile-overrides') {
    assert.ok(html.includes('@media (max-width:600px)'), 'mobile-overrides: falta bloque @media');
    assert.ok(
      html.includes('.st-sec-mobsec { display:none !important; mso-hide:all; }'),
      'mobile-overrides: falta regla hide mobile de sección',
    );
    assert.ok(
      html.includes('.st-blk-mob-hidden { display:none !important; mso-hide:all; }'),
      'mobile-overrides: falta regla hide mobile de bloque',
    );
  }
}

async function readFixture(name) {
  const fixturePath = path.join(FIXTURES_DIR, `${name}.json`);
  const raw = await fs.readFile(fixturePath, 'utf8');
  return JSON.parse(raw);
}

async function run() {
  const docToEmailHtml = await loadDocToEmailHtml();
  const fixtures = ['empty', 'all-blocks', 'mobile-overrides'];

  for (const name of fixtures) {
    const doc = await readFixture(name);
    const { html, warnings } = docToEmailHtml(doc, {
      lang: 'es',
      mergeDialect: 'sendgrid',
      minify: false,
    });

    validateGlobalSecurity(name, html);
    validateFixtureBasics(name, html, warnings);
    console.log(`✓ ${name}`);
  }

  console.log('\nSmoke export tests OK');
}

run().catch((err) => {
  console.error('Smoke export tests FAILED');
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
