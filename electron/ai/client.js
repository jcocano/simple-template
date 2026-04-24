// AI completion client — normalizes 5 providers behind a single interface.
//
// Input (payload from IPC):
//   {
//     provider: 'anthropic' | 'openai' | 'google' | 'ollama' | 'openrouter',
//     model: 'claude-...' | 'gpt-...' | 'gemini-...' | 'llama3.3' | 'openai/gpt-4o-mini',
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
  if (!provider) return {
    ok: false,
    errorKey: 'ai.err.missingProvider',
    errorParams: {},
    error: 'Missing provider.',
    code: 'EINVAL',
  };
  const dispatch = {
    anthropic: callAnthropic,
    openai: callOpenAI,
    google: callGoogle,
    ollama: callOllama,
    openrouter: callOpenRouter,
  };
  const fn = dispatch[provider];
  if (!fn) return {
    ok: false,
    errorKey: 'ai.err.unsupportedProvider',
    errorParams: { provider },
    error: `Provider "${provider}" not supported.`,
    code: 'EINVAL',
  };
  try {
    return await fn(payload);
  } catch (err) {
    return {
      ok: false,
      errorKey: 'ai.err.unknown',
      errorParams: { message: err?.message || '' },
      error: err?.message || 'Unknown error.',
      code: 'NETWORK',
    };
  }
}

async function callAnthropic({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7 }) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKey',
    errorParams: { provider: 'Anthropic' },
    error: 'Missing Anthropic API key.',
    code: 'AUTH',
  };
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
    const fallback = `Anthropic ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'Anthropic', message: msg }
        : { provider: 'Anthropic', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.content?.[0]?.text || '';
  if (!out) return {
    ok: false,
    errorKey: 'ai.err.emptyResponse',
    errorParams: {},
    error: 'Empty response.',
    code: 'PARSE',
  };
  return { ok: true, text: out, usage: json.usage || null };
}

async function callOpenAI({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7, responseFormat }) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKey',
    errorParams: { provider: 'OpenAI' },
    error: 'Missing OpenAI API key.',
    code: 'AUTH',
  };
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user || '' });

  const resolvedModel = model || 'gpt-4.1';
  const isReasoning = /^(o\d|gpt-5)/i.test(resolvedModel);

  const body = {
    model: resolvedModel,
    messages,
    max_completion_tokens: maxTokens,
  };
  if (!isReasoning) body.temperature = temperature;
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
    const fallback = `OpenAI ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'OpenAI', message: msg }
        : { provider: 'OpenAI', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.choices?.[0]?.message?.content || '';
  if (!out) return {
    ok: false,
    errorKey: 'ai.err.emptyResponse',
    errorParams: {},
    error: 'Empty response.',
    code: 'PARSE',
  };
  return { ok: true, text: out, usage: json.usage || null };
}

// OpenRouter exposes an OpenAI-compatible /chat/completions endpoint that
// proxies many model families (anthropic/*, openai/*, google/*, meta-llama/*,
// etc.) under one key. The optional HTTP-Referer + X-Title headers are
// OpenRouter's attribution convention — they don't affect auth.
async function callOpenRouter({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7, responseFormat }) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKey',
    errorParams: { provider: 'OpenRouter' },
    error: 'Missing OpenRouter API key.',
    code: 'AUTH',
  };
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user || '' });

  const body = {
    model: model || 'openai/gpt-4o-mini',
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (responseFormat === 'json') body.response_format = { type: 'json_object' };

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://github.com/jcocano/simple-template',
      'X-Title': 'Simple Template',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `OpenRouter ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'OpenRouter', message: msg }
        : { provider: 'OpenRouter', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.choices?.[0]?.message?.content || '';
  if (!out) return {
    ok: false,
    errorKey: 'ai.err.emptyResponse',
    errorParams: {},
    error: 'Empty response.',
    code: 'PARSE',
  };
  return { ok: true, text: out, usage: json.usage || null };
}

async function callGoogle({ model, apiKey, system, user, maxTokens = 2048, temperature = 0.7, responseFormat, think }) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKey',
    errorParams: { provider: 'Google' },
    error: 'Missing Google API key.',
    code: 'AUTH',
  };
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
  if (typeof think === 'boolean') {
    body.generationConfig.thinkingConfig = { thinkingBudget: think ? -1 : 0 };
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `Google ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'Google', message: msg }
        : { provider: 'Google', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!out) return {
    ok: false,
    errorKey: 'ai.err.emptyResponse',
    errorParams: {},
    error: 'Empty response.',
    code: 'PARSE',
  };
  return { ok: true, text: out, usage: json.usageMetadata || null };
}

async function callOllama({ model, ollamaUrl, system, user, maxTokens = 2048, temperature = 0.7, responseFormat, think }) {
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
  if (typeof think === 'boolean') body.think = think;

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
      errorKey: 'ai.err.ollamaUnreachable',
      errorParams: { base },
      error: `Could not connect to Ollama at ${base}. Is "ollama serve" running?`,
      code: 'NETWORK',
    };
  }
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `Ollama ${resp.status}`;
    const msg = json?.error || fallback;
    return {
      ok: false,
      errorKey: json?.error ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error
        ? { provider: 'Ollama', message: msg }
        : { provider: 'Ollama', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const out = json?.message?.content || json?.message?.thinking || '';
  if (!out) return {
    ok: false,
    errorKey: 'ai.err.emptyResponse',
    errorParams: {},
    error: 'Empty response.',
    code: 'PARSE',
  };
  return { ok: true, text: out, usage: { prompt: json.prompt_eval_count, completion: json.eval_count } };
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'HTTP';
}

// MODEL DISCOVERY — ask each provider which models are currently available.
// The goal is to avoid hardcoded lists that rot (Anthropic, OpenAI, Google
// all ship new models continuously; Ollama models are user-installed locally).

async function listModels(payload = {}) {
  const { provider, apiKey, ollamaUrl } = payload;
  const dispatch = {
    anthropic: () => listAnthropicModels(apiKey),
    openai: () => listOpenAIModels(apiKey),
    google: () => listGoogleModels(apiKey),
    ollama: () => listOllamaModels(ollamaUrl),
    openrouter: () => listOpenRouterModels(apiKey),
  };
  const fn = dispatch[provider];
  if (!fn) return {
    ok: false,
    errorKey: 'ai.err.unsupportedProvider',
    errorParams: { provider },
    error: `Provider "${provider}" not supported.`,
    code: 'EINVAL',
  };
  try {
    return await fn();
  } catch (err) {
    return {
      ok: false,
      errorKey: 'ai.err.unknown',
      errorParams: { message: err?.message || '' },
      error: err?.message || 'Unknown error.',
      code: 'NETWORK',
    };
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
      const e = new Error(`Timeout: provider did not respond in ${timeoutMs / 1000}s.`);
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function listAnthropicModels(apiKey) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKeyForList',
    errorParams: {},
    error: 'Configure your API key to list models.',
    code: 'AUTH',
  };
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
    const fallback = `Anthropic ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'Anthropic', message: msg }
        : { provider: 'Anthropic', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const models = (json.data || []).map(m => ({
    id: m.id,
    name: m.display_name || m.id,
    createdAt: m.created_at,
  }));
  return { ok: true, models };
}

async function listOpenAIModels(apiKey) {
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKeyForList',
    errorParams: {},
    error: 'Configure your API key to list models.',
    code: 'AUTH',
  };
  const resp = await fetchWithTimeout('https://api.openai.com/v1/models', {
    headers: { 'authorization': `Bearer ${apiKey}` },
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `OpenAI ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'OpenAI', message: msg }
        : { provider: 'OpenAI', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
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
  if (!apiKey) return {
    ok: false,
    errorKey: 'ai.err.missingApiKeyForList',
    errorParams: {},
    error: 'Configure your API key to list models.',
    code: 'AUTH',
  };
  const resp = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `Google ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'Google', message: msg }
        : { provider: 'Google', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
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

// OpenRouter's /models endpoint is public (no auth required), but we still
// pass the key when present so the list reflects the account's access tier.
async function listOpenRouterModels(apiKey) {
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers['authorization'] = `Bearer ${apiKey}`;
  const resp = await fetchWithTimeout('https://openrouter.ai/api/v1/models', { headers });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `OpenRouter ${resp.status}`;
    const msg = json?.error?.message || fallback;
    return {
      ok: false,
      errorKey: json?.error?.message ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error?.message
        ? { provider: 'OpenRouter', message: msg }
        : { provider: 'OpenRouter', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const models = (json.data || [])
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      createdAt: m.created ? new Date(m.created * 1000).toISOString() : null,
    }))
    .filter(m => m.id)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
      errorKey: 'ai.err.ollamaUnreachable',
      errorParams: { base },
      error: `Could not connect to Ollama at ${base}. Is "ollama serve" running?`,
      code: 'NETWORK',
    };
  }
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    const fallback = `Ollama ${resp.status}`;
    const msg = json?.error || fallback;
    return {
      ok: false,
      errorKey: json?.error ? 'ai.err.providerMessage' : 'ai.err.providerStatus',
      errorParams: json?.error
        ? { provider: 'Ollama', message: msg }
        : { provider: 'Ollama', status: resp.status },
      error: msg,
      code: mapHttpError(resp.status),
    };
  }
  const models = (json.models || []).map(m => ({
    id: m.name,
    name: m.name,
    size: m.size,
  }));
  return { ok: true, models };
}

module.exports = { complete, listModels };
