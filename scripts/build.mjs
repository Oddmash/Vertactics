import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, writeFileSync } from 'node:fs';

const [option, path] = process.argv.slice(2);
const base = path ?? '/';
if ((option && option !== '--base') || (option && !path) || !/^\/(?:[\w-]+\/)*$/.test(base)) {
  throw new Error('Expected --base followed by an absolute path ending with a slash');
}

const run = (args) => {
  const result = spawnSync('pnpm', args, { env: { ...process.env, VERTACTICS_BASE: base }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(['exec', 'vite', 'build', '--base', base]);
run(['--filter', '@vertactics/landing', 'build']);

const out = 'apps/landing/out';
cpSync(out, 'dist/about', { recursive: true });
for (const path of ['sitemap.xml', 'robots.txt']) copyFileSync(`${out}/${path}`, `dist/${path}`);
writeFileSync('dist/.nojekyll', '');
