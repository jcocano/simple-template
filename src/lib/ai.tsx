// AI renderer facade. Exposes two high-level operations:
//
//   stAI.improveText({ block, action, extra, lang })
//     → { ok, variants: [string, string, string] } | { ok: false, error }
//
//   stAI.generateTemplate({ prompt, tone, length, blocks })
//     → { ok, doc: { sections: [...] } } | { ok: false, error }
//
// Both read the AI cfg from settings (getSetting('ai')) + the API key from
// workspace secrets (key `ai:<provider>:key`), build a provider-agnostic
// payload, and call window.ai.complete in the main process.
//
// Key migration: on first access after K.3 ships, if there's a legacy
// `ai.key` sitting in plaintext settings, it gets moved to secrets and
// cleared from settings. Done lazily by `resolveApiKey` below.

const PROVIDER_DEFAULTS = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4.1',
  google: 'gemini-2.5-flash',
  ollama: 'llama3.3',
};

const ALLOWED_BLOCK_TYPES = new Set([
  'header', 'hero', 'heading', 'text', 'button', 'image',
  'divider', 'spacer', 'product', 'footer', 'icon', 'social', 'html',
]);

async function resolveApiKey(aiCfg) {
  const provider = aiCfg.provider || 'anthropic';
  if (provider === 'ollama') return null; // ollama doesn't use a key
  const secretKey = `ai:${provider}:key`;
  try {
    const fromSecrets = await window.stStorage.secrets.get(secretKey);
    if (fromSecrets) return fromSecrets;
  } catch {}
  // Legacy migration: old builds stored the key in plaintext under ai.key.
  // Move it to secrets and clear the plaintext copy so the next read uses
  // the encrypted store.
  if (aiCfg.key) {
    try {
      await window.stStorage.secrets.set(secretKey, aiCfg.key);
      const next = { ...aiCfg, key: undefined };
      delete next.key;
      window.stStorage.setSetting('ai', next);
      return aiCfg.key;
    } catch {}
    return aiCfg.key;
  }
  return null;
}

// Map of error codes → user-facing Spanish copy. Keeps messages consistent
// across operations (improveText, generateTemplate) and provider quirks.
function friendlyError(result) {
  if (result?.ok) return null;
  const code = result?.code;
  const raw = result?.error;
  switch (code) {
    case 'AUTH':
      return 'La API key fue rechazada por el proveedor. Revisá Ajustes → IA.';
    case 'RATE_LIMIT':
      return 'El proveedor limitó las llamadas temporalmente. Esperá unos segundos y reintentá.';
    case 'NETWORK':
      return raw || 'No se pudo conectar con el proveedor de IA.';
    case 'PARSE':
      return 'La respuesta del modelo no pudo leerse. Reintentá — suele ser un hiccup del proveedor.';
    case 'SERVER':
      return 'El proveedor devolvió un error del servidor. Reintentá en un momento.';
    default:
      return raw || 'Error desconocido al llamar al proveedor de IA.';
  }
}

async function callModel({ system, user, responseFormat, maxTokens = 1024, temperature = 0.7, op = 'other' }) {
  const aiCfg = window.stStorage.getSetting('ai', {}) || {};
  if (aiCfg.enabled === false) {
    return { ok: false, error: 'La IA está desactivada. Activala en Ajustes → Inteligencia artificial.' };
  }
  const provider = aiCfg.provider || 'anthropic';
  const model = aiCfg.model || PROVIDER_DEFAULTS[provider];
  const apiKey = await resolveApiKey(aiCfg);
  if (provider !== 'ollama' && !apiKey) {
    return { ok: false, error: 'Falta la API key del proveedor. Configurala en Ajustes → IA.' };
  }
  if (!window.ai || typeof window.ai.complete !== 'function') {
    return { ok: false, error: 'El puente de IA no está disponible (abrí la app en Electron).' };
  }
  const result = await window.ai.complete({
    provider,
    model,
    apiKey,
    ollamaUrl: aiCfg.ollamaUrl,
    system,
    user,
    maxTokens,
    temperature,
    responseFormat,
  });

  // Fire-and-forget log when the user has history enabled. We don't await
  // and we swallow errors — logging must never block the AI response.
  if (aiCfg.log === true && window.ai?.log) {
    const wsId = window.stStorage.getCurrentWorkspaceId();
    if (wsId) {
      window.ai.log.add(wsId, {
        provider, model, op,
        prompt: user,
        response: result.ok ? result.text : null,
        usage: result.usage || null,
        ok: result.ok,
        error: result.ok ? null : (result.error || 'Error desconocido'),
      }).catch(() => {});
    }
  }

  if (!result.ok) {
    return { ok: false, error: friendlyError(result), code: result.code };
  }
  return { ok: true, text: result.text, usage: result.usage };
}

// Strip common wrappers: markdown code fences, leading explanatory prose.
function stripJsonWrapper(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  // ```json\n...\n```
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  // First { or [ to last matching
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  const start = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start > 0) s = s.slice(start);
  return s.trim();
}

function tryParseJSON(raw) {
  try { return JSON.parse(raw); } catch {}
  const stripped = stripJsonWrapper(raw);
  try { return JSON.parse(stripped); } catch {}
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// improveText — 3 variants for a single block
// ═══════════════════════════════════════════════════════════════════

const IMPROVE_ACTION_COPY = {
  rewrite: 'reescribilo manteniendo el sentido original pero con otras palabras',
  shorten: 'acortalo a la mitad de palabras manteniendo la idea principal',
  expand: 'ampliarlo con más contexto y detalle útil, sin rellenar',
  tone: 'cambiá el tono al indicado por el usuario',
  translate: 'traducilo al idioma indicado, preservando el tono',
  fix: 'corregí ortografía, gramática, y mejorá la claridad',
  clearer: 'hacelo más claro, con frases cortas y menos relleno',
  friendly: 'pasalo a tono más cercano y conversacional',
  pro: 'pasalo a tono más profesional y formal',
  short: 'acortalo a la mitad',
};

function getBlockText(block) {
  const c = block?.data?.content || {};
  return (
    c.text || c.body || c.label || c.heading ||
    block?.data?.text || block?.data?.label || block?.data?.heading ||
    block?.data?.body || ''
  );
}

async function improveText({ block, action = 'rewrite', extra = '', lang = 'es' } = {}) {
  if (!block) return { ok: false, error: 'No hay bloque seleccionado.' };
  const currentText = getBlockText(block);
  if (!currentText) return { ok: false, error: 'El bloque no tiene texto que mejorar.' };

  const aiCfg = window.stStorage.getSetting('ai', {}) || {};
  const tone = aiCfg.tone || 'neutral';
  const brandRules = aiCfg.brandRules || '';

  const actionCopy = IMPROVE_ACTION_COPY[action] || IMPROVE_ACTION_COPY.rewrite;
  const languageHint = action === 'translate'
    ? `Traducí al idioma "${lang || 'en'}".`
    : `Respondé en el mismo idioma del texto original.`;

  const system = [
    'Sos un editor de copy para emails marketing. Devolvés SIEMPRE JSON válido, sin ningún texto antes o después.',
    `El formato de respuesta es: {"variants": ["v1", "v2", "v3"]}`,
    `Cada variante debe ser una versión alternativa del texto original siguiendo la instrucción del usuario.`,
    `Tono por defecto: ${tone}.`,
    brandRules ? `Reglas de marca a respetar:\n${brandRules}` : '',
    languageHint,
    'No incluyas comillas extra, ni markdown, ni explicaciones. Solo el objeto JSON.',
  ].filter(Boolean).join('\n\n');

  const user = [
    `Texto original:\n"""${currentText}"""`,
    `Instrucción: ${actionCopy}.`,
    extra ? `Detalles adicionales del usuario: ${extra}` : '',
    `Generá exactamente 3 variantes distintas entre sí. Ninguna puede ser idéntica al original.`,
  ].filter(Boolean).join('\n\n');

  const result = await callModel({ system, user, responseFormat: 'json', maxTokens: 800, temperature: 0.8, op: 'improve' });
  if (!result.ok) return result;

  const parsed = tryParseJSON(result.text);
  const variants = parsed?.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    return { ok: false, error: 'La respuesta del modelo no tuvo el formato esperado. Reintentá.' };
  }
  return {
    ok: true,
    variants: variants.slice(0, 3).map(v => String(v || '').trim()).filter(Boolean),
    usage: result.usage,
  };
}

// ═══════════════════════════════════════════════════════════════════
// generateTemplate — full doc.sections from a prompt
// ═══════════════════════════════════════════════════════════════════

async function generateTemplate({ prompt, tone, length = 'medio', blocks = [] } = {}) {
  if (!prompt || !prompt.trim()) return { ok: false, error: 'Escribí un prompt describiendo el correo.' };

  const aiCfg = window.stStorage.getSetting('ai', {}) || {};
  const defaultTone = tone || aiCfg.tone || 'neutral';
  const brandRules = aiCfg.brandRules || '';
  const lang = aiCfg.lang || 'es-MX';

  const lenCopy = length === 'corto'
    ? 'Hacelo CORTO (3-4 secciones máximo, texto conciso).'
    : length === 'largo'
      ? 'Hacelo DETALLADO (6-8 secciones, con cuerpo extenso donde tenga sentido).'
      : 'De extensión media (4-5 secciones).';

  const blocksHint = blocks.length
    ? `Elementos preferidos por el usuario: ${blocks.join(', ')}. Usalos si tienen sentido.`
    : '';

  const system = [
    'Sos un diseñador de emails. Devolvés SIEMPRE JSON válido siguiendo este schema exacto, sin texto antes o después:',
    `{
  "sections": [
    {
      "layout": "1col" | "2col" | "3col",
      "blocks": [ { "type": "...", ...fields } ],          // for 1col
      "columns": [ [ { "type": "..." } ], [ ... ] ]         // for 2col/3col (array per column)
    }
  ]
}`,
    'Tipos de block válidos: header, hero, heading, text, button, image, divider, spacer, product, footer, icon, social.',
    'Campos por tipo:',
    '  header: { brand: "string", sub?: "string" }',
    '  hero: { heading: "string", body: "string" }',
    '  heading: { text: "string" }',
    '  text: { body: "string" }',
    '  button: { label: "string", url: "string" }',
    '  image: { alt: "string" }          (la URL real la pone el usuario después)',
    '  product: { name: "string", price: "string" }',
    '  footer: { company: "string", notice: "string" }',
    '  icon: { emoji: "string", text?: "string" }',
    '  social: { active: ["f","t","i","in"] }',
    '  divider: {} | spacer: {}',
    `Tono: ${defaultTone}.`,
    `Idioma: ${lang}.`,
    brandRules ? `Reglas de marca:\n${brandRules}` : '',
    'Nunca inventes variables fuera de {{nombre}}, {{empresa}}, {{correo}}, {{pedido}}, {{total}}, {{fecha_hoy}}, {{link_baja}}, {{link_navegador}}. Si necesitás una variable que no está, inventala con sintaxis handlebars {{nombre_descriptivo}}.',
    'Incluí siempre una sección header al inicio y una sección footer al final.',
    'No incluyas markdown ni explicaciones. Solo el objeto JSON.',
  ].filter(Boolean).join('\n\n');

  const user = [
    `Descripción del correo: ${prompt}`,
    lenCopy,
    blocksHint,
  ].filter(Boolean).join('\n\n');

  const result = await callModel({ system, user, responseFormat: 'json', maxTokens: 3000, temperature: 0.7, op: 'generate' });
  if (!result.ok) return result;

  const parsed = tryParseJSON(result.text);
  if (!parsed || !Array.isArray(parsed.sections) || !parsed.sections.length) {
    return { ok: false, error: 'El modelo no devolvió un documento válido. Reintentá.' };
  }

  const doc = buildDocFromAI(parsed);
  if (!doc.sections.length) {
    return { ok: false, error: 'No se pudieron interpretar las secciones que devolvió el modelo.' };
  }
  return { ok: true, doc, usage: result.usage };
}

// Convert the simplified AI JSON into the full doc.sections schema used by
// the editor. Assigns IDs, default styles, and normalizes block data.
function buildDocFromAI(ai) {
  let sectionIdx = 0;
  let blockIdx = 0;
  const sections = [];

  for (const section of ai.sections) {
    const layout = ['1col', '2col', '3col'].includes(section.layout) ? section.layout : '1col';
    const colCount = layout === '2col' ? 2 : layout === '3col' ? 3 : 1;
    const wPct = Math.floor(100 / colCount);

    let columnSources;
    if (colCount === 1) {
      columnSources = [Array.isArray(section.blocks) ? section.blocks : []];
    } else {
      columnSources = Array.isArray(section.columns) && section.columns.length
        ? section.columns.slice(0, colCount)
        : [[]];
      while (columnSources.length < colCount) columnSources.push([]);
    }

    const columns = columnSources.map(col => ({
      w: wPct,
      blocks: (Array.isArray(col) ? col : []).map(b => normalizeBlock(b, () => `b${++blockIdx}`)).filter(Boolean),
    }));

    sections.push({
      id: `s${++sectionIdx}`,
      name: section.name || `Sección ${sectionIdx}`,
      layout,
      style: { bg: '#ffffff', text: '#1a1a17', padding: 32, font: 'inter', align: 'left' },
      columns,
    });
  }
  return { sections };
}

function normalizeBlock(b, nextId) {
  if (!b || !b.type || !ALLOWED_BLOCK_TYPES.has(b.type)) return null;
  const { type } = b;
  const content = {};
  // Per-type field extraction — ignore unknown keys the model might invent.
  if (type === 'header') { content.brand = b.brand || ''; if (b.sub) content.sub = b.sub; }
  else if (type === 'hero') { content.heading = b.heading || ''; content.body = b.body || ''; }
  else if (type === 'heading') { content.text = b.text || ''; }
  else if (type === 'text') { content.body = b.body || b.text || ''; }
  else if (type === 'button') { content.label = b.label || 'Ver más'; content.url = b.url || '#'; }
  else if (type === 'image') { content.alt = b.alt || 'Imagen'; }
  else if (type === 'product') { content.name = b.name || 'Producto'; content.price = b.price || ''; }
  else if (type === 'footer') { content.company = b.company || ''; content.notice = b.notice || ''; }
  else if (type === 'icon') { content.emoji = b.emoji || '✨'; if (b.text) content.text = b.text; }
  else if (type === 'social') { content.active = Array.isArray(b.active) && b.active.length ? b.active : ['f', 't', 'i', 'in']; }
  // divider + spacer: no content fields
  return {
    id: nextId(),
    type,
    data: { content, style: {}, spacing: { padding: [0, 0, 0, 0], margin: [0, 0, 0, 0] } },
  };
}

// Fetch the list of models currently available at the given provider. Uses
// the current workspace's resolved API key (or Ollama URL). Returns
// { ok:true, models:[{id,name,createdAt?,size?}] } or { ok:false, error }.
async function listModels(providerId) {
  const aiCfg = window.stStorage.getSetting('ai', {}) || {};
  const provider = providerId || aiCfg.provider || 'anthropic';
  const apiKey = provider === 'ollama' ? null : await resolveApiKey({ ...aiCfg, provider });
  if (!window.ai || typeof window.ai.listModels !== 'function') {
    return { ok: false, error: 'El puente de IA no está disponible.' };
  }
  const result = await window.ai.listModels({
    provider,
    apiKey,
    ollamaUrl: aiCfg.ollamaUrl,
  });
  if (!result.ok) {
    return { ok: false, error: friendlyError(result), code: result.code, models: [] };
  }
  return { ok: true, models: result.models || [] };
}

// Thin wrappers over the workspace-scoped log IPC. The UI always wants the
// current workspace's history; exposing workspaceId at every call would just
// be boilerplate.
const log = {
  async list(opts) {
    const wsId = window.stStorage.getCurrentWorkspaceId();
    if (!wsId || !window.ai?.log) return [];
    return await window.ai.log.list(wsId, opts);
  },
  async count() {
    const wsId = window.stStorage.getCurrentWorkspaceId();
    if (!wsId || !window.ai?.log) return 0;
    return await window.ai.log.count(wsId);
  },
  async clear() {
    const wsId = window.stStorage.getCurrentWorkspaceId();
    if (!wsId || !window.ai?.log) return 0;
    return await window.ai.log.clear(wsId);
  },
};

const stAI = { improveText, generateTemplate, resolveApiKey, listModels, log };
Object.assign(window, { stAI });
