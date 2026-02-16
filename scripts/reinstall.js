import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const projectDir = '/vercel/share/v0-project';

// Remove package-lock.json if it exists
const lockFile = join(projectDir, 'package-lock.json');
if (existsSync(lockFile)) {
  console.log('Removing stale package-lock.json...');
  rmSync(lockFile);
} else {
  console.log('No package-lock.json found (already removed).');
}

// Remove node_modules
const nodeModules = join(projectDir, 'node_modules');
if (existsSync(nodeModules)) {
  console.log('Removing node_modules...');
  rmSync(nodeModules, { recursive: true, force: true });
}

// Run npm install to regenerate lock file
console.log('Running npm install...');
try {
  execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
  console.log('Successfully regenerated package-lock.json and installed dependencies.');
} catch (error) {
  console.error('npm install failed:', error.message);
  process.exit(1);
}
