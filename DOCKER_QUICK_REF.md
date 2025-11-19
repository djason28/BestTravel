# 🚀 Quick Reference - Docker Commands

## Testing Docker Locally

### Option 1: Automated Setup (Recommended)
```powershell
.\docker-test.ps1
```
This will:
- ✅ Check Docker installation
- ✅ Build frontend automatically
- ✅ Setup environment
- ✅ Start all containers
- ✅ Show logs

### Option 2: Manual Steps
```powershell
# 1. Build frontend
cd views
npm install
npm run build
cd ..

# 2. Setup environment
Copy-Item .env.example -Destination .env

# 3. Start Docker
docker-compose up -d --build

# 4. View logs
docker-compose logs -f
```

## Managing Containers

```powershell
# Start containers
.\docker-manage.ps1 start

# Stop containers
.\docker-manage.ps1 stop

# Restart containers
.\docker-manage.ps1 restart

# View logs
.\docker-manage.ps1 logs

# Check status
.\docker-manage.ps1 status

# Clean everything (⚠️ deletes data!)
.\docker-manage.ps1 clean
```

## Common Docker Commands

```powershell
# View running containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f caddy

# Restart specific service
docker-compose restart backend
docker-compose restart caddy

# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec caddy sh

# View container resource usage
docker stats
```

## Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API | http://localhost/api |
| Health Check | http://localhost/health |
| Uploads | http://localhost/uploads/ |

## File Structure

```
BestTravel/
├── 🐳 Docker Files
│   ├── core/Dockerfile          # Backend image
│   ├── core/.dockerignore       # Backend ignore
│   ├── views/.dockerignore      # Frontend ignore
│   ├── docker-compose.yml       # Services orchestration
│   └── Caddyfile               # Reverse proxy config
│
├── 🔧 Environment
│   ├── .env                     # Your config (not in git)
│   └── .env.example            # Example config
│
├── 📂 Data (Auto-created)
│   ├── data/                    # SQLite database
│   └── uploads/                 # Uploaded images
│
├── 🛠️ Scripts
│   ├── docker-test.ps1         # Automated setup & test
│   ├── docker-manage.ps1       # Quick management
│   └── DOCKER_GUIDE.md         # Full documentation
│
└── 📖 Development
    ├── core/dev.ps1            # Local backend dev
    ├── dev-fullstack.ps1       # Local full-stack dev
    └── DEV_GUIDE.md            # Development guide
```

## Development Workflow

### Local Development (Hot-reload)
```powershell
# Backend with CompileDaemon
cd core
.\dev.ps1

# Frontend with Vite (new terminal)
cd views
npm run dev
```
**Use this for**: Daily coding, testing features

### Docker Testing (Production-like)
```powershell
.\docker-test.ps1
```
**Use this for**: Testing deployment, production simulation

## Troubleshooting

### Port 80 Already in Use
```powershell
# Check what's using port 80
netstat -ano | findstr :80

# Stop IIS (if running)
iisreset /stop

# Or change port in docker-compose.yml
# Change "80:80" to "8080:80"
```

### Docker Not Running
```powershell
# Start Docker Desktop manually
# Then verify:
docker ps
```

### Frontend Not Loading
```powershell
# Rebuild frontend
cd views
npm run build
cd ..

# Restart Caddy
docker-compose restart caddy
```

### Database Issues
```powershell
# Stop containers
docker-compose down

# Remove database locks
Remove-Item data/*.db-shm -Force
Remove-Item data/*.db-wal -Force

# Restart
docker-compose up -d
```

### View Container Logs
```powershell
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50
```

## Production Deployment (VPS)

### 1. Setup VPS
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```

### 2. Upload Project
```bash
git clone <your-repo>
cd BestTravel
```

### 3. Configure
```bash
# Edit .env
nano .env
# Set DOMAIN=yourdomain.com
# Set JWT_SECRET=random-secret
```

### 4. Deploy
```bash
cd views && npm install && npm run build && cd ..
docker-compose up -d --build
docker-compose logs -f
```

### 5. Setup DNS
Point your domain to VPS IP:
```
Type: A
Name: @
Value: YOUR_VPS_IP
```

Caddy will automatically get HTTPS certificate!

## Security Checklist

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Use real domain in production
- [ ] Regular database backups
- [ ] Monitor logs
- [ ] Update Docker images regularly
- [ ] Firewall: Only allow ports 22, 80, 443

## Useful Links

- **Docker Compose**: https://docs.docker.com/compose/
- **Caddy**: https://caddyserver.com/docs/
- **Full Guide**: See `DOCKER_GUIDE.md`

---

**Quick Start**: `.\docker-test.ps1` 🚀
