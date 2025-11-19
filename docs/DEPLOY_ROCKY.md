# Deploy to Rocky Linux (Biznet VPS) — Single Server, Single Terminal

This guide shows a simple, repeatable way to deploy BestTravel (Frontend + Backend + Caddy) on one Rocky Linux server using Docker Compose. No need to install Node or Go on the server.

## Prerequisites

- Rocky Linux 8/9 VM with public IP
- A domain pointed to the server IP (A record), e.g. example.com
- SSH access as a sudo-capable user

## 1) Install Docker & Compose Plugin

```bash
# Become root (optional)
sudo -i

# Install dependencies
sudo dnf -y install yum-utils

# Add Docker CE repo
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install docker + compose plugin
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable & start
sudo systemctl enable --now docker

# Verify
docker --version
docker compose version
```

## 2) Clone Repository

```bash
# In your home directory or /opt
cd ~

# Clone
git clone https://github.com/your-org/BestTravel.git
cd BestTravel
```

## 3) Prepare Environment

```bash
# Copy env file
cp .env.example .env

# Edit .env (root)
# - JWT_SECRET=<strong_random_secret>
# - DB_DRIVER=mysql (or sqlite)
# - if mysql: DB_HOST/PORT/USER/PASSWORD/NAME, DB_PARAMS
# - CORS_ORIGINS, etc.

# Create uploads directory (bind mount)
mkdir -p uploads
```

Notes:
- docker-compose.yml reads from the root .env
- Backend uses the same root .env; no separate core/.env is needed

## 4) Build Frontend (without installing Node)

Use a one-off Node container to build the frontend assets into views/dist:

```bash
docker run --rm \
  -v "$(pwd)/views":/app \
  -w /app node:20-alpine sh -c "npm ci && npm run build"
```

This writes production build into views/dist, which Caddy will serve.

## 5) Start the Stack

```bash
# Start or rebuild services
docker compose up -d --build

# Check logs
docker compose logs -f
```

Services:
- Caddy: ports 80/443 (serves frontend and proxies /api to backend)
- Backend: exposed internally on 8080

When DNS is correct, Caddy will fetch/renew TLS certs automatically.

## 6) Firewall & SELinux (if applicable)

```bash
# Allow HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

If SELinux is enforcing and you use bind mounts from custom paths, you may need to label them or switch to permissive for initial testing.

## 7) Update & Redeploy

```bash
cd ~/BestTravel
git pull

# Rebuild frontend
docker run --rm -v "$(pwd)/views":/app -w /app node:20-alpine sh -c "npm ci && npm run build"

# Restart stack
docker compose up -d --build
```

## 8) Optional: Systemd Unit for Auto-Start

Create /etc/systemd/system/besttravel.service:

```ini
[Unit]
Description=BestTravel Docker Compose Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/home/<youruser>/BestTravel
RemainAfterExit=true
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now besttravel
```

## 9) Health Checks

- http://yourdomain.com/health (served by Caddy → backend)
- http://yourdomain.com/api/packages
- Check logs:
  - `docker compose logs -f caddy`
  - `docker compose logs -f backend`

## Directory Summary

- Caddyfile — main Caddy config used by docker-compose
- docker-compose.yml — orchestrates backend + Caddy
- views/dist — built frontend assets served by Caddy
- uploads/ — user-uploaded images (bind mount)
- data/ — optional SQLite database (bind mount) if you choose DB_DRIVER=sqlite
- core/ — backend source (built into image by docker compose)

## Tips

- Keep this as a monorepo—it simplifies single-server deployment with Compose
- Protect JWT_SECRET and admin credentials
- Set DOMAIN in .env for proper HTTPS redirects and cookie scopes
- Use `docker compose ps` and `docker compose logs` for status and debugging
