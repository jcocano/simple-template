// GitHub Contents API upload. PUT /repos/{owner}/{repo}/contents/{path} with
// a base64-encoded body creates (or updates) a file on the given branch.
// Works for any repo the token can write to; if the repo has GitHub Pages
// enabled, the file also becomes available under
// `https://<owner>.github.io/<repo>/<path>`.
//
// Config shape (from StorageSection):
//   config.repo     — "owner/name"
//   config.branch   — "main"
//   config.path     — "assets/img/"  (optional folder prefix)
//   config.publicUrl — optional CDN override; when set, the returned URL
//                      points at the user's domain instead of raw.github...
//
// Secrets shape:
//   secrets.token   — personal access token with `repo` (or fine-grained
//                     `contents:write`) scope.

async function uploadGithub({ config, secrets, file, filename, contentType }) {
  const token = secrets?.token;
  const repo = config?.repo;
  const branch = config?.branch || 'main';
  const prefix = normalizePath(config?.path || '');
  const publicUrl = config?.publicUrl;

  if (!token) {
    return {
      ok: false,
      errorKey: 'cdn.err.githubMissingToken',
      errorParams: {},
      error: 'Missing GitHub Personal Access Token.',
      code: 'AUTH',
    };
  }
  if (!repo || !repo.includes('/')) {
    return {
      ok: false,
      errorKey: 'cdn.err.githubRepoFormat',
      errorParams: {},
      error: 'Repository must be in "user/repo" format.',
      code: 'CONFIG',
    };
  }

  const buf = toBuffer(file);
  const path = prefix ? `${prefix}${filename}` : filename;
  const apiUrl = `https://api.github.com/repos/${encodeSegment(repo, '/')}/contents/${encodePathSegments(path)}`;

  // GitHub Contents API requires checking the existing file's SHA when you
  // want to update. We attempt a create (no sha) first — if it already
  // exists (422), we fetch the sha and retry.
  const body = {
    message: `[simple-template] upload ${path}`,
    content: buf.toString('base64'),
    branch,
  };

  let resp = await putContents(apiUrl, token, body);
  if (resp.status === 422) {
    const sha = await fetchSha(apiUrl, token, branch);
    if (sha) {
      resp = await putContents(apiUrl, token, { ...body, sha });
    }
  }

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.message || `GitHub ${resp.status}`,
      code: mapHttpError(resp.status),
    };
  }

  // Prefer user-configured CDN (e.g. custom GitHub Pages domain). Otherwise
  // use the raw.githubusercontent.com URL that the API returns — works for
  // public repos even without Pages enabled.
  const finalUrl = publicUrl
    ? `${publicUrl.replace(/\/+$/, '')}/${encodePathSegments(path)}`
    : (json.content?.download_url || null);

  if (!finalUrl) {
    return {
      ok: false,
      errorKey: 'cdn.err.githubNoDownloadUrl',
      errorParams: {},
      error: 'GitHub did not return a download_url.',
      code: 'PARSE',
    };
  }
  return { ok: true, url: finalUrl };
}

async function putContents(apiUrl, token, body) {
  return fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'authorization': `Bearer ${token}`,
      'accept': 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'simple-template',
    },
    body: JSON.stringify(body),
  });
}

async function fetchSha(apiUrl, token, branch) {
  try {
    const resp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers: {
        'authorization': `Bearer ${token}`,
        'accept': 'application/vnd.github+json',
        'user-agent': 'simple-template',
      },
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.sha || null;
  } catch {
    return null;
  }
}

function normalizePath(p) {
  if (!p) return '';
  let s = String(p).replace(/\/+/g, '/');
  s = s.replace(/^\/+/, ''); // no leading slash
  if (!s.endsWith('/')) s += '/';
  return s;
}

function encodeSegment(s, keep = '') {
  return String(s).split('').map(c => keep.includes(c) ? c : encodeURIComponent(c)).join('');
}

function encodePathSegments(path) {
  return String(path).split('/').map(encodeURIComponent).join('/');
}

function toBuffer(fileLike) {
  if (Buffer.isBuffer(fileLike)) return fileLike;
  if (fileLike instanceof Uint8Array) return Buffer.from(fileLike);
  throw new Error('file must be Uint8Array or Buffer.');
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 404) return 'NOT_FOUND';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 422) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'HTTP';
}

module.exports = { uploadGithub };
