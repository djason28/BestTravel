param(
  [string]$File = "db/seeds/seed.sql",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "besttravel"
)

Write-Host "Seeding MySQL database..." -ForegroundColor Cyan

$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  Write-Error "mysql client not found in PATH. If you use Laragon, add its MySQL bin to PATH or provide full path to mysql.exe."
  exit 1
}

$seedPath = Join-Path $PSScriptRoot $File
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

# Pipe the SQL file into mysql (PowerShell doesn't support '<' redirection for external EXEs)
Get-Content -Path $seedPath -Raw | & $mysql.Path @args

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Seed completed successfully." -ForegroundColor Green
} else {
  Write-Host "❌ Seed failed with exit code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}
