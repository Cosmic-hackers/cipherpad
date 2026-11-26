################################################################################
#  CipherPad — Neon PostgreSQL Launcher
#  Reads .env file and starts the app with the prod Spring profile
#  Usage: Right-click → Run with PowerShell  (or: powershell -File start-neon.ps1)
################################################################################

$JAVA = "C:\tools\jdk-21.0.5+11\bin\java.exe"
$JAR  = "C:\Users\siddu\Desktop\pad\target\cipherpad-1.0.0.jar"
$ENV_FILE = "C:\Users\siddu\Desktop\pad\.env"

Write-Host ""
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host "   CipherPad  |  Neon PostgreSQL Mode" -ForegroundColor Cyan
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host ""

# --- Read .env file ---
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "  ERROR: .env file not found at $ENV_FILE" -ForegroundColor Red
    Write-Host "  Create it from .env.example and add your Neon credentials." -ForegroundColor Yellow
    Read-Host "  Press Enter to exit"
    exit 1
}

$config = @{}
Get-Content $ENV_FILE | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $idx = $line.IndexOf('=')
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim()
            $config[$key] = $val
        }
    }
}

$profile  = $config["SPRING_PROFILES_ACTIVE"] ?? "prod"
$dbUrl    = $config["DB_URL"]
$dbUser   = $config["DB_USERNAME"]
$dbPass   = $config["DB_PASSWORD"]
$port     = $config["PORT"] ?? "8090"

if (-not $dbUrl -or -not $dbUser -or -not $dbPass) {
    Write-Host "  ERROR: DB_URL, DB_USERNAME or DB_PASSWORD missing in .env" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}

Write-Host "  Profile  : $profile" -ForegroundColor Green
Write-Host "  DB URL   : $dbUrl" -ForegroundColor Green
Write-Host "  DB User  : $dbUser" -ForegroundColor Green
Write-Host "  Port     : $port" -ForegroundColor Green
Write-Host ""
Write-Host "  Open http://localhost:$port in your browser." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

# --- Set environment variables for the Java process ---
$env:SPRING_PROFILES_ACTIVE = $profile
$env:DB_URL                 = $dbUrl
$env:DB_USERNAME            = $dbUser
$env:DB_PASSWORD            = $dbPass
$env:PORT                   = $port

# --- Launch ---
Set-Location "C:\Users\siddu\Desktop\pad"
& $JAVA `
    "-Dspring.profiles.active=$profile" `
    "-Dserver.port=$port" `
    "-Dspring.datasource.url=$dbUrl" `
    "-Dspring.datasource.username=$dbUser" `
    "-Dspring.datasource.password=$dbPass" `
    "-jar" $JAR
