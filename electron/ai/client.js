// AI completion client — normalizes 4 providers behind a single interface.
//
// Input (payload from IPC):
//   {
//     provider: 'anthropic' | 'openai' | 'google' | 'ollama',
//     model: 'claude-...' | 'gpt-...' | 'gemini-...' | 'llama3.3',
//     apiKey: '...'          // ignored for ollama
//     ollamaUrl: '...'       // only for ollama; defaults to http://localhost:11434
//     system: '...'          // optional system prompt
//     user: '...'            // required user message
//     maxTokens: number      // default 2048
//     temperature: number    // default 0.7
//     responseFormat: 'json' // optional hint to request JSON-only output
//   }
//
// Output:
//   { ok: true, text: '...', usage?: {...} }
//   { ok: false, error: '...', code?: 'RATE_LIMIT'|'AUTH'|'NETWORK'|'PARSE' }

async function complete(payload = {}) {
  const { provider } = payload;
  if (!provider) return { ok: false, error: 'Falta provider.', code: 'EINVAL' };
  const dispatch = {
    anthropic: callAnthropic,
    openai: callOpenAI,
    google: callGoogle,
    ollama: callOllama,
  };
  const fn = dispatch[provider];
  if (!fn) return { ok: false, error: `Provider "${provider}" no soportado.`, code: 'EINVAL' };
  try {
    return await fn(payload);
  } catch (err) {
    return { ok: false, error: err?.message || 'Error desconocido.', code: 'NETWORK' };
  }
}

// ─── Anthropic ────────────────────────────────────────────────────
async function callAnthropic({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7 }) {
  if (!apiKey) return { ok: false, error: 'Falta API key de Anthropic.', code: 'AUTH' };
  const body = {
    model: model || 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: user || '' }],
  };
  if (system) body.system = system;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error?.message || `Anthropic ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.content?.[0]?.text || '';
  if (!out) return { ok: false, error: 'Respuesta vacía.', code: 'PARSE' };
  return { ok: true, text: out, usage: json.usage || null };
}

// ─── OpenAI ───────────────────────────────────────────────────────
async function callOpenAI({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7, responseFormat }) {
  if (!apiKey) return { ok: false, error: 'Falta API key de OpenAI.', code: 'AUTH' };
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user || '' });

  const body = {
    model: model || 'gpt-4.1',
    messages,
    max_completion_tokens: maxTokens,
    temperature,
  };
  if (responseFormat === 'json') body.response_format = { type: 'json_object' };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error?.message || `OpenAI ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.choices?.[0]?.message?.content || '';
  if (!out) return { ok: false, error: 'Respuesta vacía.', code: 'PARSE' };
  return { ok: true, text: out, usage: json.usage || null };
}

// ─── Google Gemini ────────────────────────────────────────────────
async function callGoogle({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7, responseFormat }) {
  if (!apiKey) return { ok: false, error: 'Falta API key de Google.', code: 'AUTH' };
  const m = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: user || '' }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (responseFormat === 'json') body.generationConfig.responseMimeType = 'application/json';

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error?.message || `Google ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!out) return { ok: false, error: 'Respuesta vacía.', code: 'PARSE' };
  return { ok: true, text: out, usage: json.usageMetadata || null };
}

// ─── Ollama (local) ───────────────────────────────────────────────
async function callOllama({ model, ollamaUrl, system, user, maxTokens = 2048, temperature = 0.7, responseFormat }) {
  const base = (ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
  const url = `${base}/api/chat`;
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user || '' });

  const body = {
    model: model || 'llama3.3',
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  };
  if (responseFormat === 'json') body.format = 'json';

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      error: `No se pudo conectar con Ollama en ${base}. ¿Está corriendo "ollama serve"?`,
      code: 'NETWORK',
    };
  }
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error || `Ollama ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.message?.content || '';
  if (!out) return { ok: false, error: 'Respuesta vacía.', code: 'PARSE' };
  return { ok: true, text: out, usage: { prompt: json.prompt_eval_count, completion: json.eval_count } };
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'HTTP';
}

// ═══════════════════════════════════════════════════════════════════
// MODEL DISCOVERY — ask each provider which models are currently available.
// The goal is to avoid hardcoded lists that rot (Anthropic, OpenAI, Google
// all ship new models continuously; Ollama models are user-installed locally).
// ═══════════════════════════════════════════════════════════════════

async function listModels(payload = {}) {
  const { provider, apiKey, ollamaUrl } = payload;
  const dispatch = {
    anthropic: () => listAnthropicModels(apiKey),
    openai: () => listOpenAIModels(apiKey),
    google: () => listGoogleModels(apiKey),
    ollama: () => listOllamaModels(ollamaUrl),
  };
  const fn = dispatch[provider];
  if (!fn) return { ok: false, error: `Provider "${provider}" no soportado.`, code: 'EINVAL' };
  try {
    return await fn();
  } catch (err) {
    return { ok: false, error: err?.message || 'Error desconocido.', code: 'NETWORK' };
  }
}

// Fetch with a hard timeout. Node fetch has no default timeout, so a stalled
// TCP/TLS handshake can keep the loading spinner up indefinitely. 12s is
// long enough for a slow connection, short enough to surface a real hang.
async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const e = new Error(`Timeout: el proveedor no respondió en ${timeoutMs / 1000}s.`);
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function listAnthropicModels(apiKey) {
  if (!apiKey) return { ok: false, error: 'Configurá tu API key para listar modelos.', code: 'AUTH' };
  const resp = await fetchWithTimeout('https://api.anthropic.com/v1/models?limit=100', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return { ok: false, error: json?.error?.message || `Anthropic ${resp.status}`, code: mapHttpError(resp.status) };
  }
  const models = (json.data || []).map(m => ({
    id: m.id,
    name: m.display_name || m.id,
    createdAt: m.created_at,
  }));
  return { ok: true, models };
}

async function listOpenAIModels(apiKey) {
  if (!apiKey) return { ok: false, error: 'Configurá tu API key para listar modelos.', code: 'AUTH' };
  const resp = await fetchWithTimeout('https://api.openai.com/v1/models', {
    headers: { 'authorization': `Bearer ${apiKey}` },
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return { ok: false, error: json?.error?.message || `OpenAI ${resp.status}`, code: mapHttpError(resp.status) };
  }
  // Filter to chat-completion-capable models (gpt-*, o[1-9]*, chatgpt-*).
  // OpenAI returns embeddings, tts, whisper, dall-e, etc. in the same list.
  const models = (json.data || [])
    .filter(m => /^(gpt-|o[1-9]|chatgpt-)/i.test(m.id))
    .filter(m => !/-(audio|realtime|tts|whisper|embedding|search|transcribe|image)/i.test(m.id))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .map(m => ({ id: m.id, name: m.id, createdAt: m.created ? new Date(m.created * 1000).toISOString() : null }));
  return { ok: true, models };
}

async function listGoogleModels(apiKey) {
  if (!apiKey) return { ok: false, error: 'Configurá tu API key para listar modelos.', code: 'AUTH' };
  const resp = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return { ok: false, error: json?.error?.message || `Google ${resp.status}`, code: mapHttpError(resp.status) };
  }
  // Keep only models that support generateContent (excludes embedding-only models).
  const models = (json.models || [])
    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => ({
      id: (m.name || '').replace(/^models\//, ''),
      name: m.displayName || m.name,
    }))
    .filter(m => m.id);
  return { ok: true, models };
}

async function listOllamaModels(ollamaUrl) {
  const base = (ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
  let resp;
  try {
    resp = await fetchWithTimeout(`${base}/api/tags`, {}, 5000);
  } catch (err) {
    return {
      ok: false,
      error: `No se pudo conectar a Ollama en ${base}. ¿Está corriendo "ollama serve"?`,
      code: 'NETWORK',
    };
  }
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return { ok: false, error: json?.error || `Ollama ${resp.status}`, code: mapHttpError(resp.status) };
  }
  const models = (json.models || []).map(m => ({
    id: m.name,
    name: m.name,
    size: m.size,
  }));
  return { ok: true, models };
}

module.exports = { complete, listModels };
