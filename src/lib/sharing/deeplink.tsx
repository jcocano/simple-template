// Deep-link codec for template sharing.
//
// Format:  simpletemplete://import?u=<https-bundle-url>&name=<tpl-name>
//
// `buildDeepLink` produces a link ready to copy/paste; `parseDeepLink`
// validates the scheme/host and returns a normalized { action, url, name }.
// Throws Error('INVALID_SCHEME' | 'UNKNOWN_ACTION' | 'INVALID_URL' |
// 'INVALID_DEEPLINK') so the UI can show specific copy.

const SHARE_SCHEME = 'simpletemplete:';

function buildDeepLink({ url, name } = {}) {
  if (!url) throw new Error('url required');
  const params = new URLSearchParams();
  params.set('u', url);
  if (name) params.set('name', name);
  return `simpletemplete://import?${params.toString()}`;
}

function parseDeepLink(link) {
  try {
    const u = new URL(link);
    if (u.protocol !== SHARE_SCHEME) throw new Error('INVALID_SCHEME');
    if (u.hostname !== 'import') throw new Error('UNKNOWN_ACTION');
    const bundleUrl = u.searchParams.get('u');
    const name = u.searchParams.get('name') || '';
    if (!bundleUrl || !/^https:\/\//.test(bundleUrl)) throw new Error('INVALID_URL');
    return { action: 'import', url: bundleUrl, name };
  } catch (err) {
    const msg = err && err.message ? err.message : '';
    if ((msg && msg.startsWith('INVALID')) || msg === 'UNKNOWN_ACTION') throw err;
    throw new Error('INVALID_DEEPLINK');
  }
}

Object.assign(window, {
  stSharingDeepLink: { build: buildDeepLink, parse: parseDeepLink },
});
