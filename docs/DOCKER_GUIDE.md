# 🐳 Docker Deployment Guide - BestTravel

Complete guide untuk deploy BestTravel menggunakan Docker + Caddy.

## 📋 Prerequisites

- Docker Desktop (Windows) atau Docker Engine (Linux)
- Docker Compose
- Node.js & npm (untuk build frontend)

### Install Docker Desktop (Windows)
1. Download dari: https://www.docker.com/products/docker-desktop
2. Install dan restart komputer
3. Verify: `docker --version` dan `docker-compose --version`

## 🚀 Quick Start - Testing Locally

### 1. Build Frontend
```powershell
cd views
npm install
npm run build
```

Ini akan generate static files di `views/dist/`

### 2. Setup Environment
```powershell
# Copy example env file
Copy-Item .env.example -Destination .env

# Edit .env if needed (optional untuk testing)
notepad .env
```

### 3. Start Docker Containers
```powershell
# Build and start all services
docker-compose up --build

# Or run in background (detached mode)
docker-compose up -d --build
```

### 4. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Health Check**: http://localhost/health

### 5. View Logs
```powershell
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View Caddy logs only
docker-compose logs -f caddy
```

### 6. Stop Containers
```powershell
# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes (⚠️ deletes database!)
docker-compose down -v
```

## 📁 Project Structure

```
BestTravel/
├── core/
│   ├── Dockerfile              # Backend Docker build
│   └── .dockerignore           # Files to ignore
├── views/
│   ├── dist/                   # Frontend build output (generated)
│   └── .dockerignore           # Files to ignore
├── docker-compose.yml          # Service orchestration
├── Caddyfile                   # Reverse proxy config
├── .env                        # Environment variables
├── .env.example               # Example environment file
├── data/                       # SQLite database (auto-created)
│   └── besttravel.db          # Database file
└── uploads/                    # Uploaded images (auto-created)
```

## 🔧 Docker Compose Services

### Backend (`backend`)
- **Image**: Built from `core/Dockerfile`
- **Port**: 8080 (internal)
- **Volumes**:
  - `./data` → Database persistence
  - `./uploads` → Uploaded images
- **Health Check**: Ping `/health` every 30s

### Caddy (`caddy`)
- **Image**: `caddy:2-alpine`
- **Ports**: 
  - 80 (HTTP)
  - 443 (HTTPS)
  - 443/udp (HTTP/3)
- **Functions**:
  - Reverse proxy untuk API
  - Serve static frontend files
  - Auto HTTPS (production)
  - Compression (gzip, zstd)

## 🛠️ Development vs Production

### Local Development (Current Setup)
```powershell
# Backend with hot-reload
cd core
.\dev.ps1

# Frontend with hot-reload
cd views
npm run dev
```
✅ Fast iteration, hot-reload, debug mode

### Production (Docker)
```powershell
# Build frontend
cd views
npm run build

# Start containers
docker-compose up -d --build
```
✅ Optimized, isolated, scalable, production-ready

## 🌐 VPS Deployment

### 1. Prepare VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Upload Project
```bash
# Using git
git clone https://github.com/yourusername/BestTravel.git
cd BestTravel

# Or using scp/rsync
scp -r BestTravel user@your-vps-ip:/home/user/
```

### 3. Configure Domain
Edit `.env`:
```env
DOMAIN=besttravel.com
JWT_SECRET=generate-random-secret-here
```

Edit DNS records (di domain provider):
```
Type: A
Name: @
Value: YOUR_VPS_IP

Type: A
Name: www
Value: YOUR_VPS_IP
```

### 4. Build & Deploy
```bash
# Build frontend
cd views
npm install
npm run build
cd ..

# Start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 5. Caddy Auto HTTPS
Caddy akan otomatis:
- Request SSL certificate dari Let's Encrypt
- Setup HTTPS redirect
- Auto-renew certificate

## 🔍 Troubleshooting

### Port Already in Use
```powershell
# Check what's using port 80
netstat -ano | findstr :80

# Stop IIS (if running)
iisreset /stop

# Or change ports in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080 instead
```

### Database Locked Error
```powershell
# Stop containers
docker-compose down

# Check if any process is using database
# Delete .db-shm and .db-wal files
Remove-Item data/*.db-shm
Remove-Item data/*.db-wal

# Restart
docker-compose up -d
```

### Frontend Not Loading
```powershell
# Rebuild frontend
cd views
npm run build

# Check if dist/ folder exists
ls dist/

# Restart Caddy
docker-compose restart caddy
```

### Backend Not Responding
```powershell
# Check backend logs
docker-compose logs backend

# Check health status
docker-compose ps

# Rebuild backend
docker-compose up -d --build backend
```

### Permission Denied (Linux/VPS)
```bash
# Fix directory permissions
sudo chown -R $USER:$USER ./data
sudo chown -R $USER:$USER ./uploads
sudo chmod -R 755 ./data
sudo chmod -R 755 ./uploads
```

## 📊 Useful Commands

### Container Management
```powershell
# List running containers
docker-compose ps

# Restart specific service
docker-compose restart backend

# View resource usage
docker stats

# Execute command in container
docker-compose exec backend sh
```

### Database Management
```powershell
# Backup database
Copy-Item data/besttravel.db -Destination "data/backup-$(Get-Date -Format 'yyyy-MM-dd').db"

# Restore database
Copy-Item data/backup-2025-11-06.db -Destination data/besttravel.db
docker-compose restart backend
```

### Logs
```powershell
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Since specific time
docker-compose logs --since 30m
```

### Cleanup
```powershell
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (⚠️ careful!)
docker system prune -a --volumes
```

## 🔒 Security Checklist (Production)

- [ ] Change `JWT_SECRET` to random strong value
- [ ] Use real domain in `.env`
- [ ] Enable firewall (only ports 80, 443, 22)
- [ ] Regular backups of database
- [ ] Update Docker images regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use strong admin password
- [ ] Enable HTTPS (Caddy does this automatically)

## 📈 Scaling (Future)

### Add More Backend Instances
```yaml
backend:
  # ... existing config
  deploy:
    replicas: 3
```

### Add Redis for Session
```yaml
redis:
  image: redis:alpine
  restart: unless-stopped
```

### Add PostgreSQL (instead of SQLite)
```yaml
postgres:
  image: postgres:alpine
  environment:
    POSTGRES_DB: besttravel
    POSTGRES_USER: user
    POSTGRES_PASSWORD: password
```

## 🎯 Next Steps

1. ✅ Test locally with Docker
2. ✅ Setup VPS and domain
3. ✅ Deploy to production
4. ✅ Monitor and maintain
5. ✅ Scale as needed

## 📚 Resources

- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Caddy: https://caddyserver.com/docs/
- Let's Encrypt: https://letsencrypt.org/

---

**Happy Deploying! 🚀**
