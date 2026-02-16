import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { resolve } from 'path';

const projectDir = resolve('/vercel/share/v0-project');

console.log('Removing node_modules and package-lock.json...');
try { rmSync(resolve(projectDir, 'node_modules'), { recursive: true, force: true }); } catch {}
try { rmSync(resolve(projectDir, 'package-lock.json'), { force: true }); } catch {}

console.log('Running npm install to regenerate lock file...');
execSync('npm install', { cwd: projectDir, stdio: 'inherit' });

console.log('Done! package-lock.json has been regenerated.');
