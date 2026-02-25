# Electron + React + Ant Design + PostgreSQL

Template for desktop development on Linux with Windows build output.

## Stack

- Electron (main + preload + renderer split)
- React + Vite + TypeScript
- Ant Design for UI
- PostgreSQL via `pg` from Electron main process only
- `electron-builder` for Windows packaging (`nsis` + `portable`)

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create env file:

   ```bash
   cp .env.example .env
   ```

3. Configure PostgreSQL connection in `.env`.

4. Start development:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — starts Vite and Electron together.
- `npm run build` — builds renderer and Electron bundles.
- `npm run import:data` — creates schema and imports demo data into PostgreSQL.
- `npm run dist:win` — creates Windows distributables in `release/`.

## Data import

1. Configure PostgreSQL in `.env`.
2. Run:

   ```bash
   npm run import:data
   ```

Import is idempotent: repeated runs update existing rows and do not duplicate data.

## PostgreSQL notes

- Database credentials are read from environment variables (`.env`).
- Renderer process never connects to database directly.
- Renderer -> preload -> IPC -> main -> PostgreSQL.

## Build Windows on Linux

`electron-builder` needs Wine for cross-building `.exe` artifacts.

Install prerequisites (Ubuntu/Debian example):

```bash
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine64 wine32
```

Then run:

```bash
npm run dist:win
```

## Alternative: Docker build for Windows artifacts

If local Wine setup is inconvenient, build using Docker image:

```bash
docker run --rm -it \
  -v "$PWD":/project \
  -w /project \
  electronuserland/builder:wine \
  /bin/bash -lc "npm install && npm run dist:win"
```

## Security baseline

- Keep secrets out of git (`.env` is local only).
- Use `contextIsolation: true` and a narrow preload API surface.
