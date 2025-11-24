param(
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "besttravel"
)

Write-Host "Bulk seeding: 100 base + 4 duplicate batches (total 500)" -ForegroundColor Cyan

$scriptRoot = $PSScriptRoot
$seedScript = Join-Path $scriptRoot 'seed.ps1'
if (-not (Test-Path $seedScript)) { Write-Error "seed.ps1 not found at $seedScript"; exit 1 }

function Run-SeedFile {
  param([string]$File)
  Write-Host "-> Seeding file: $File" -ForegroundColor Green
  & $seedScript -File $File -DbHost $DbHost -Port $Port -User $User -Password $Password -Database $Database
  if ($LASTEXITCODE -ne 0) { Write-Error "Seeding failed for $File (exit $LASTEXITCODE)"; exit $LASTEXITCODE }
}

# 1. Base 100 packages
Run-SeedFile 'db/seeds/seed.sql'

# 2. Append 4x batches to reach 500
Run-SeedFile 'db/seeds/seed_append_4x.sql'

Write-Host "Bulk seed completed. Verify with: SELECT COUNT(*) FROM packages;" -ForegroundColor Cyan
Write-Host "Expect packages=500, images=1500 (3 each)." -ForegroundColor DarkGray