/**
 * electron-main.js — MultiChat Desktop App
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const { fork } = require('child_process');

// Settings stored in OS user data dir (survives app updates)
const SETTINGS_PATH = path.join(app.getPath('userData'), 'multichat-config.json');

let mainWindow   = null;
let setupWindow  = null;
let tray         = null;
let bridgeProc   = null;
let isQuitting   = false;

// ── Settings helpers ──────────────────────────────────────────────────────────
function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null;
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch(e) { return null; }
}

function writeSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function isSetupComplete() {
  const s = readSettings();
  return s && s.BRAND_NAME && s.BRAND_NAME !== 'YourName' && s._setupDone === true;
}

// ── IPC handlers (called from renderer pages) ─────────────────────────────────
ipcMain.handle('get-settings', () => readSettings());

ipcMain.handle('save-settings', (_, data) => {
  data._setupDone = true;
  writeSettings(data);
  return true;
});

ipcMain.handle('open-main-app', () => {
  if (setupWindow) setupWindow.close();
  startBridge();
  createMainWindow();
  createTray();
});

ipcMain.handle('reopen-setup', () => {
  if (mainWindow) mainWindow.hide();
  createSetupWindow();
});

// ── Discord bridge ────────────────────────────────────────────────────────────
function startBridge() {
  const bridgePath = path.join(__dirname, 'discord-bridge.js');
  if (!fs.existsSync(bridgePath)) return;

  const settings = readSettings();
  if (!settings || !settings.DISCORD_BOT_TOKEN ||
      settings.DISCORD_BOT_TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
    console.log('[Bridge] No Discord token configured — bridge not started');
    return;
  }

  bridgeProc = fork(bridgePath, [], {
    cwd: __dirname,
    silent: true,
    env: {
      ...process.env,
      DISCORD_BOT_TOKEN:  settings.DISCORD_BOT_TOKEN,
      DISCORD_CHANNEL_ID: settings.DISCORD_CHANNEL_ID,
      DISCORD_BRIDGE_WS_PORT: '8081'
    }
  });

  bridgeProc.stdout.on('data', (d) => process.stdout.write(`[Bridge] ${d}`));
  bridgeProc.stderr.on('data', (d) => process.stderr.write(`[Bridge] ${d}`));
  bridgeProc.on('exit', (code) => {
    if (!isQuitting) {
      console.log(`[Bridge] Crashed (${code}) — restarting in 3s`);
      setTimeout(startBridge, 3000);
    }
  });
  console.log('[Bridge] Started');
}

// ── Setup window ──────────────────────────────────────────────────────────────
function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width:  560,
    height: 780,
    resizable: false,
    title: 'MultiChat — Setup',
    backgroundColor: '#0e0e10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    autoHideMenuBar: true,
  });

  setupWindow.loadFile('setup.html');
  setupWindow.once('ready-to-show', () => setupWindow.show());
  setupWindow.on('closed', () => { setupWindow = null; });
}

// ── Main chat window ──────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:  420,
    height: 900,
    minWidth:  320,
    minHeight: 400,
    title: 'MultiChat',
    backgroundColor: '#0e0e10',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('multichat.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });
}

// ── System tray ───────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('MultiChat');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show MultiChat',
      click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } }
    },
    {
      label: 'Settings',
      click: () => { createSetupWindow(); }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { isQuitting = true; app.quit(); }
    }
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
}

// ── App start ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (isSetupComplete()) {
    // Returning user — go straight to chat
    startBridge();
    createMainWindow();
    createTray();
  } else {
    // First launch — show setup wizard
    createSetupWindow();
  }
});

app.on('window-all-closed', (e) => e.preventDefault());

app.on('before-quit', () => {
  isQuitting = true;
  if (bridgeProc) { bridgeProc.kill(); }
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
