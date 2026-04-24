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
    if (!res.ok) throw new Error(`litterbox upload failed: HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (!/^https?:\/\//.test(text)) throw new Error(`litterbox returned unexpected body: ${text.slice(0, 100)}`);
    return { url: text };
  });

  ipcMain.handle('share:download', async (_e, url) => {
    if (typeof url !== 'string' || !/^https:\/\//.test(url)) throw new Error('share:download requires https URL');
    const res = await fetch(url, { headers: { 'User-Agent': 'SimpleTemplate/1.0 (sharing)' } });
    if (!res.ok) {
      if (res.status === 404) throw new Error('EXPIRED');
      throw new Error(`download failed: HTTP ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  });
}

module.exports = { register };
