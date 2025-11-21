// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { createRequire } = require('module');

const PORT = process.env.SCENECHUNKS_PORT || 3678;

let mainWindow = null;
let httpServer = null;
let nextApp = null;

// 🔒 Only allow a single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function log(...args) {
  console.log('[SceneChunks]', ...args);
}

function getAppDir() {
  if (!app.isPackaged) {
    // Dev: use project folder
    return process.cwd();
  }
  // Packaged: electron-builder (asar: false) puts app contents in resources/app
  return path.join(process.resourcesPath, 'app');
}

async function startNextInProcess(port) {
  const appDir = getAppDir();

  const pkgJsonPath = path.join(appDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    log('No package.json found at', pkgJsonPath);
    return null;
  }

  const requireFromApp = createRequire(pkgJsonPath);

  let next;
  try {
    next = requireFromApp('next');
  } catch (err) {
    log('Failed to require next from appDir:', err);
    return null;
  }

  log('Starting Next.js in-process from', appDir);

  nextApp = next({
    dev: false,
    dir: appDir,
    hostname: '127.0.0.1',
    port,
  });

  await nextApp.prepare();

  const handle = nextApp.getRequestHandler();

  httpServer = http.createServer((req, res) => {
    handle(req, res);
  });

  await new Promise((resolve, reject) => {
    httpServer.listen(port, '127.0.0.1', err => {
      if (err) return reject(err);
      log(`Next.js server listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  return `http://127.0.0.1:${port}`;
}

function createMainWindow(url) {
  if (mainWindow) {
    mainWindow.loadURL(url);
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(url);
}

async function bootstrap() {
  if (app.isPackaged) {
    const url =
      (await startNextInProcess(PORT)) ||
      'data:text/html,<h1>Scene Chunks</h1><p>Could not start server.</p>';
    createMainWindow(url);
  } else {
    // Dev: assume `npm run dev` on 3000
    createMainWindow('http://localhost:3000');
  }
}

if (gotLock) {
  app.whenReady().then(() => {
    bootstrap().catch(err => {
      log('Error during bootstrap:', err);
      const fallback =
        'data:text/html,<h1>Scene Chunks</h1><p>Could not start server.</p>';
      createMainWindow(fallback);
    });
  });

  app.on('window-all-closed', () => {
    if (httpServer) {
      httpServer.close();
      httpServer = null;
    }
    if (nextApp && nextApp.close) {
      nextApp.close().catch(err => log('Error closing Next app:', err));
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (!mainWindow) {
      bootstrap().catch(err => {
        log('Error during activate bootstrap:', err);
        const fallback =
          'data:text/html,<h1>Scene Chunks</h1><p>Could not start server.</p>';
        createMainWindow(fallback);
      });
    }
  });
}
