# Usage: .\scripts\release.ps1
# Builds the app via EAS, downloads the APK with a versioned name, and creates a GitHub release.

$version = (Get-Content package.json | ConvertFrom-Json).version
$tag = "v$version"
$apkName = "Today_$version.apk"

Write-Host "Releasing $tag..." -ForegroundColor Cyan

# Trigger EAS build
Write-Host "Starting EAS build..." -ForegroundColor Yellow
eas build --platform android --profile preview --non-interactive

if ($LASTEXITCODE -ne 0) { Write-Host "EAS build failed." -ForegroundColor Red; exit 1 }

# Get the latest build URL
$buildJson = eas build:list --platform android --limit 1 --json | ConvertFrom-Json
$apkUrl = $buildJson[0].artifacts.buildUrl

if (-not $apkUrl) { Write-Host "Could not find build URL." -ForegroundColor Red; exit 1 }

Write-Host "Downloading $apkName from $apkUrl..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $apkUrl -OutFile $apkName

$sizeMB = [math]::Round((Get-Item $apkName).Length / 1MB, 1)
Write-Host "Downloaded $apkName ($sizeMB MB)" -ForegroundColor Green

# Create GitHub release with APK attached
Write-Host "Creating GitHub release $tag..." -ForegroundColor Yellow
gh release create $tag $apkName --title "$tag" --generate-notes

if ($LASTEXITCODE -eq 0) {
    Write-Host "Release $tag published." -ForegroundColor Green
    Remove-Item $apkName
} else {
    Write-Host "GitHub release failed. APK saved as $apkName" -ForegroundColor Red
}
