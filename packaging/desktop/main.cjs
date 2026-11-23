const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const REMOTE_URL = 'https://404-horror.ai.studio';
const APP_DIST_DIR = path.join(__dirname, 'app-dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

let fallbackServer = null;
let fallbackBaseUrl = null;
let mainWindow = null;

function startOfflineFallbackServer() {
  return new Promise((resolve) => {
    if (fallbackBaseUrl) {
      resolve(fallbackBaseUrl);
      return;
    }

    const server = http.createServer((req, res) => {
      const reqUrl = (req.url || '/').split('?')[0];
      const safeRel = path.normalize(reqUrl).replace(/^(\.\.[/\\])+/, '');
      let targetPath = path.join(APP_DIST_DIR, safeRel === '/' ? 'index.html' : safeRel);

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        targetPath = path.join(APP_DIST_DIR, 'index.html');
      }

      if (!fs.existsSync(targetPath)) {
        res.writeHead(404);
        res.end('Offline bundle missing. Run packaging/build-exe.sh first.');
        return;
      }

      const ext = path.extname(targetPath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(targetPath);

      // Support HTTP Range requests for offline MP4 video playback
      const range = req.headers.range;
      if (range && ext === '.mp4') {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': mime,
        });
        fs.createReadStream(targetPath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
      });
      fs.createReadStream(targetPath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      fallbackServer = server;
      fallbackBaseUrl = `http://127.0.0.1:${addr.port}`;
      resolve(fallbackBaseUrl);
    });
  });
}

async function isRemoteReachable(timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(REMOTE_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function loadBestSource(win, { clearCache = false } = {}) {
  if (clearCache) {
    await win.webContents.session.clearCache();
  }

  const online = await isRemoteReachable();
  if (online) {
    await win.loadURL(REMOTE_URL);
  } else {
    const localUrl = await startOfflineFallbackServer();
    await win.loadURL(localUrl);
  }
}

function buildAppMenu(win) {
  const template = [
    {
      label: '系统与更新',
      submenu: [
        {
          label: '检查热更新 (同步 404-horror.ai.studio)',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => {
            void loadBestSource(win, { clearCache: true });
          },
        },
        {
          label: '切换到本地离线包',
          click: async () => {
            const localUrl = await startOfflineFallbackServer();
            await win.loadURL(localUrl);
          },
        },
        { type: 'separator' },
        { role: 'reload', label: '刷新画面' },
        { role: 'togglefullscreen', label: '全屏切换' },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    title: '伪人入侵',
    backgroundColor: '#070b14',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      partition: 'persist:404horror',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Identify desktop shell while preserving standard Chrome capabilities
  mainWindow.webContents.setUserAgent(
    `${mainWindow.webContents.getUserAgent()} 404Horror-Desktop/1.0`
  );

  // Automatic offline fallback if live URL fails after launch
  let fellBackOnce = false;
  mainWindow.webContents.on('did-fail-load', async (_event, errorCode, _desc, validatedURL) => {
    if (errorCode === -3 || fellBackOnce) return;
    if (validatedURL && validatedURL.startsWith(REMOTE_URL)) {
      fellBackOnce = true;
      const localUrl = await startOfflineFallbackServer();
      await mainWindow.loadURL(localUrl);
    }
  });

  // Open third-party links externally instead of spawning Electron popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  buildAppMenu(mainWindow);
  await loadBestSource(mainWindow);
}

ipcMain.handle('force-remote-sync', async () => {
  if (mainWindow) {
    await loadBestSource(mainWindow, { clearCache: true });
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (fallbackServer) {
    fallbackServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
