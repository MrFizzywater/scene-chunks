// main.js
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

let server;

function waitForUrl(url, { timeout = 30000, interval = 300 } = {}) {
  const end = Date.now() + timeout;
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, res => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > end) return reject(new Error('Timeout waiting for app server'));
        setTimeout(check, interval);
      });
      req.end();
    };
    check();
  });
}

// Where is our app's root?
function getBaseDir() {
  if (app.isPackaged) {
    // electron-builder with asar:false puts your code in "<App>.app/Contents/Resources/app"
    return path.join(process.resourcesPath, 'app');
  }
  // in dev, this is just your project folder
  return process.cwd();
}

function resolveNextBin(baseDir) {
  try {
    // dev / node_modules resolution
    return require.resolve('next/dist/bin/next');
  } catch {
    // packaged: resolve relative to where node_modules was bundled
    return path.join(baseDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  }
}

function startNextServer(port = 3678) {
  const baseDir = getBaseDir();
  const nextBin = resolveNextBin(baseDir);

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1', // run as plain Node process, not another Electron window
  };

  server = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: baseDir,   // 👈 THIS is the important bit: .next lives here
    env,
    stdio: 'inherit',
  });

  return `http://127.0.0.1:${port}`;
}

async function createWindow() {
  const url = startNextServer(3678);
  await waitForUrl(url);

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(url);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
