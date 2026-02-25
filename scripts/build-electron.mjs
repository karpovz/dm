import { build } from 'esbuild'

const sharedConfig = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outdir: '.',
  external: ['electron', 'pg', 'dotenv', 'path', 'url', 'node:path', 'node:url'],
}

const entryPoints = {
  main: 'electron/main.ts',
  preload: 'electron/preload.ts',
}

await build({
  ...sharedConfig,
  entryPoints,
  outExtension: { '.js': '.cjs' },
  minify: true,
})
