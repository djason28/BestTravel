BestTravel Backend (Gin + GORM)

A secure REST API backend for the BestTravel frontend, built with Gin (Go), GORM (MySQL only), and JWT auth.

## Features

- JWT auth (login, logout, refresh, current user)
- Admin-only protected routes (packages CRUD, inquiries management, dashboard, uploads)
- Packages: list/filter/sort/paginate, get by id/slug, view counter, CRUD
- Inquiries: create public, list admin, update status
- Dashboard stats
- Contact endpoint (stub for email integration)
- Image upload with validation (type/size) and local storage
- Security: CORS, secure headers, per-IP rate limiting, bcrypt password hashing, input validation

## Prerequisites

- Go 1.22+

## Setup (dev)

```powershell
# 1) (Opsional) download dependencies pertama kali
# go mod download

# 2) Pastikan .env di root repo sudah di-set (bukan di core/). Contoh dev ada di /.env.example
#    - DB_DRIVER=mysql (Laragon), DB_NAME=besttravel, JWT_SECRET, CORS_ORIGINS, dll.

# 3) Jalankan server
go run ./cmd/server
# Server: http://localhost:8080
# Uploads statis: http://localhost:8080/uploads

CompileDaemon --build="go build -o ..\bin\server.exe .\cmd\server" --command="..\bin\server.exe" --pattern="\.go$" --exclude-dir=bin,vendor --color=true
```

## Environment Variables (root /.env)

- PORT: default 8080
- APP_ENV: development/production
- CORS_ORIGINS: asal frontend, contoh http://localhost:5173
- JWT_SECRET: kunci rahasia JWT (WAJIB ubah di production)
- JWT_TTL_MINUTES: masa berlaku access token (default 30)
- DB_DRIVER: mysql (hanya mysql sekarang, sqlite dihapus)
- DB_HOST/PORT/USER/PASSWORD/NAME: koneksi MySQL
- DB_PARAMS: parseTime=true&charset=utf8mb4&loc=Local (disarankan)
- (SQLite dihapus, DB_PATH tidak lagi digunakan)
- UPLOAD_DIR: folder upload (default ./uploads)
- MAX_UPLOAD_MB: batas ukuran upload (default 5)
- ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME: user admin seed saat pertama run

## API Base URL

- Semua endpoint berada di prefix `/api`.
- Frontend membaca `VITE_API_URL` dari root `/.env`. Contoh dev: `VITE_API_URL=http://localhost:8080/api`.

## Security Notes

- Gunakan JWT_SECRET yang kuat dan unik di production
- Aktifkan HTTPS di reverse proxy (Nginx/Traefik/Cloud)
- Atur CORS_ORIGINS sesuai domain frontend production
- Batasi ukuran upload dan tipe file (sudah dibatasi jpg/jpeg/png/webp)
- Gunakan rate limiting (sudah ada per-IP), sesuaikan nilai sesuai kebutuhan
- Sanitasi/validasi input di backend dan frontend

## Production Deploy (ringkas)

- Build binary: `go build -o server ./cmd/server`
- Jalankan sebagai service (systemd/pm2/service manager)
- Pasang reverse proxy untuk HTTPS dan static uploads
- Set environment variables (tanpa .env di production jika perlu)

## Matching Frontend

Frontend React/Vite sudah siap untuk:
- Auth: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/refresh
- Packages: GET/POST/PUT/DELETE sesuai dokumentasi
- Inquiries: public create, admin list/update status
- Dashboard: GET /api/dashboard/stats
- Contact: POST /api/contact
- Upload: POST/DELETE /api/upload/image

## Default Admin

- Email: admin@example.com
- Password: admin123
- Ganti nilai ini di .env kemudian hapus user lama secara manual jika sudah terlanjur dibuat.
