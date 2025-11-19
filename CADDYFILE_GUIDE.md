# 📝 CADDYFILE BEST PRACTICES GUIDE

## 🎯 Perbandingan 5 Error yang Diperbaiki

### ❌ Error 1: `admin off` - Tidak Perlu
```caddyfile
# SALAH - admin sudah off by default
{
    admin off
}

# BENAR - hapus atau set ke port jika butuh
{
    # Tidak perlu admin off
    # Atau jika butuh: admin :2019
}
```

### ❌ Error 2: `encode gzip zstd` - zstd Tidak Umum
```caddyfile
# SALAH - zstd belum universal support
encode gzip zstd

# BENAR - gunakan gzip saja (universal)
encode gzip

# ATAU dengan level
encode {
    gzip 6
    minimum_length 256
}
```

### ❌ Error 3: `handle /api/*` - Tanpa Strip Path
```caddyfile
# KURANG BAIK - path /api/* akan diteruskan ke backend
handle /api/* {
    reverse_proxy backend:8080
}
# Request: /api/packages → Backend menerima: /api/packages

# LEBIH BAIK - strip prefix /api
handle_path /api/* {
    reverse_proxy backend:8080
}
# Request: /api/packages → Backend menerima: /packages
```

### ❌ Error 4: Log ke File `/var/log/caddy/` - Tidak Ada di Container
```caddyfile
# SALAH - folder mungkin tidak ada/no permission
log {
    output file /var/log/caddy/access.log
    format json
}

# BENAR - log ke stdout (Docker best practice)
log {
    output stdout
    format console
}

# ATAU create volume dulu
# volumes:
#   - ./logs:/var/log/caddy
```

### ❌ Error 5: Handle Order - Frontend Harus Terakhir
```caddyfile
# SALAH - urutan bisa bikin routing error
handle /api/* { ... }
handle { ... }  # Frontend catch-all
handle /uploads/* { ... }  # Tidak akan tercapai!

# BENAR - specific routes dulu, catch-all terakhir
handle_path /api/* { ... }
handle /health { ... }
handle /uploads/* { ... }
handle { ... }  # Frontend SPA - TERAKHIR
```

---

## 🏆 BEST PRACTICES

### 1. **Struktur Dasar (Development)**
```caddyfile
{$DOMAIN:localhost}

# Specific routes first
handle_path /api/* {
    reverse_proxy backend:8080
}

handle /uploads/* {
    root * /usr/share/caddy
    file_server
}

# Catch-all last
handle {
    root * /usr/share/caddy
    try_files {path} /index.html
    file_server
}
```

### 2. **Production dengan Security**
```caddyfile
{
    email admin@yourdomain.com
}

yourdomain.com {
    encode gzip
    
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        -Server
    }
    
    # Routes...
}
```

### 3. **Reverse Proxy dengan Health Check**
```caddyfile
handle_path /api/* {
    reverse_proxy backend:8080 {
        health_uri /health
        health_interval 10s
        health_timeout 5s
        
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### 4. **Caching Strategy**
```caddyfile
# Immutable assets (with hash in filename)
@static {
    path *.js *.css
}
header @static Cache-Control "public, max-age=31536000, immutable"

# Images
@images {
    path *.png *.jpg *.jpeg *.gif *.svg
}
header @images Cache-Control "public, max-age=2592000"

# HTML - no cache
@html {
    path *.html
}
header @html Cache-Control "no-cache, no-store, must-revalidate"
```

### 5. **SPA (Single Page Application) Routing**
```caddyfile
handle {
    root * /usr/share/caddy
    
    # Try file first, fallback to index.html
    try_files {path} /index.html
    
    file_server
}
```

### 6. **Multiple Backends (Load Balancing)**
```caddyfile
handle_path /api/* {
    reverse_proxy backend1:8080 backend2:8080 {
        lb_policy least_conn
        health_uri /health
        health_interval 10s
    }
}
```

### 7. **HTTPS & WWW Redirect**
```caddyfile
www.yourdomain.com {
    redir https://yourdomain.com{uri} permanent
}

yourdomain.com {
    # Your config
}
```

### 8. **Logging Best Practice**
```caddyfile
# Development
log {
    output stdout
    format console
}

# Production
log {
    output file /var/log/caddy/access.log {
        roll_size 100mb
        roll_keep 5
        roll_keep_for 720h
    }
    format json
}
```

---

## 📂 File Yang Sudah Dibuat

1. **Caddyfile** - Fixed version (default)
2. **Caddyfile.simple** - Minimal, untuk development
3. **Caddyfile.production** - Production ready dengan security
4. **Caddyfile.advanced** - Full features (load balancing, metrics, etc.)

---

## 🔄 Cara Menggunakan

### Development (Default)
```bash
# Gunakan Caddyfile yang sudah diperbaiki
docker-compose up -d
```

### Production
```bash
# Backup current
cp Caddyfile Caddyfile.backup

# Use production version
cp Caddyfile.production Caddyfile

# Edit domain
nano Caddyfile
# Replace: yourdomain.com dengan domain Anda

# Deploy
docker-compose up -d --build
```

### Testing
```bash
# Validate Caddyfile syntax
docker-compose exec caddy caddy validate --config /etc/caddy/Caddyfile

# Reload without downtime
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# View current config
docker-compose exec caddy caddy adapt --config /etc/caddy/Caddyfile
```

---

## 🎨 Rekomendasi untuk BestTravel

**Development:**
- Gunakan **Caddyfile** yang sudah diperbaiki
- Simple, clean, works dengan Docker Compose

**Staging/Testing:**
- Gunakan **Caddyfile.production**
- Add security headers
- Real HTTPS testing

**Production:**
- Gunakan **Caddyfile.production** atau **Caddyfile.advanced**
- Enable all security headers
- Setup proper logging
- Add health checks
- Consider load balancing jika traffic tinggi

---

## ⚙️ Common Patterns

### Pattern 1: API Gateway
```caddyfile
# All API through Caddy
api.yourdomain.com {
    handle /v1/* {
        reverse_proxy backend-v1:8080
    }
    
    handle /v2/* {
        reverse_proxy backend-v2:8080
    }
}
```

### Pattern 2: Microservices
```caddyfile
yourdomain.com {
    handle /api/auth/* {
        reverse_proxy auth-service:8080
    }
    
    handle /api/packages/* {
        reverse_proxy package-service:8080
    }
    
    handle /api/payments/* {
        reverse_proxy payment-service:8080
    }
}
```

### Pattern 3: Static + API
```caddyfile
yourdomain.com {
    # API
    handle_path /api/* {
        reverse_proxy backend:8080
    }
    
    # Static site
    handle {
        root * /var/www/html
        file_server
    }
}
```

---

## 🔍 Debugging Tips

```bash
# View Caddy logs
docker-compose logs -f caddy

# Test specific endpoint
curl -v http://localhost/api/packages

# Check Caddy config
docker-compose exec caddy caddy validate --config /etc/caddy/Caddyfile

# See adapted JSON config
docker-compose exec caddy caddy adapt --config /etc/caddy/Caddyfile --pretty

# Reload config without restart
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 📚 Resources

- **Caddy Docs**: https://caddyserver.com/docs/
- **Caddyfile Tutorial**: https://caddyserver.com/docs/caddyfile/concepts
- **Reverse Proxy**: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- **File Server**: https://caddyserver.com/docs/caddyfile/directives/file_server

---

**Pilih template yang sesuai kebutuhan Anda!** 🚀
