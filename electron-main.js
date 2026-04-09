/**
 * electron-main.js — MultiChat Desktop App
 *
 * Starts the Discord bridge as a background process,
 * then opens the chat overlay in an Electron window.
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path   = require('path');
const { fork } = require('child_process');

let mainWindow  = null;
let tray        = null;
let bridgeProc  = null;
let isQuitting  = false;

// ── Start Discord bridge as a child process ───────────────────────────────────
function startBridge() {
  const bridgePath = path.join(__dirname, 'discord-bridge.js');

  // Check config exists before starting
  const fs = require('fs');
  const configPath = path.join(__dirname, 'config.js');
  if (!fs.existsSync(configPath)) {
    console.warn('[Bridge] config.js not found — Discord bridge not started.');
    console.warn('[Bridge] Copy config.example.js to config.js and fill in your values.');
    return;
  }

  bridgeProc = fork(bridgePath, [], {
    cwd: __dirname,
    silent: true // Capture stdout/stderr instead of inheriting
  });

  bridgeProc.stdout.on('data', (d) => process.stdout.write(`[Bridge] ${d}`));
  bridgeProc.stderr.on('data', (d) => process.stderr.write(`[Bridge] ${d}`));

  bridgeProc.on('exit', (code) => {
    console.log(`[Bridge] Exited with code ${code}`);
    // Auto-restart if it crashes (unless we're quitting)
    if (!isQuitting) {
      console.log('[Bridge] Restarting in 3s…');
      setTimeout(startBridge, 3000);
    }
  });

  console.log('[Bridge] Discord bridge started');
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
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
    // Frameless option — comment out if you want the standard window frame
    // frame: false,
    show: false // Don't show until ready-to-show to avoid flash
  });

  mainWindow.loadFile('multichat.html');

  // Show window once fully loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in the real browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── System tray ───────────────────────────────────────────────────────────────
function createTray() {
  // Use a blank icon if no icon file exists
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const fs = require('fs');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('MultiChat');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show MultiChat',
      click: () => { mainWindow.show(); mainWindow.focus(); }
    },
    { type: 'separator' },
    {
      label: 'Open config.js',
      click: () => {
        const configPath = path.join(__dirname, 'config.js');
        shell.openPath(configPath);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBridge();
  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => {
  // Keep running in tray on all platforms
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (bridgeProc) {
    bridgeProc.kill();
    console.log('[Bridge] Stopped');
  }
});

app.on('activate', () => {
  // macOS: re-open window when clicking dock icon
  if (mainWindow) mainWindow.show();
});
