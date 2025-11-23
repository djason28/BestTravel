# Branding Assets

Tempat untuk file logo dan aset brand lain yang bersifat statis.

## Kenapa di `src/assets/branding`?
- Termasuk proses build Vite: otomatis dioptimalkan & bisa di-hash untuk cache busting.
- Mudah diimpor di komponen React dengan tree-shaking.
- Aman (tidak perlu endpoint upload khusus untuk aset yang jarang berubah).

## Kapan pakai folder `uploads/` (backend)?
Gunakan backend `uploads/` jika logo perlu diubah via panel admin secara dinamis tanpa rebuild. Saat ini lebih sederhana simpan di repo.

## Contoh penggunaan
```tsx
import logo from '@/assets/branding/logo.svg';

<img src={logo} alt="BestTravel Logo" className="h-8 w-auto" />
```

## Saran Format Logo
- SVG untuk tampilan tajam di semua resolusi.
- Sediakan variasi horizontal & square jika diperlukan.
- Hindari teks terlalu kecil di SVG.

## Perubahan Logo
Jika mengganti file `logo.svg`, cukup commit dan deploy; versi baru otomatis digunakan.
