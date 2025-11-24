param(
  # Path relative to this script for the bilingual seed (advanced)
  [string]$File = "db/seeds/seed.sql",
  # Use simple 20-row seed instead
  [switch]$Simple,
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "besttravel"
)

Write-Host "Seeding MySQL database (bilingual EN/ZH)..." -ForegroundColor Cyan

$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  Write-Error "mysql client not found in PATH. If you use Laragon, add its MySQL bin to PATH or provide full path to mysql.exe."
  exit 1
}

$seedPath = if ($Simple) { Join-Path $PSScriptRoot "db/seeds/seed_simple.sql" } else { Join-Path $PSScriptRoot $File }
if (-not (Test-Path $seedPath)) {
  Write-Error "Seed file not found: $seedPath"
  exit 1
}

# Build args array
$args = @("-h", $DbHost, "-P", $Port, "-u", $User)
if ($Password -ne "") { $args += "-p$Password" }
$args += @($Database, "--default-character-set=utf8mb4")

Write-Host "Using mysql at: $($mysql.Path)" -ForegroundColor DarkGray
Write-Host "Seeding file: $seedPath -> $Database@$($DbHost):$Port" -ForegroundColor Green
if ($Simple) { Write-Host "(Simple 20-row seed mode)" -ForegroundColor Yellow }

# Quick sanity: ensure seed contains _zh columns
$seedContent = Get-Content -Path $seedPath -Raw
if ($seedContent -notmatch "title_zh" -or $seedContent -notmatch "description_zh") {
  Write-Warning "Seed file does not appear to include bilingual columns (title_zh/description_zh)."
}

## --- UTF-8 safe execution (SOURCE) ---
# Gunakan perintah MySQL SOURCE dengan path forward-slash agar tidak memicu escape (\\U).
# Tidak memakai redirect '<' sehingga aman di PowerShell; MySQL membaca file langsung.

$seedPathFS = (Get-Item $seedPath).FullName -replace '\\','/'
$mysqlArgs = @('-h', $DbHost, '-P', $Port, '-u', $User)
if ($Password -ne '') { $mysqlArgs += "-p$Password" }
$mysqlArgs += @($Database, '--default-character-set=utf8mb4', '-e', "SET NAMES utf8mb4; SOURCE $seedPathFS;")

Write-Host "Executing: $($mysql.Path) $($mysqlArgs -join ' ')" -ForegroundColor DarkGray
& $mysql.Path $mysqlArgs
$LASTEXITCODE = $LASTEXITCODE

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Seed completed successfully." -ForegroundColor Green
  Write-Host "   Verify: SELECT id,title_zh FROM packages LIMIT 3;" -ForegroundColor DarkGray
} else {
  Write-Warning "❌ Seed failed (exit code $LASTEXITCODE). Run debug: $($mysql.Path) -h $DbHost -P $Port -u $User $Database --default-character-set=utf8mb4 -e 'SOURCE $seedPathFS;'"
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Seed completed successfully. Verify with: SELECT COUNT(*) FROM packages;" -ForegroundColor Green
  Write-Host "   Sample check: SELECT title, title_zh FROM packages LIMIT 3;" -ForegroundColor DarkGray
} else {
  Write-Host "❌ Seed failed with exit code $LASTEXITCODE" -ForegroundColor Red
  Write-Host "   You can rerun with: powershell -ExecutionPolicy Bypass -File core/seed.ps1 -Password <pwd>" -ForegroundColor DarkGray
  exit $LASTEXITCODE
}
