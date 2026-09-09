#!/usr/bin/env bash
# FileTools Installer — Linux (Debian/Ubuntu) & macOS
# Usage:
#   ./scripts/install.sh            # install system deps + build
#   sudo ./scripts/install.sh --systemd   # additionally install systemd units
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_SYSTEMD=0
[[ "${1:-}" == "--systemd" ]] && INSTALL_SYSTEMD=1

echo "=== FileTools Installer ==="
echo "Project dir: $PROJECT_DIR"

if [[ "$(uname -s)" == "Darwin" ]]; then
  # ---------- macOS ----------
  echo "[1/5] Checking Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  echo "[2/5] Installing tools (ffmpeg, qpdf, ghostscript, p7zip, poppler, libreoffice)..."
  brew install node pnpm postgresql@16 redis ffmpeg qpdf ghostscript sevenzip poppler libreoffice
  echo "[3/5] Starting services..."
  brew services start postgresql@16 || true
  brew services start redis || true
else
  # ---------- Debian/Ubuntu ----------
  echo "[1/5] Updating package lists..."
  sudo apt-get update
  echo "[2/5] Installing system tools..."
  sudo apt-get install -y curl git build-essential \
    postgresql postgresql-contrib redis-server \
    ffmpeg qpdf ghostscript p7zip-full poppler-utils \
    libreoffice && true || echo "(some packages were unavailable; the installers will tell you what FileTools needs)"
  echo "[3/5] Installing Node.js & pnpm..."
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    sudo corepack enable
    sudo corepack prepare pnpm@9.15.0 --activate
  fi
  echo "[4/5] Starting PostgreSQL & Redis..."
  sudo systemctl enable --now postgresql redis-server || true
fi

echo "[5/5] Installing JS dependencies & building..."
cd "$PROJECT_DIR"
if [[ ! -f .env ]]; then cp .env.example .env; echo "  Created .env from .env.example — adjust if needed."; fi
pnpm install
pnpm build

echo "Creating default database/user (filetools:filetools)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='filetools'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER filetools WITH PASSWORD 'filetools';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='filetools'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE filetools OWNER filetools;"

if [[ "$INSTALL_SYSTEMD" == "1" ]]; then
  echo "Installing systemd units..."
  sudo mkdir -p /etc/filetools
  if [[ -f .env ]]; then sudo cp .env /etc/filetools/filetools.env; fi
  sudo cp "$PROJECT_DIR"/scripts/systemd/*.service /etc/systemd/system/
  sudo sed -i "s|__PROJECT_DIR__|$PROJECT_DIR|g" /etc/systemd/system/filetools-*.service
  sudo sed -i "s|__USER__|$(whoami)|g" /etc/systemd/system/filetools-*.service
  sudo systemctl daemon-reload
  echo "  Enable autostart: sudo systemctl enable filetools (run .\scripts\start.sh first to start now)"
fi

echo ""
echo "=== Done! ==="
echo "  Start now:       ./scripts/start.sh"
echo "  Open:            http://localhost:3000  (first-visit setup wizard)"
echo "  systemd (if any): sudo systemctl {start,stop,status} filetools"