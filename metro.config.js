const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.platform === 'win32') {
  // Keep Windows dev Metro conservative to reduce startup instability.
  config.maxWorkers = 1;
  config.stickyWorkers = false;
  config.transformer.unstable_workerThreads = true;
}

module.exports = config;
