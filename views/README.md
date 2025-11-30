BestTravel – Frontend (React + Vite)

## Ringkasannya

Ini adalah proyek frontend React + TypeScript dengan Vite dan Tailwind CSS. Untuk menjalankan secara lokal kamu perlu Node.js 18+ (disarankan LTS terbaru), menginstal dependency, menyiapkan file .env di root repo (BUKAN di `views/`), lalu menjalankan dev server.

Backend API ada di folder `core/`. Aplikasi akan memanggil endpoint REST (default base URL: `/api`). URL ini dikonfigurasi lewat `VITE_API_URL` pada file `/.env` di root repo (bukan `views/.env`).

## Prasyarat

- Node.js v18 atau lebih baru (disarankan LTS 20+)
- npm (sudah satu paket dengan Node)

Periksa versi Node di PowerShell:

```powershell
node -v
```

Unduh Node LTS: https://nodejs.org/en

## Langkah Jalankan (Windows PowerShell)

Jalankan semua perintah dari folder `views/` (tempat file `package.json` berada).

```powershell
# 1) Masuk ke folder frontend
cd .\views

# Frontend (Vite + React)

Development setup for the BestTravel frontend.

## Prerequisites
- Node.js 18+
- npm (or pnpm)

## Environment
- The app reads backend API base from the root repo `.env`:
	- `VITE_API_URL=http://localhost:8080/api`

## Run (Dev)
```fish
cd /data/Coding/Travel/BestTravel/views
npm install
npm run dev -- --port 5173 --force
```
Open `http://localhost:5173/` in a fresh browser tab.

If you see a white screen in one browser, try:
- Hard reload (Ctrl+Shift+R)
- Incognito window
- Disable extensions (ad blockers/privacy) that can block local modules
- Ensure dev server port matches the tab

## Build + Preview
```fish
cd /data/Coding/Travel/BestTravel/views
npm run build
npm run preview
# Open http://localhost:4173/
```

## Backend Integration
Ensure backend is running on port 8080 and CORS allows the dev origin.
```fish
cd /data/Coding/Travel/BestTravel/core
go run ./cmd/server
```
Root `.env` minimum:
```
CORS_ORIGINS=http://localhost:5173
VITE_API_URL=http://localhost:8080/api
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=bestuser
DB_PASSWORD=PasswordKuat123!
DB_NAME=besttravel
DB_PARAMS=parseTime=true&charset=utf8mb4&loc=Local
```

## Troubleshooting
- Dev blank screen: restart dev server, use incognito, or different browser.
- Lucide source-map warnings: safe to ignore in dev.
- Port conflicts: stop other dev servers and re-run with `--force`.
- Nomor WhatsApp ada di beberapa komponen publik (lihat catatan di `PROJECT_OVERVIEW.md`).
- Ubah branding/warna di `tailwind.config.js` dan konten di halaman `src/pages/public/*`.

---

Dokumen lebih lengkap: `PROJECT_OVERVIEW.md` dan `API_DOCUMENTATION.md`.
