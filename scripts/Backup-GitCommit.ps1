param(
    [Parameter(Mandatory=$true)]
    [string]$CommitId,

    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

# Ensure target directory exists
if (-not (Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
}

# Get changed files (excluding deleted ones)
$files = git diff-tree --no-commit-id --name-only --diff-filter=d -r $CommitId
if ($null -eq $files) {
    Write-Host "No files found for commit: $CommitId" -ForegroundColor Yellow
    exit 0
}

if ($files -is [string]) { $files = @($files) }

# Pre-check: Verify all files exist in current tree
$missingFiles = @()
foreach ($f in $files) {
    if ($f -match '\S') {
        if (-not (Test-Path -Path $f)) {
            $missingFiles += $f
        }
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Error: The following files are missing from the current tree:" -ForegroundColor Red
    foreach ($m in $missingFiles) {
        Write-Host " - $m" -ForegroundColor Red
    }
    Write-Host "Backup aborted. Please check your branch or commit ID." -ForegroundColor Red
    exit 1
}

$archivedCount = 0
foreach ($f in $files) {
    if ($f -match '\S') {
        # Calculate destination path
        $dest = Join-Path -Path $TargetDir -ChildPath $f
        $destDir = Split-Path -Path $dest -Parent
        
        # Ensure destination directory exists
        if (-not (Test-Path -Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        
        # Copy file
        Copy-Item -Path $f -Destination $dest -Force
        Write-Host "Copied: $f"
        $archivedCount++
    }
}

Write-Host "============================"
Write-Host "Total files backed up: $archivedCount" -ForegroundColor Green
Write-Host "Destination: $TargetDir" -ForegroundColor Green
