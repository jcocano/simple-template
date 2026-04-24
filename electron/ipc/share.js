const { ipcMain } = require('electron');

function register() {
  ipcMain.handle('share:upload', async (_e, bytes, filename) => {
    const form = new FormData();
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    form.append('fileToUpload', blob, filename || 'bundle.stpl.json');
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: form,
      headers: { 'User-Agent': 'SimpleTemplate/1.0 (sharing)' }
    });
    if (!res.ok) {
      const err = new Error(`litterbox upload failed: HTTP ${res.status}`);
      err.errorKey = 'ipc.err.shareUploadFailed';
      err.errorParams = { status: res.status };
      throw err;
    }
    const text = (await res.text()).trim();
    if (!/^https?:\/\//.test(text)) {
      const err = new Error(`litterbox returned unexpected body: ${text.slice(0, 100)}`);
      err.errorKey = 'ipc.err.shareUploadUnexpectedResponse';
      err.errorParams = { body: text.slice(0, 100) };
      throw err;
    }
    return { url: text };
  });

  ipcMain.handle('share:download', async (_e, url) => {
    if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
      const err = new Error('share:download requires https URL');
      err.errorKey = 'ipc.err.shareDownloadRequiresHttps';
      err.errorParams = {};
      throw err;
    }
    const res = await fetch(url, { headers: { 'User-Agent': 'SimpleTemplate/1.0 (sharing)' } });
    if (!res.ok) {
      if (res.status === 404) throw new Error('EXPIRED');
      const err = new Error(`download failed: HTTP ${res.status}`);
      err.errorKey = 'ipc.err.shareDownloadFailed';
      err.errorParams = { status: res.status };
      throw err;
    }
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  });
}

module.exports = { register };
