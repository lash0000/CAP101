<#
.SYNOPSIS
  Automated Installation Script
.DESCRIPTION
  Installs Chocolatey, CockroachDB (official binary), Node.js, and npm.
  Adds CockroachDB to PATH and initializes an npm project.
  All downloads use curl (alias for Invoke-WebRequest).
#>

# -------------------- Utility Functions --------------------

function Write-Header {
    param([string]$Message)
    Write-Host "`n=====================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
}
function Write-Success { param($Message) ; Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-ErrorMessage { param($Message) ; Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Info { param($Message) ; Write-Host "[INFO] $Message" -ForegroundColor Magenta }

# -------------------- Step 1: Chocolatey --------------------

Write-Header "Checking Chocolatey"
$chocoPath = Get-Command choco -ErrorAction SilentlyContinue
if ($chocoPath) {
    Write-Success "Chocolatey already installed at $($chocoPath.Source)"
} else {
    Write-Info "Chocolatey not found. Installing via MSI..."

    $Downloads = Join-Path $HOME "Downloads"
    if (-not (Test-Path $Downloads)) { New-Item -ItemType Directory -Path $Downloads | Out-Null }

    $MsiUrl  = "https://github.com/chocolatey/choco/releases/download/2.5.1/chocolatey-2.5.1.0.msi"
    $MsiFile = Join-Path $Downloads "chocolatey-2.5.1.0.msi"
    $LogFile = Join-Path $Downloads "choco-install.log"

    try {
        Write-Info "Downloading Chocolatey MSI with curl..."
        curl $MsiUrl -OutFile $MsiFile
        Write-Success "Chocolatey MSI downloaded"
    } catch {
        Write-ErrorMessage "Failed to download MSI: $_"
        exit 1
    }

    try {
        $args = "/i `"$MsiFile`" /quiet /norestart /log `"$LogFile`""
        $process = Start-Process msiexec.exe -ArgumentList $args -Wait -PassThru

        if ($process.ExitCode -eq 0) {
            Write-Success "Chocolatey installed successfully"
        } else {
            Write-ErrorMessage "Chocolatey failed with exit code $($process.ExitCode). See $LogFile"
            exit 1
        }
    } catch {
        Write-ErrorMessage "Chocolatey installation error: $_"
        exit 1
    }

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")

    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoPath) {
        Write-ErrorMessage "Chocolatey verification failed. Check $LogFile"
        exit 1
    }
    Write-Success "Chocolatey verified at $($chocoPath.Source)"
}

# -------------------- Step 2: CockroachDB --------------------

Write-Header "Installing CockroachDB"
$cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue
if ($cockroachPath) {
    Write-Success "CockroachDB already installed at $($cockroachPath.Source)"
} else {
    $Downloads = Join-Path $HOME "Downloads"
    if (-not (Test-Path $Downloads)) { New-Item -ItemType Directory -Path $Downloads | Out-Null }

    $Url = "https://binaries.cockroachdb.com/cockroach-v24.2.1.windows-6.2-amd64.zip" # change version if needed
    $ZipFile = Join-Path $Downloads "cockroach.zip"
    $InstallDir = "C:\cockroach"

    try {
        Write-Info "Downloading CockroachDB with curl..."
        curl $Url -OutFile $ZipFile
        Write-Success "CockroachDB downloaded"
    } catch {
        Write-ErrorMessage "Failed to download CockroachDB: $_"
        exit 1
    }

    try {
        if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
        Expand-Archive -Path $ZipFile -DestinationPath "C:\" -Force
        Rename-Item -Path "C:\cockroach-v*" -NewName "cockroach"
        Write-Success "CockroachDB extracted to $InstallDir"
    } catch {
        Write-ErrorMessage "Failed to extract CockroachDB: $_"
        exit 1
    }

    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
    if ($currentPath -notlike "*$InstallDir*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "Machine")
        Write-Success "CockroachDB added to PATH ($InstallDir)"
    }

    # Verify
    $cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue
    if ($cockroachPath) {
        $version = & cockroach version
        Write-Success "CockroachDB installed successfully ($version)"
    } else {
        Write-ErrorMessage "CockroachDB not found after extraction"
        exit 1
    }
}

# -------------------- Step 3: Node.js & npm --------------------

Write-Header "Checking Node.js and npm"
$nodePath = Get-Command node -ErrorAction SilentlyContinue
$npmPath  = Get-Command npm -ErrorAction SilentlyContinue

if ($nodePath -and $npmPath) {
    Write-Success "Node.js ($(& node -v)) and npm ($(& npm -v)) already installed"
} else {
    Write-Info "Installing Node.js and npm..."
    try {
        choco install nodejs -y --no-progress | Out-Host
        $nodePath = Get-Command node -ErrorAction SilentlyContinue
        $npmPath  = Get-Command npm -ErrorAction SilentlyContinue
        if ($nodePath -and $npmPath) {
            Write-Success "Node.js ($(& node -v)) and npm ($(& npm -v)) installed"
        } else {
            Write-ErrorMessage "Node.js/npm not found after install"
            exit 1
        }
    } catch {
        Write-ErrorMessage "Node.js/npm installation failed: $_"
        exit 1
    }
}


# -------------------- Final Message --------------------

Write-Header "Installation Complete"
Write-Success "Chocolatey, CockroachDB, Node.js, and npm installed and verified"
Write-Host "CockroachDB installed at C:\cockroach and added to PATH." -ForegroundColor Cyan
Write-Host "All important libraries are now installed. Run the npm install --force command to our CAP101 project." -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
