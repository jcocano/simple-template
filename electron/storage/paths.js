const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const userDataDir = () => app.getPath('userData');
const templatesDir = () => path.join(userDataDir(), 'templates');
const workspaceTemplatesDir = (workspaceId) => path.join(templatesDir(), workspaceId);
const dbPath = () => path.join(userDataDir(), 'app.db');

function ensureDirs(workspaceId) {
  fs.mkdirSync(templatesDir(), { recursive: true });
  if (workspaceId) {
    fs.mkdirSync(workspaceTemplatesDir(workspaceId), { recursive: true });
  }
}

module.exports = { userDataDir, templatesDir, workspaceTemplatesDir, dbPath, ensureDirs };
