const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const cache = path.join(root, '.tmp', 'android-guard-test-tools');
  fs.mkdirSync(cache, { recursive: true });
  const jars = [
    ['groovy', 'org/apache/groovy/groovy/4.0.28/groovy-4.0.28.jar', 'd77164a44ab994837e61eecead64721bdb1794fa2bc6704ac6fe70cd32ef9dd3'],
    ['asm', 'org/ow2/asm/asm/9.8/asm-9.8.jar', '876eab6a83daecad5ca67eb9fcabb063c97b5aeb8cf1fca7a989ecde17522051'],
  ];
  const files = await Promise.all(jars.map(async ([name, artifact, expected]) => {
    const file = path.join(cache, `${name}.jar`);
    let bytes;
    if (fs.existsSync(file)) bytes = fs.readFileSync(file);
    else {
      const response = await fetch(`https://repo.maven.apache.org/maven2/${artifact}`);
      if (!response.ok) throw new Error(`Could not download test dependency ${name}: ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Checksum mismatch for ${name}`);
    fs.writeFileSync(file, bytes);
    return file;
  }));
  execFileSync('java', ['-cp', files.join(path.delimiter), 'groovy.ui.GroovyMain', 'scripts/test-android-window-guards.groovy', root], { cwd: root, stdio: 'inherit' });
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
