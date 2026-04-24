// Wrapper over window.share.upload/download so the facade talks to a small,
// stable surface. Swappable if the underlying provider ever changes. Throws
// 'SHARE_IPC_UNAVAILABLE' if the preload bridge is missing — the UI catches
// that to show the right error.
//
// `expiresHours` is optional. When null the UI treats the link as permanent
// and skips the expiry hint in the share modal.

const providerLitterbox = {
  name: 'litterbox.catbox.moe',
  expiresHours: 72,
  async upload(bytes, filename) {
    if (!window.share || typeof window.share.upload !== 'function') {
      throw new Error('SHARE_IPC_UNAVAILABLE');
    }
    return window.share.upload(bytes, filename);
  },
  async download(url) {
    if (!window.share || typeof window.share.download !== 'function') {
      throw new Error('SHARE_IPC_UNAVAILABLE');
    }
    return window.share.download(url);
  },
};

Object.assign(window, { stSharingProvider: providerLitterbox });
