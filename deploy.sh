#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  source "$SCRIPT_DIR/.env.deploy"
  set +a
else
  echo "Arquivo .env.deploy não encontrado em $SCRIPT_DIR"
  exit 1
fi

: "${DEPLOY_HOST:?DEPLOY_HOST não definido}"
: "${DEPLOY_PORT:?DEPLOY_PORT não definido}"
: "${DEPLOY_USER:?DEPLOY_USER não definido}"
: "${DEPLOY_PATH:?DEPLOY_PATH não definido}"

scp -P "$DEPLOY_PORT" -r \
  "$SCRIPT_DIR/dist" \
  "$SCRIPT_DIR/package.json" \
  "$SCRIPT_DIR/package-lock.json" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"