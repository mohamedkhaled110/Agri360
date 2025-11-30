# Agri360 - Start Both Servers Script
# This script starts the backend and frontend servers in separate windows

Write-Host "🌿 Agri360 - Starting Backend & Frontend" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Define paths
$BACKEND_PATH = "d:\agri360\Agri360 backend"
$FRONTEND_PATH = "d:\agri360\v0-agre-360-frontend-main\v0-agre-360-frontend-main"

# Check if npm is installed
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error checking npm installation" -ForegroundColor Red
    exit 1
}

Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "📦 Starting Backend (Express.js)..." -ForegroundColor Cyan
Write-Host "   Path: $BACKEND_PATH" -ForegroundColor Gray
Write-Host "   Port: 5000" -ForegroundColor Gray

try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_PATH'; Write-Host '🚀 Backend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Write-Host "✅ Backend window opened" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "❌ Failed to start backend: $_" -ForegroundColor Red
}

Write-Host ""

# Start Frontend
Write-Host "⚛️  Starting Frontend (Next.js)..." -ForegroundColor Cyan
Write-Host "   Path: $FRONTEND_PATH" -ForegroundColor Gray
Write-Host "   Port: 3000" -ForegroundColor Gray

try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_PATH'; Write-Host '🚀 Frontend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Write-Host "✅ Frontend window opened" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start frontend: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access your application:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Give servers 10-15 seconds to fully start..." -ForegroundColor Yellow
Write-Host "💡 Check the console windows for startup messages" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 To stop servers:" -ForegroundColor Yellow
Write-Host "   - Close the console windows, or" -ForegroundColor Gray
Write-Host "   - Press Ctrl+C in each window" -ForegroundColor Gray
Write-Host ""
