const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const tmpDir = path.join(root, '.tmp');
const metroCacheDir = path.join(tmpDir, 'metro-cache');
const expoCacheDir = path.join(tmpDir, 'expo-cache');

fs.mkdirSync(tmpDir, { recursive: true });
fs.rmSync(metroCacheDir, { recursive: true, force: true });
fs.mkdirSync(metroCacheDir, { recursive: true });
fs.mkdirSync(expoCacheDir, { recursive: true });

fs.writeFileSync(path.join(root, 'expo.server.out.log'), '');
fs.writeFileSync(path.join(root, 'expo.server.err.log'), '');

const child = spawn(
  'powershell.exe',
  [
    '-NoExit',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(root, 'scripts', 'start-expo-local-cache.ps1'),
  ],
  {
    cwd: root,
    detached: true,
    env: {
      ...process.env,
      TMP: tmpDir,
      TEMP: tmpDir,
      EXPO_NO_DOTSLASH: '1',
      EXPO_USE_METRO_WORKSPACE_ROOT: '1',
    },
    stdio: 'ignore',
    windowsHide: false,
  },
);

child.unref();
fs.writeFileSync(path.join(tmpDir, 'expo.pid'), String(child.pid));
console.log(`Expo launcher started PID ${child.pid}`);
