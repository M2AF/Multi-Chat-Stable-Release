# Building the MultiChat Desktop App (.exe)

## First time setup

```bash
npm install
```

## Run in development (no .exe, just launches the app)

```bash
npm start
```

## Build the .exe installer

```bash
npm run build
```

The installer will be created in the `dist/` folder as:
```
dist/MultiChat Setup 1.0.0.exe
```

Double-click it to install. Creates a Start Menu shortcut and Desktop shortcut.

---

## Before building — add an icon (optional but recommended)

Create an `assets/` folder and add:
- `assets/icon.ico` — Windows icon (256x256 recommended)
- `assets/icon.png` — Used for the system tray (32x32 or 64x64)

If no icon is provided the app will still build and run, just without a custom icon.

---

## How it works

When you launch MultiChat.exe:

1. **Discord bridge starts automatically** in the background — no terminal needed
2. **The chat window opens** loading multichat.html
3. **Minimizing closes to the system tray** — right-click the tray icon to quit or reopen
4. **config.js is loaded from the app folder** — edit it there to change your settings

---

## Updating config.js after install

After installing, your `config.js` lives next to the .exe in the install directory.
You can edit it with any text editor. Right-click the tray icon → **Open config.js**
to open it directly.

---

## Distributing to others

1. They download the installer
2. They copy `config.example.js` → `config.js` and fill in their own values
3. Double-click the .exe — everything starts automatically

