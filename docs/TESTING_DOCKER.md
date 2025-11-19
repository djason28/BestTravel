# 🐳 TESTING DOCKER - Step by Step

## Prerequisites yang Perlu Diinstall Dulu

### 1. Install Docker Desktop (Windows)

**Download & Install:**
1. Download Docker Desktop dari: https://www.docker.com/products/docker-desktop
2. Pilih "Docker Desktop for Windows"
3. Jalankan installer
4. Restart komputer setelah install selesai
5. Buka Docker Desktop (akan muncul icon whale di system tray)
6. Tunggu sampai Docker Desktop running (icon whale tidak bergerak)

**Verify Installation:**
```powershell
# Cek versi Docker
docker --version

# Cek Docker Compose
docker-compose --version

# Cek Docker running
docker ps
```

Jika semua command berhasil, Docker sudah siap!

## Testing Docker - 3 Cara

### Cara 1: Automated Script (PALING MUDAH) ✅

```powershell
# Jalankan script automated
.\docker-test.ps1
```

Script ini akan otomatis:
- ✅ Cek Docker installation
- ✅ Build frontend (npm install & build)
- ✅ Setup .env file
- ✅ Create folders (data, uploads)
- ✅ Build & start Docker containers
- ✅ Show logs

**Jika berhasil**, Anda akan melihat:
```
SUCCESS! BestTravel is now running!

Access your application:
  Frontend: http://localhost
  API:      http://localhost/api
  Health:   http://localhost/health
```

Buka browser: **http://localhost**

### Cara 2: Manual Step-by-Step

```powershell
# Step 1: Build frontend
cd views
npm install
npm run build
cd ..

# Step 2: Copy .env file
Copy-Item .env.example -Destination .env

# Step 3: Create folders
New-Item -ItemType Directory -Path data -Force
New-Item -ItemType Directory -Path uploads -Force

# Step 4: Start Docker
docker-compose up -d --build

# Step 5: View logs
docker-compose logs -f
```

### Cara 3: Using Management Script

```powershell
# Build frontend dulu
cd views; npm run build; cd ..

# Start containers
.\docker-manage.ps1 start

# View logs
.\docker-manage.ps1 logs

# Check status
.\docker-manage.ps1 status
```

## Verifikasi - Tes Setiap Endpoint

### 1. Health Check
```powershell
# Test backend health
curl http://localhost/health
```
Expected: Status 200 OK

### 2. Frontend
Buka browser: **http://localhost**
- Home page harus load
- Lihat package list
- Click detail package
- Navigation menu working

### 3. API Endpoints
```powershell
# Get all packages
curl http://localhost/api/packages

# Get package by ID
curl http://localhost/api/packages/1

# Health endpoint
curl http://localhost/health
```

### 4. Static Files (Uploads)
Uploads di-serve tanpa directory listing (keamanan). Akses file langsung via URL lengkap, contoh:

```
http://localhost/uploads/packages/nama-file.jpg
```
Jika Anda tidak tahu path filenya, lihat URL gambar dari UI admin setelah upload.

### 5. Admin Login
1. Buka: http://localhost/admin/login
2. Login dengan credentials default
3. Akses admin dashboard

## Troubleshooting Common Issues

### Issue 1: Port 80 Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```powershell
# Cari program yang pakai port 80
netstat -ano | findstr :80

# Stop IIS jika running
net stop was /y

# Atau edit docker-compose.yml, ubah port:
# ports:
#   - "8080:80"  # Gunakan port 8080 sebagai gantinya
```

Akses via: http://localhost:8080

### Issue 2: Docker Not Running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
1. Buka Docker Desktop
2. Tunggu sampai fully started (icon whale stabil)
3. Coba lagi: `docker ps`

### Issue 3: Frontend Not Loading (404)

**Error:**
Browser menampilkan 404 atau blank page

**Solution:**
```powershell
# Rebuild frontend
cd views
npm run build
cd ..

# Restart Caddy
docker-compose restart caddy

# Check logs
docker-compose logs caddy
```

### Issue 4: API Not Responding (502 Bad Gateway)

**Error:**
API calls return 502 error

**Solution:**
```powershell
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check backend health
curl http://localhost:8080/health  # Direct backend port
```

### Issue 5: Database Locked

**Error:**
```
database is locked
```

**Solution:**
```powershell
# Stop containers
docker-compose down

# Remove lock files
Remove-Item data/*.db-shm -Force -ErrorAction SilentlyContinue
Remove-Item data/*.db-wal -Force -ErrorAction SilentlyContinue

# Start again
docker-compose up -d
```

### Issue 6: Permission Denied (di Linux/VPS)

**Error:**
```
Permission denied
```

**Solution:**
```bash
# Fix ownership
sudo chown -R $USER:$USER ./data ./uploads

# Fix permissions
chmod -R 755 ./data ./uploads
```

## Melihat Logs untuk Debug

```powershell
# All services logs (follow/real-time)
docker-compose logs -f

# Only backend logs
docker-compose logs -f backend

# Only Caddy logs
docker-compose logs -f caddy

# Last 50 lines
docker-compose logs --tail=50

# Since 30 minutes ago
docker-compose logs --since 30m

# Save logs to file
docker-compose logs > logs.txt
```

## Container Management Commands

```powershell
# View running containers
docker-compose ps

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart specific service
docker-compose restart backend
# Restart specific service
docker-compose restart caddy

# Rebuild and restart
docker-compose up -d --build

# View resource usage
docker stats

# Execute command inside container
docker-compose exec backend sh
docker-compose exec caddy sh

# Remove everything including volumes (⚠️ DELETES DATABASE!)
docker-compose down -v
```

## Testing Checklist ✅

Setelah `docker-compose up -d --build` berhasil:

- [ ] **Health check**: `curl http://localhost/health` → returns OK
- [ ] **Frontend loads**: http://localhost → shows homepage
- [ ] **Package list**: Homepage shows packages
- [ ] **Package detail**: Click package → detail page loads
- [ ] **API works**: `curl http://localhost/api/packages` → returns JSON
- [ ] **Images load**: Package images display correctly
- [ ] **Admin login**: http://localhost/admin/login → login works
- [ ] **Admin dashboard**: After login → dashboard shows stats
- [ ] **Create package**: Admin can create new package
- [ ] **Upload image**: Image upload works
- [ ] **Contact form**: Submit contact form → inquiry created
- [ ] **No errors in logs**: `docker-compose logs` → no red errors

## Jika Semua Berhasil 🎉

Anda akan melihat:

1. **Container Status:**
   ```
   docker-compose ps
   
   NAME                    STATUS              PORTS
   besttravel-backend      Up 2 minutes        0.0.0.0:8080->8080/tcp
   besttravel-caddy        Up 2 minutes        0.0.0.0:80->80/tcp, 443/tcp
   ```

2. **Logs Bersih:**
   ```
   docker-compose logs
   
   backend  | Server running on http://localhost:8080
   caddy    | Caddy serving on :80
   ```

3. **Website Accessible:**
   - http://localhost → Homepage loads
   - http://localhost/api/packages → Returns JSON
   - http://localhost/health → Returns {"status":"ok"}

## Stop Testing

```powershell
# Stop containers (data tetap ada)
docker-compose down

# Stop dan hapus semua data (⚠️ HATI-HATI!)
docker-compose down -v
Remove-Item -Recurse data, uploads -Force
```

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Logs | `docker-compose logs -f` |
| Status | `docker-compose ps` |
| Restart | `docker-compose restart` |
| Rebuild | `docker-compose up -d --build` |

## Next Steps

Setelah testing local berhasil:
1. ✅ Deploy ke VPS (lihat DOCKER_GUIDE.md)
2. ✅ Setup domain & DNS
3. ✅ Caddy auto-enable HTTPS
4. ✅ Production ready!

---

**Install Docker Desktop dulu, then run: `.\docker-test.ps1`** 🚀
