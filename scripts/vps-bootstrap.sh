#!/usr/bin/env bash
# Run ON the VPS as root after: ssh root@72.61.193.155
# Usage: curl -fsSL ... | bash   OR   bash vps-bootstrap.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/dbluxurycars}"
REPO_URL="${REPO_URL:-https://github.com/CheckJack/dbluxurycarsmoroccowb.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
# Public IP (no domain) — override if needed: export PUBLIC_IP=1.2.3.4
PUBLIC_IP="${PUBLIC_IP:-72.61.193.155}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg ufw

echo "==> Node.js 22.x (NodeSource)..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null || true)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "    node $(node -v) npm $(npm -v)"

echo "==> PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib

echo "==> PM2..."
npm install -g pm2

echo "==> Firewall (SSH + app ports)..."
ufw allow OpenSSH
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable || true

echo "==> Clone / update app..."
mkdir -p "$(dirname "$APP_ROOT")"
if [[ -d "$APP_ROOT/.git" ]]; then
  git -C "$APP_ROOT" fetch --depth 1 origin "$REPO_BRANCH"
  git -C "$APP_ROOT" reset --hard "origin/$REPO_BRANCH"
else
  rm -rf "$APP_ROOT"
  git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_ROOT"
fi

BACKEND="$APP_ROOT/dbcars/backend"
FRONTEND="$APP_ROOT/dbcars/frontend"
BACKUP_SQL="$BACKEND/backup.sql"

if [[ ! -f "$BACKUP_SQL" ]]; then
  echo "ERROR: missing $BACKUP_SQL (wrong repo layout or branch?)" >&2
  exit 1
fi

echo "==> Database: set postgres password & create dbcars_db..."
DB_PASS_FILE="/root/dbcars-db-credentials.txt"
if [[ ! -f "$DB_PASS_FILE" ]]; then
  POSTGRES_APP_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  printf 'POSTGRES_PASSWORD=%s\nJWT_SECRET=%s\n' "$POSTGRES_APP_PASSWORD" "$JWT_SECRET" >"$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
POSTGRES_APP_PASSWORD="$(grep '^POSTGRES_PASSWORD=' "$DB_PASS_FILE" | cut -d= -f2-)"
JWT_SECRET="$(grep '^JWT_SECRET=' "$DB_PASS_FILE" | cut -d= -f2-)"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'dbcars_db'" | grep -q 1 || \
  sudo -u postgres createdb dbcars_db

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_APP_PASSWORD';"

TABLE_COUNT="$(sudo -u postgres psql -d dbcars_db -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")"
if [[ "${TABLE_COUNT:-0}" -eq 0 ]]; then
  echo "==> Restoring schema/data from backup.sql (strip pg18 \\restrict lines)..."
  grep -v '^\\restrict ' "$BACKUP_SQL" | grep -v '^\\unrestrict ' | sudo -u postgres psql -d dbcars_db -v ON_ERROR_STOP=1 -q
else
  echo "==> Database already has tables; skipping backup restore."
fi

echo "==> Backend .env..."
mkdir -p "$BACKEND/uploads"
cat >"$BACKEND/.env" <<EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbcars_db
DB_USER=postgres
DB_PASSWORD=$POSTGRES_APP_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://${PUBLIC_IP}:3000
PUBLIC_FRONTEND_URL=http://${PUBLIC_IP}:3000
PUBLIC_API_URL=http://${PUBLIC_IP}:3001
EOF
chmod 600 "$BACKEND/.env"

echo "==> Frontend .env.production (build-time API URL)..."
cat >"$FRONTEND/.env.production" <<EOF
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:3001/api
EOF

echo "==> npm install & build backend..."
cd "$BACKEND"
npm ci
npm run build

echo "==> npm install & build frontend..."
cd "$FRONTEND"
npm ci
npm run build

echo "==> PM2 processes..."
pm2 delete dbcars-api 2>/dev/null || true
pm2 delete dbcars-web 2>/dev/null || true
pm2 start "$BACKEND/dist/index.js" --name dbcars-api --cwd "$BACKEND"
pm2 start npm --name dbcars-web --cwd "$FRONTEND" -- start
pm2 save
STARTUP_CMD="$(pm2 startup systemd -u root --hp /root | grep -E 'sudo env PATH=' || true)"
if [[ -n "$STARTUP_CMD" ]]; then
  eval "$STARTUP_CMD" || true
fi

echo ""
echo "Done."
echo "  Frontend: http://${PUBLIC_IP}:3000"
echo "  API:      http://${PUBLIC_IP}:3001"
echo "  DB + JWT secrets: $DB_PASS_FILE (root-only)"
echo "  Change root password & add SSH keys; email optional (BREVO_* in $BACKEND/.env)."
