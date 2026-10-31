const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.env.EAS_BUILD_PLATFORM !== 'android' || process.env.EAS_BUILD_PROFILE !== 'production') process.exit(0);
const bundle = path.resolve('android/app/build/outputs/bundle/release/app-release.aab');
if (!fs.existsSync(bundle)) throw new Error(`Expected production AAB missing: ${bundle}`);
execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['scripts/verify-android-release.py', bundle], { stdio: 'inherit' });
