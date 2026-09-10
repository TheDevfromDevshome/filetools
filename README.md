# FileTools

**Self-hosted file converter platform** — convert images, PDFs, audio, video, archives and documents right on your own server or PC. Fast, private, no registration.

> **Brand new in v1.0:** First-run setup wizard (choose language + local domain), mDNS discovery (`filetools.local`), and one-command installers for Linux, macOS and Windows.

## Highlights

- 🔒 **100% private** — file conversion happens on *your* machine. No cloud, no tracking, no ads.
- 🗂️ **63 converters** across 6 categories.
- 🌍 **English / German UI**, switchable at any time.
- 🌐 **mDNS**: reach the app at `http://filetools.local` (or `http://converter.local`, or a custom name) on your network.
- ⚙️ **First-run wizard**: pick your language and local domain in one click during the very first visit.
- 📦 **Installers** for Linux (systemd), macOS, Windows, and Docker.

## Categories

| Category | Examples |
|---|---|
| 🖼️ **Image** | JPG/PNG/WebP/GIF/BMP/TIFF/SVG → WebP, JPG, PNG, ICO, PDF |
| 📄 **PDF** | merge, split, rotate, compress, encrypt/unlock, watermark, extract, to text/images |
| 🎵 **Audio** | MP3, WAV, OGG, FLAC, M4A, AAC, OPUS, WMA, AIFF, AMR, WAV → MP3, M4B |
| 🎬 **Video** | MP4, AVI, MKV, WebM, MOV, WMV, FLV + … → MP4, WebM, GIF, MP3 |
| 🗜️ **Archive** | ZIP, 7Z, RAR, TAR, GZ, BZ2, XZ → any other archive format |
| 📑 **Document** | DOCX/XLSX/PPTX → PDF, TXT/HTML/MD/EPUB → PDF, docx→odt, spreadsheet→xlsx/ods/csv |

## Requirements

- **Node.js ≥ 20** and **pnpm ≥ 9**
- **PostgreSQL** (≥ 14) and **Redis** (≥ 6.2)
- Worker binaries (installed by the installers, or available on PATH):
  - [ffmpeg](https://ffmpeg.org) (audio/video)
  - [Ghostscript](https://ghostscript.com) (PDF/image)
  - [qpdf](https://github.com/qpdf/qpdf) (PDF)
  - [7-Zip](https://www.7-zip.org) (`7z`) (archives)
  - [Poppler](https://poppler.freedesktop.org) `pdftotext`/`pdftoppm` (PDF text/images)
  - [LibreOffice](https://www.libreoffice.org) `soffice` (documents)

## Quick start

Requirements first: **Node.js ≥ 20**, **pnpm ≥ 9**, **PostgreSQL** and **Redis** running locally.
Put them into **PATH**, or set the binary paths via the env vars below (worker tools).

```bash
git clone https://github.com/TheDevfromDevshome/filetools.git
cd filetools
cp .env.example .env   # optional: adjust ports/credentials, then save
pnpm install
pnpm build             # compiles shared/packages + web + api
```

Then start the API, web UI and first worker:

```bash
pnpm dev               # API (3001) + Web (3000) + image-worker
```

…and the remaining four workers (PDF, media, archive, document):

```bash
pnpm dev:workers
```

> **Migrations run automatically** on every API start — no manual `db:migrate` needed.
> Don't run `pnpm build` while `pnpm dev` is already running in the same folder —
> the web build would overwrite the dev server's `.next` cache.

**Open** `http://localhost:3000` (or `http://localhost:3002` if `3000` is taken —
the next-dev server prints the actual URL). The **first visit** shows the setup
wizard: choose **English/Deutsch** and a local domain (`filetools.local`,
`converter.local`, or a custom name like `mybox.local`). After saving, the app is
reachable at `http://<domain>:3000` and advertised on the network via mDNS.

On a **server**, open `http://<server-ip>:3000`. The start scripts print every
reachable address **actually configured on this machine** (LAN IPs, localhost,
API) plus a firewall hint. The IP is not fixed — it is read live from the OS at
startup, so it always matches the current network:

```
$ ./scripts/start.sh
FileTools is reachable from this machine/network at:
  Web (192.168.1.50)  http://192.168.1.50:3000
  API (192.168.1.50)  http://192.168.1.50:3001
  mDNS                http://filetools.local:3000  (after first-run setup)
```

The address shown is whatever IP the device has right now (DHCP can change it).
You can also find it manually:

- Linux: `hostname -I` or `ip -4 addr`
- macOS: `ipconfig getifaddr en0`
- Windows: `ipconfig` (look under your adapter) 

If the machine has no LAN IP (no network, or only a VPN), the output only lists
`localhost` — then there is nothing else to reach it by on the network.

If a remote device cannot reach `http://<server-ip>:3000`, allow the ports in
the firewall (`sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp`).

## Installation (bare metal)

### Windows

Open PowerShell **as Administrator** and clone/enter the project:

```powershell
git clone https://github.com/TheDevfromDevshome/filetools.git
cd filetools
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

- Checks/installs Node.js, pnpm, PostgreSQL, Redis, ffmpeg, qpdf, Ghostscript, 7-Zip, Poppler and LibreOffice (via winget where available).
- Copies `.env.example` → `.env`, runs `pnpm install` + `pnpm build`.

Start everything:

```powershell
cd filetools
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

or double-click `start-all.bat` (opens a window per service). Individual services
`start-api.bat`, `start-web.bat`, `start-*-worker.bat`. To stop everything:

```powershell
cd filetools
powershell -ExecutionPolicy Bypass -File .\scripts\stop.ps1
```

### Linux (Debian/Ubuntu) or macOS

```bash
git clone https://github.com/TheDevfromDevshome/filetools.git
cd filetools
./scripts/install.sh                      # system deps (apt/brew) + Postgres/Redis + build
./scripts/start.sh                        # starts API + web + all 5 workers (Ctrl+C stops all)
```

On Linux you can install systemd units so everything runs as a service and
auto-starts at boot:

```bash
cd filetools
sudo ./scripts/install.sh --systemd
sudo systemctl enable --now filetools-api filetools-web \
  filetools-worker@image filetools-worker@pdf filetools-worker@media \
  filetools-worker@archive filetools-worker@document
# status/logs:  systemctl status filetools-api   ·   journalctl -u filetools-api -f
```

> Together with systemd, configure `DATABASE_URL`/`REDIS_URL` in
> `/etc/filetools/filetools.env` (installer copies your `.env` there).

### Docker

```bash
docker compose up -d --build        # builds + starts postgres, redis, api, web and all 5 workers
docker compose ps                   # wait until api reports "healthy"
docker compose logs -f api          # follow API logs
docker compose down                 # stop everything (keep volumes)
docker compose down -v              # stop and delete all data
```

Migrations run automatically when the API container starts — no manual step needed.

Custom ports/domain via environment variables **before** `docker compose up`:

```bash
export WEB_PORT=8080
export API_PORT=3001
export NEXT_PUBLIC_API_URL=http://localhost:3001
export CORS_ORIGIN=http://localhost:8080
docker compose up -d --build
```

> Docker does not publish mDNS by default; use the published port or run with `network_mode: host` on Linux if you need `.local` discovery.

## First-run setup

On the very first visit, the app shows a setup wizard that asks for:

1. **Language** — English or Deutsch.
2. **Local domain name** — `filetools.local`, `converter.local`, or a custom name (e.g. `mybox.local`).

If you skip/complete it later you can still change the language from the header.
The domain name is only used for mDNS advertising and display — you can always reach the
app via the machine's IP:port as well.

### mDNS

When setup is complete, the API publishes an `_http._tcp` mDNS service on the local network
with the chosen name, so modern browsers resolve `http://filetools.local:3000`
(simpler: `http://filetools.local` when the web runs on port 80). No router configuration needed.

## Architecture

```
apps/api        Fastify + PostgreSQL + Redis/BullMQ — REST API, job queue, setup & cloud
apps/web        Next.js frontend (i18n EN/DE)
workers/        image-worker · pdf-worker · media-worker · archive-worker · document-worker
packages/       shared · types · config · database (Drizzle ORM)
```

- **Upload** → saves file to `STORAGE_PATH/jobs/<uuid>/input`
- **Job** → pushed to Redis queue → claimed by the matching worker → output written to `.../output`
- **Done** → files downloadable via `/api/v1/jobs/:id/download`, auto-deleted after `JOB_TTL`.

## API documentation

Interactive OpenAPI docs at `http://localhost:3001/docs` (Swagger UI):

- `GET /api/v1/converters` — all available converters
- `POST /api/v1/upload` — upload files (multipart)
- `POST /api/v1/jobs` — create a conversion job
- `GET /api/v1/jobs/:id/status` — job status
- `GET /api/v1/jobs/:id` — job detail
- `GET /api/v1/jobs/:id/download` — download results (single/ZIP/fileId)
- `GET /api/v1/setup/status` · `POST /api/v1/setup` — first-run setup
- `PUT /api/v1/settings/language` — change UI language
- `GET /api/v1/admin/stats` — usage statistics

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://filetools:filetools@localhost:5432/filetools` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis / BullMQ connection |
| `STORAGE_PATH` | `./data` | Where job files are stored |
| `MAX_FILE_SIZE` | `104857600` (100 MB) | Upload limit in bytes |
| `JOB_TTL` | `3600` | Result retention in seconds |
| `API_PORT` | `3001` | API port |
| `WEB_PORT` | `3000` | Web UI port |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |

## Automatic updates

FileTools checks for updates automatically: once at startup and then every 6 hours
(while the API is running). It compares the installed version against the `main`
branch of the GitHub repository. When a newer commit exists:

- The web UI shows an **"Update available"** banner with the newest commit message.
- **Check now** forces an immediate check.
- **Download** fetches the latest source from GitHub and unpacks it into
  `STORAGE_PATH/updates/<commit>`.
- **Apply** (only when the project is a git clone on `main`) pulls the new source
  via git, runs `pnpm install && pnpm build` and then requires a restart of the
  services.

Controls via environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `GITHUB_OWNER` | `TheDevfromDevshome` | GitHub owner/organization that hosts updates |
| `GITHUB_REPO` | `filetools` | GitHub repository that hosts updates |
| `GITHUB_BRANCH` | `main` | Branch to compare/download against |
| `UPDATE_CHECK_INTERVAL` | `21600000` (6h) | How often to check for updates, in ms |

## Notes on PDF unlock ("remove password")

PDFs can be protected in two ways:

- **Open password** (file asks for a password on open): removal **without knowing the
  password is cryptographically not possible** — that is the point of the encryption.
- **Permissions-only lock** (opens fine, but editing/printing/copying disabled): the
  password is *optional*; qpdf removes this protection without a password automatically.

That is what "Password (if known)" means: it tries with the password, but also handles
permission-only files that need none.

## License

[MIT](LICENSE)

Made with ❤️ for people who like their files to stay on their own hardware.