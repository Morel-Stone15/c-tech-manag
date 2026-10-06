# ============================================================
#  C-TECH — Démarrage simultané Backend Flask + Frontend Vite
# ============================================================
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        C-TECH — Club Technologique Étudiant 2.0         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  → Lancement du Backend Flask  (port 5000)..." -ForegroundColor Yellow
Write-Host "  → Lancement du Frontend Vite  (port 3000)..." -ForegroundColor Yellow
Write-Host ""

$rootDir = $PSScriptRoot

# Lance le backend Flask dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$rootDir\backend'; Write-Host ' Backend Flask (Python) démarré' -ForegroundColor Green; python app.py"
)

# Pause de 1.5 seconde
Start-Sleep -Seconds 1.5

# Lance le frontend Vite dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$rootDir\frontend'; Write-Host ' Frontend Vite (React) démarré' -ForegroundColor Cyan; npm run dev"
)

Write-Host "  ✔  Les deux serveurs sont opérationnels !" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  →  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend →  http://localhost:3000" -ForegroundColor White
Write-Host ""
