# GitDrive 1-Line Installer for Windows
# Usage: irm https://raw.githubusercontent.com/theabhishekarmagi/GitDesk/main/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Installing GitDrive for Windows  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$repo = "theabhishekarmagi/GitDesk"
$tempDir = [System.IO.Path]::GetTempPath()
$installerPath = Join-Path $tempDir "GitDrive-Setup.exe"

Write-Host "Finding latest release on GitHub ($repo)..." -ForegroundColor Yellow
$releaseUrl = "https://api.github.com/repos/$repo/releases/latest"

try {
    $release = Invoke-RestMethod -Uri $releaseUrl -Headers @{ "User-Agent" = "GitDrive-Installer" }
    $asset = $release.assets | Where-Object { $_.name -like "*Setup*.exe" } | Select-Object -First 1
    if ($asset) {
        $downloadUrl = $asset.browser_download_url
    } else {
        $downloadUrl = "https://github.com/$repo/releases/latest/download/GitDrive-Setup-1.0.0.exe"
    }
} catch {
    $downloadUrl = "https://github.com/$repo/releases/latest/download/GitDrive-Setup-1.0.0.exe"
}

Write-Host "Downloading GitDrive from $downloadUrl..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

Write-Host "Running installation..." -ForegroundColor Yellow
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait

Write-Host "GitDrive installed successfully!" -ForegroundColor Green
Write-Host "Launching GitDrive..." -ForegroundColor Green

$localAppPath = Join-Path $env:LOCALAPPDATA "Programs\GitDrive\GitDrive.exe"
if (Test-Path $localAppPath) {
    Start-Process -FilePath $localAppPath
}
