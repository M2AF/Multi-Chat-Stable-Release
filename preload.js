/**
 * preload.js — Electron Preload Script
 *
 * Runs in the renderer context before multichat.html loads.
 * Exposes safe APIs to the page via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs   = require('fs');

// Expose a safe way for multichat.html to load config.js
// Since we're in Electron, config.js is a local file — we read it directly
contextBridge.exposeInMainWorld('__electronBridge', {
  // Let the page know it's running inside Electron
  isElectron: true,

  // Load config.js from the app directory and return the CONFIG object
  loadConfig: () => {
    try {
      const configPath = path.join(__dirname, 'config.js');
      if (!fs.existsSync(configPath)) return null;
      const raw = fs.readFileSync(configPath, 'utf8');
      const vm  = require('vm');
      const ctx = {};
      vm.createContext(ctx);
      vm.runInContext(raw, ctx);
      return ctx.CONFIG || null;
    } catch(e) {
      console.error('preload: failed to load config.js', e.message);
      return null;
    }
  }
});
