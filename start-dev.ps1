Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting Hybrid Music Player (Windows)" -ForegroundColor Cyan
Write-Host "========================================="
Write-Host ""

# Check backend dependencies
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host ""
}

# Check frontend dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start backend in a new window
Write-Host "Starting backend server in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Wait a bit for backend to initialize
Start-Sleep -Seconds 3

# Start frontend in current window
Write-Host "Starting frontend dev server..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3001"
Write-Host ""
Write-Host "Press Ctrl+C to stop the frontend server." -ForegroundColor Gray

npm run dev
