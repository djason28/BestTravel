# BestTravel – Travel Package Management System

Full-stack monorepo for travel package booking and management, built with **Go (Gin + GORM)** backend and **React + TypeScript + Vite** frontend.

## Features

- **Public Site**: Browse packages, filter/sort, view details, submit inquiries, contact form
- **Admin Panel**: JWT-secured CRUD for packages, inquiry management, dashboard stats, image uploads
- **Backend**: RESTful API with MySQL/SQLite support, rate limiting, request timeouts, security headers
- **Frontend**: Responsive SPA with Tailwind CSS, admin & public routes, protected pages
- **DevOps**: Docker Compose ready, Caddy for HTTPS/reverse proxy, CI/CD via GitHub Actions

## Project Structure

```
BestTravel/
├── .env                  # Root environment config (dev/local; ignored by git)
├── .env.example          # Template for environment variables
├── SECURITY.md           # Security & secrets checklist
├── docker-compose.yml    # Compose: backend + Caddy
├── Caddyfile             # Caddy config (HTTPS + reverse proxy)
├── deploy.sh             # Production deploy script (builds FE, runs compose)
├── core/                 # Go backend (Gin + GORM)
│   ├── cmd/server/       # Main entry point
│   ├── internal/         # Controllers, models, middleware, utils
│   ├── Dockerfile        # Backend container
│   └── go.mod/go.sum
├── views/                # React frontend (Vite + TypeScript)
│   ├── src/              # Components, pages, services, types
│   ├── package.json
│   └── vite.config.ts
└── docs/                 # Documentation (deploy, docker, dev guides)
```

## Prerequisites

### Local Development (Manual Run — Recommended for Testing)
- **Go** 1.22+ (backend)
- **Node.js** 18+ (frontend)
- **MySQL** (Laragon or standalone) OR SQLite (default for quick start)
- **CompileDaemon** (optional, for live Go reload): `go install github.com/githubnemo/CompileDaemon@latest`

### Docker Testing (Optional)
- **Docker Desktop** (Windows) or Docker Engine + Compose plugin

## Quick Start (Local Dev – Manual)

This is the fastest way to develop with live reload on both backend and frontend.

### 1. Clone & Setup Environment

```powershell
# Clone repository
git clone https://github.com/djason28/BestTravel.git
cd BestTravel

# Copy and edit environment file
copy .env.example .env
# Edit .env:
# - Set DB_DRIVER=mysql (for Laragon) or sqlite (for quick start)
# - If MySQL: set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - Set JWT_SECRET to something strong
# - Set CORS_ORIGINS=http://localhost:5173
# - Set VITE_API_URL=http://localhost:8080/api
```

### 2. Run Backend (Port 8080)

**Option A: With CompileDaemon (live reload)**

```powershell
cd core
CompileDaemon --build="go build -o ..\bin\server.exe .\cmd\server" --command="..\bin\server.exe" --pattern="\.go$" --exclude-dir=bin,vendor --color=true
```

**Option B: Standard go run**

```powershell
cd core
go run ./cmd/server
```

Backend will start on `http://localhost:8080`. Check health: `http://localhost:8080/health`

### 3. Run Frontend (Port 5173)

```powershell
# In a new terminal
cd views
npm install       # First time only
npm run dev       # Starts Vite dev server
```

Frontend will start on `http://localhost:5173`. Open in browser.

### 4. Login to Admin

- Navigate to `http://localhost:5173/admin/login`
- Default admin (from `.env`):
  - Email: `admin@example.com`
  - Password: `admin123`
- **Change these in production!**

---

## Docker Testing (Local)

Use this to test the full containerized stack (backend + Caddy) locally. Frontend is pre-built into `views/dist`.

### 1. Build Frontend Assets

```powershell
# Build production frontend (into views/dist)
cd views
npm ci
npm run build
cd ..
```

### 2. Start Docker Compose

```powershell
# From repository root
docker compose up -d --build
```

Services:
- **Backend**: Exposed internally on port 8080
- **Caddy**: Port 80 (HTTP) and 443 (HTTPS if domain configured)
  - Serves frontend from `views/dist`
  - Proxies `/api` to backend

### 3. Access the App

- **Without domain** (localhost): `http://localhost`
- **With domain** (set in `.env` as `DOMAIN=yourlocal.test`): Configure hosts file or DNS, then access `http://yourlocal.test`

### 4. Stop Docker

```powershell
docker compose down
```

---

## Recommended Workflow

### For Active Development (Local Testing)
✅ **Manual run with CompileDaemon + npm run dev**

**Why?**
- **Instant feedback**: Backend auto-reloads on `.go` changes; frontend HMR (Hot Module Replacement)
- **Fast iteration**: No container rebuild needed
- **Easier debugging**: Direct logs in terminal, breakpoints work natively

**When to use Docker:**
- Testing production build behavior
- Validating Caddy config or HTTPS setup
- Simulating deployment environment
- CI/CD dry runs

### For Production Deploy
✅ **Docker Compose** (see `docs/DEPLOY_ROCKY.md`)

---

## Environment Variables Reference

Key variables in `.env` (see `.env.example` for full list):

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment mode | `development` \| `production` |
| `PORT` | Backend port | `8080` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret | Strong random string (32+ chars) |
| `DB_DRIVER` | Database type | `mysql` \| `sqlite` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | (leave blank for Laragon default) |
| `DB_NAME` | Database name | `besttravel` |
| `VITE_API_URL` | Frontend API base | `http://localhost:8080/api` |

---

## Database Setup

### MySQL (Laragon or Standalone)

1. Ensure MySQL is running
2. Create database:
   ```sql
   CREATE DATABASE besttravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Set `.env`: `DB_DRIVER=mysql`, `DB_HOST=127.0.0.1`, `DB_NAME=besttravel`, etc.
4. Backend will auto-migrate tables on startup

### SQLite (Quick Start)

1. Set `.env`: `DB_DRIVER=sqlite`, `DB_PATH=./data/app.db`
2. Backend will create `data/app.db` automatically

---

## Scripts & Commands

### Backend (from `core/`)
```powershell
go run ./cmd/server              # Run backend
go build -o server.exe ./cmd/server  # Build binary
go test ./...                    # Run tests (if present)
```

### Frontend (from `views/`)
```powershell
npm install      # Install dependencies
npm run dev      # Dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run lint     # ESLint
npm run typecheck # TypeScript check
```

### Docker (from root)
```powershell
docker compose up -d --build     # Start all services
docker compose logs -f           # Follow logs
docker compose ps                # Service status
docker compose down              # Stop & remove containers
```

---

## Documentation

- **[SECURITY.md](SECURITY.md)** – Secrets management & deployment checklist
- **[docs/DEV_GUIDE.md](docs/DEV_GUIDE.md)** – Detailed development workflow
- **[docs/DEPLOY_ROCKY.md](docs/DEPLOY_ROCKY.md)** – Production deploy on Rocky Linux
- **[docs/DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md)** – Docker usage & troubleshooting
- **[docs/CI_CD_GITHUB_ACTIONS.md](docs/CI_CD_GITHUB_ACTIONS.md)** – GitHub Actions setup
- **[views/API_DOCUMENTATION.md](views/API_DOCUMENTATION.md)** – API endpoints reference
- **[core/README.md](core/README.md)** – Backend-specific setup
- **[views/README.md](views/README.md)** – Frontend-specific setup

---

## Troubleshooting

### Backend won't start
- Check `.env` is present in root (not `core/.env`)
- Verify MySQL is running if `DB_DRIVER=mysql`
- Check port 8080 isn't already in use
- Run `go mod tidy` if dependency errors

### Frontend 404 or CORS errors
- Ensure `VITE_API_URL=http://localhost:8080/api` in `.env`
- Backend must be running on port 8080
- Check backend logs for CORS errors; verify `CORS_ORIGINS` includes `http://localhost:5173`

### Docker: "address already in use"
- Stop local backend/frontend if running manually
- Check what's using port 80/443: `netstat -ano | findstr :80`

### Database connection failed
- MySQL: verify credentials, ensure DB exists, check if service is running
- SQLite: ensure `./data/` folder is writable

---

## Production Deployment

See **[docs/DEPLOY_ROCKY.md](docs/DEPLOY_ROCKY.md)** for full production deploy guide (Rocky Linux + Docker + Caddy HTTPS).

Quick summary:
1. Clone repo on server
2. Set production `.env` (strong secrets, real domain, MySQL)
3. Build frontend: `docker run --rm -v "$(pwd)/views":/app -w /app node:20-alpine sh -c "npm ci && npm run build"`
4. Start stack: `docker compose up -d --build`
5. Caddy auto-provisions HTTPS certs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is private. Contact the repository owner for licensing information.

---

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review `SECURITY.md` for security-related queries

---

**Happy coding! 🚀**
