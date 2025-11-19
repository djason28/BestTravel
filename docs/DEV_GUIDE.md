# 🛠️ Development Scripts

Scripts untuk memudahkan development BestTravel project.

## 📋 Prerequisites

- **Go** 1.21+
- **Node.js** 18+
- **CompileDaemon** (akan auto-install jika belum ada)

## 🚀 Quick Start

### Windows (PowerShell)

#### Backend Only (dengan auto-reload)
```powershell
cd core
.\dev.ps1
```

#### Frontend Only
```powershell
cd views
npm run dev
```

#### Full Stack (Backend + Frontend)
```powershell
.\dev-fullstack.ps1
```

### Linux/Mac (Bash)

#### Backend Only (dengan auto-reload)
```bash
cd core
chmod +x dev.sh
./dev.sh
```

#### Frontend Only
```bash
cd views
npm run dev
```

---

## 🔧 Manual Commands

### Backend Development

#### Tanpa Auto-Reload
```powershell
cd core
go run ./cmd/server
```

#### Dengan CompileDaemon (Auto-Reload)
```powershell
cd core
CompileDaemon `
    --build="go build -o ..\bin\server.exe .\cmd\server" `
    --command="..\bin\server.exe" `
    --pattern="\.go$" `
    --exclude-dir="bin,vendor,uploads" `
    --color=true
```

### Frontend Development
```powershell
cd views
npm run dev
```

---

## 📦 Installing CompileDaemon

Jika belum terinstall, jalankan:

```bash
go install github.com/githubnemo/CompileDaemon@latest
```

Pastikan `$GOPATH/bin` atau `$HOME/go/bin` ada di PATH:

**Windows PowerShell:**
```powershell
$env:PATH += ";$env:USERPROFILE\go\bin"
```

**Linux/Mac:**
```bash
export PATH=$PATH:$HOME/go/bin
```

---

## ⚙️ CompileDaemon Options

| Flag | Description |
|------|-------------|
| `--build` | Build command yang akan dijalankan |
| `--command` | Command untuk menjalankan binary hasil build |
| `--pattern` | Regex pattern untuk file yang di-watch (default: `\.go$`) |
| `--exclude-dir` | Directories yang diabaikan (comma-separated) |
| `--color` | Enable colored output |
| `--log-prefix` | Show/hide log prefix |
| `--graceful-kill` | Gracefully kill running process before rebuild |

---

## 📝 What Each Script Does

### `core/dev.ps1` (Windows)
- ✅ Auto-detects dan install CompileDaemon jika belum ada
- ✅ Watch semua `.go` files
- ✅ Auto-rebuild on save
- ✅ Auto-restart server
- ✅ Exclude `bin/`, `vendor/`, `uploads/` directories
- ✅ Colored output

### `core/dev.sh` (Linux/Mac)
- Same as `dev.ps1` but for Unix-based systems

### `dev-fullstack.ps1`
- 🚀 Start backend + frontend dalam separate terminal windows
- 🔄 Backend dengan auto-reload (CompileDaemon)
- ⚛️ Frontend dengan Vite HMR
- 📊 Shows URLs untuk kedua servers

---

## 🌐 Server URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:8080 | Go + Gin REST API |
| **Frontend** | http://localhost:5173 | React + Vite Dev Server |
| **Health Check** | http://localhost:8080/health | API health endpoint |

---

## 🐛 Troubleshooting

### CompileDaemon not found
```powershell
# Install manually
go install github.com/githubnemo/CompileDaemon@latest

# Add to PATH (Windows)
$env:PATH += ";$env:USERPROFILE\go\bin"

# Add to PATH (Linux/Mac)
export PATH=$PATH:$HOME/go/bin
```

### Port already in use
```powershell
# Find process using port 8080 (Windows)
Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Find process using port 8080 (Linux/Mac)
lsof -ti:8080 | xargs kill -9
```

### Permission denied (Linux/Mac)
```bash
chmod +x core/dev.sh
```

---

## 💡 Tips

1. **Use Full Stack Script** untuk development normal
2. **Backend script** saja jika hanya edit API
3. **Frontend script** saja jika hanya edit UI
4. **CompileDaemon** akan auto-rebuild on save (sangat berguna!)
5. **Vite HMR** akan auto-refresh browser on save

---

## 🎯 Development Workflow

```
1. .\dev-fullstack.ps1           → Start both servers
2. Edit code in VSCode           → Auto-reload/rebuild
3. See changes instantly         → No manual restart!
4. Close terminal windows        → Stop servers
```

Happy coding! 🚀
