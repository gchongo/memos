#!/usr/bin/env bash
set -euo pipefail

# Deploy Memos with Docker on VPS.
# Default install path: /www/dk_project/dk_app/memos
# Repository: https://github.com/gchongo/memos.git

INSTALL_DIR="${INSTALL_DIR:-/www/dk_project/dk_app/memos}"
REPO_URL="${REPO_URL:-https://github.com/gchongo/memos.git}"
BRANCH="${BRANCH:-main}"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is not installed" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "error: docker compose plugin is not available" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"

if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo ">> Cloning $REPO_URL into $INSTALL_DIR"
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
else
  echo ">> Updating repository in $INSTALL_DIR"
  git -C "$INSTALL_DIR" fetch origin "$BRANCH"
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$INSTALL_DIR"

mkdir -p data

export MEMOS_COMMIT="$(git rev-parse --short HEAD)"
export MEMOS_VERSION="$(git describe --tags --always 2>/dev/null || echo dev)"

echo ">> Building and starting Memos (commit: $MEMOS_COMMIT)"
docker compose -f compose.memos.yaml -p memos up -d --build

echo ""
echo "Memos deployed."
echo "  Directory : $INSTALL_DIR"
echo "  Data      : $INSTALL_DIR/data"
echo "  URL       : http://<your-server-ip>:${MEMOS_PORT:-5230}"
echo ""
echo "Useful commands:"
echo "  docker compose -f $INSTALL_DIR/compose.memos.yaml -p memos logs -f"
echo "  docker compose -f $INSTALL_DIR/compose.memos.yaml -p memos restart"
echo "  docker compose -f $INSTALL_DIR/compose.memos.yaml -p memos down"
