$sourceDir = "c:\Users\User\Documents\Flooddashboard-main"
$zipFile = "c:\Users\User\Documents\Flooddashboard-main\flood-dashboard.zip"
$tempDir = "c:\Users\User\Documents\Flooddashboard-main\temp_deploy"

# Clean up previous artifacts
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

# Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

# List of files/folders to include (whitelisting is safer than blacklisting node_modules)
$includes = @(
    "src",
    "public",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "Dockerfile",
    ".dockerignore",
    "tailwind.config.ts",
    "postcss.config.js",
    "components.json"
)

Write-Host "Copying source files..."
foreach ($item in $includes) {
    $path = Join-Path $sourceDir $item
    if (Test-Path $path) {
        Copy-Item $path $tempDir -Recurse
    }
}

Write-Host "Zipping files..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ Created $zipFile"
Write-Host "Ready to upload to Google Cloud Console!"
