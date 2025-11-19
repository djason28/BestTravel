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

# 2) Install dependency
npm install

# 3) Siapkan variabel lingkungan di ROOT repo (BUKAN di views/)
#    - salin /.env.example -> /.env lalu edit nilainya (VITE_API_URL, dsb)

# 4) Jalankan dev server (default: http://localhost:5173)
npm run dev

# 5) Build untuk produksi
npm run build

# 6) Pratinjau hasil build produksi secara lokal
npm run preview
```

Jika kamu menjalankan di WSL, jalankan perintah yang sama di lingkungan WSL.

## Konfigurasi .env (root)

Atur `/.env` di root repo. Variabel penting untuk frontend:

```
VITE_API_URL=http://localhost:8080/api  # atau /api jika reverse-proxy
VITE_SUPABASE_URL=                      # opsional
VITE_SUPABASE_ANON_KEY=                 # opsional
```

Catatan:
- Jika backend berjalan di domain/port terpisah saat development, set `VITE_API_URL` ke URL penuh (misal: `http://localhost:8080/api`).
- Proyek ini tidak mengatur proxy dev Vite. Tanpa backend aktif, request ke `/api` akan gagal (404/CORS).

## Skrip yang Tersedia

```powershell
npm run dev        # Menjalankan dev server Vite
npm run build      # Build produksi ke folder dist
npm run preview    # Menjalankan server untuk pratinjau hasil build
npm run lint       # Menjalankan ESLint
npm run typecheck  # Mengecek tipe TypeScript tanpa menghasilkan file
```

## Info Teknis Singkat

- Tooling: Vite 5, React 18, TypeScript 5, Tailwind CSS 3, ESLint 9
- Kode API: `src/services/api.ts` (membaca `VITE_API_URL`, default `/api`)
- Supabase: `src/services/supabase.ts` (butuh `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` jika dipakai)
- Tidak ada backend di folder `core/` (kosong). Lihat `views/API_DOCUMENTATION.md` untuk spesifikasi endpoint yang diharapkan frontend ini.

## Troubleshooting

- Error Supabase “Missing Supabase environment variables”: isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, atau nonaktifkan pemanggilan Supabase yang tidak dipakai.
- 404/CORS saat memanggil API: pastikan `VITE_API_URL` mengarah ke backend yang berjalan dan CORS mengizinkan asal frontend kamu.
- Port bentrok: Vite biasanya di 5173. Jika bentrok, Vite akan menawarkan port lain di terminal.

## Kustomisasi Penting

- Nomor WhatsApp ada di beberapa komponen publik (lihat catatan di `PROJECT_OVERVIEW.md`).
- Ubah branding/warna di `tailwind.config.js` dan konten di halaman `src/pages/public/*`.

---

Dokumen lebih lengkap: `PROJECT_OVERVIEW.md` dan `API_DOCUMENTATION.md`.
