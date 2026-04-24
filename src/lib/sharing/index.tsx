// Sharing facade. Two public calls:
//
//   shareTemplate(tplId)              → encrypts + uploads, returns {deepLink, pin, ...}
//   importFromDeepLink(linkOrUrl,pin) → downloads, decrypts with pin, writes a new template
//
// PIN is generated here, attached to the result, and never persisted. The
// caller (share-modal) shows it once; the receiver types it back into
// import-pin-modal.

async function shareTemplate(tplId) {
  const account = window.stStorage.getSetting('account', {}) || {};
  if (!account.name || !String(account.name).trim()) {
    const err = new Error('PROFILE_REQUIRED');
    err.code = 'PROFILE_REQUIRED';
    throw err;
  }

  const tpl = await window.stStorage.templates.read(tplId);
  if (!tpl) throw new Error('TEMPLATE_NOT_FOUND');

  const sharedBy = {
    name: String(account.name).trim(),
    email: account.email || '',
    avatar: account.avatar || '',
  };

  const bundle = await window.stSharingBundle.pack(tpl, sharedBy);
  const json = JSON.stringify(bundle);
  const plaintext = new TextEncoder().encode(json);

  const pin = window.stSharingCrypto.generatePin();
  const ciphertext = await window.stSharingCrypto.encryptBytes(plaintext, pin);

  const safeName = (tpl.name || 'template')
    .replace(/[^\w-]+/g, '_')
    .slice(0, 40) || 'template';
  const filename = `${safeName}.stpl.bin`;

  const { url } = await window.stSharingProvider.upload(ciphertext, filename);
  const deepLink = window.stSharingDeepLink.build({ url, name: tpl.name });

  return {
    deepLink,
    pin,
    pinFormatted: window.stSharingCrypto.formatPin(pin),
    url,
    provider: window.stSharingProvider.name,
    expiresHours: window.stSharingProvider.expiresHours,
  };
}

async function importFromDeepLink(deepLinkOrUrl, pinInput) {
  const pin = window.stSharingCrypto.normalizePin(pinInput || '');
  if (!pin) throw new Error('INVALID_PIN_FORMAT');

  const parsed = window.stSharingDeepLink.parse(deepLinkOrUrl);
  const ciphertext = await window.stSharingProvider.download(parsed.url);

  const plaintext = await window.stSharingCrypto.decryptBytes(ciphertext, pin);

  let bundle;
  try {
    const text = new TextDecoder().decode(plaintext);
    bundle = JSON.parse(text);
  } catch {
    throw new Error('INVALID_BUNDLE');
  }

  const tpl = await window.stSharingBundle.unpack(bundle);
  const newId = await window.stStorage.templates.newId();
  if (!newId) throw new Error('NEW_ID_FAILED');

  const finalDoc = {
    ...tpl,
    id: newId,
    starred: false,
    folder: 'Compartidas',
    sharedFrom: bundle.sharedBy || null,
    sharedAt: bundle.sharedAt || new Date().toISOString(),
  };

  const result = await window.stStorage.templates.write(newId, finalDoc);
  if (!result) throw new Error('WRITE_FAILED');

  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id: newId, kind: 'create' },
  }));

  return {
    id: newId,
    name: finalDoc.name,
    sharedFrom: finalDoc.sharedFrom,
  };
}

Object.assign(window, {
  stShare: { shareTemplate, importFromDeepLink },
});
