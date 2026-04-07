/**
 * config.example.js — MultiChat Configuration Template
 *
 * 1. Copy this file and rename it to: config.js
 * 2. Fill in your own values below
 * 3. NEVER commit config.js to GitHub (it's in .gitignore)
 */
const CONFIG = {
  // ── Streamer.bot WebSocket ──────────────────────────────────────────────────
  // Leave as-is if Streamer.bot is running on the same PC as OBS
  SB_WS_URL: 'ws://127.0.0.1:8080/',

  // ── Abstract Chain Chat ─────────────────────────────────────────────────────
  // Find your channel_id in your Abstract stream dashboard
  ABS_WS_URL: 'wss://abstools.top/api/ws?channel_id=YOUR_ABSTRACT_CHANNEL_ID',

  // ── Discord Bridge ──────────────────────────────────────────────────────────
  // If running discord-bridge.js locally:
  //   DISCORD_WS_URL: 'ws://127.0.0.1:8081/',
  // If hosted on Railway:
  //   DISCORD_WS_URL: 'wss://your-app.up.railway.app/',
  DISCORD_WS_URL:     'ws://127.0.0.1:8081/',
  DISCORD_BOT_TOKEN:  'YOUR_DISCORD_BOT_TOKEN',
  DISCORD_CHANNEL_ID: 'YOUR_DISCORD_CHANNEL_ID',

  // ── Branding ────────────────────────────────────────────────────────────────
  BRAND_NAME: 'YourName',

  // ── Stream Links (shown in the links bar) ───────────────────────────────────
  CHANNELS: {
    twitch:   'https://twitch.tv/YOUR_TWITCH',
    youtube:  'https://youtube.com/@YOUR_YOUTUBE',
    kick:     'https://kick.com/YOUR_KICK',
    abstract: 'https://portal.abs.xyz/stream/YOUR_ABSTRACT'
  },

  // ── Default UI Settings ─────────────────────────────────────────────────────
  // These are only used the first time — after that your settings are saved
  // automatically in the browser's localStorage.
  DEFAULTS: {
    bgColor:   { r: 14, g: 14, b: 16 },  // Dark background
    bgAlpha:   1,                          // 0 = transparent, 1 = opaque
    fontScale: 1                           // 1 = 100%, 1.5 = 150%, etc.
  }
};
