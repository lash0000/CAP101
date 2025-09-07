<#
.SYNOPSIS
  Automated Installation Script
.DESCRIPTION
  Installs Chocolatey, CockroachDB (official binary), Node.js, and npm.
  Adds CockroachDB and Chocolatey to PATH system environment.
#>

# -------------------- Script Check --------------------
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
            ).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $IsAdmin) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host "[ERROR] This script requires PowerShell (Administrator)." -ForegroundColor Yellow
    Write-Host "Aborting..." -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    exit 1
}

# -------------------- Intro --------------------

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "[AUTOMATED INSTALL]" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "This script will install the required tools:" -ForegroundColor White
Write-Host " > Chocolatey" -ForegroundColor White
Write-Host " > CockroachDB" -ForegroundColor White
Write-Host " > Node.js & npm (v22.x enforced)" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Please run this PowerShell script as Administrator." -ForegroundColor Yellow
Write-Host "Otherwise installation of development tools will fail." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "[INFORMATION]" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "If the automated script may not help with what you've encountered problems, you may needed to perform manual installation instead:" -ForegroundColor White
Write-Host " > CockroachDB: https://www.cockroachlabs.com/docs/stable/install-cockroachdb-windows.html" -ForegroundColor Cyan
Write-Host " > Node.js LTS: https://community.chocolatey.org/packages/nodejs-lts" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 2

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

# -------------------- Chocolatey --------------------

Write-Header "Checking Chocolatey"

# Systematically define directories
$UserProfile = [Environment]::GetFolderPath("UserProfile")
$DownloadsPath = Join-Path $UserProfile "Downloads"
$ProgramDataPath = [Environment]::GetFolderPath("CommonApplicationData")
$ChocoInstallPath = Join-Path $ProgramDataPath "chocolatey"
$ChocoBinPath = Join-Path $ChocoInstallPath "bin"
$ChocoExePath = Join-Path $ChocoBinPath "choco.exe"

# Check if Chocolatey is already installed
if (Test-Path $ChocoExePath) {
    Write-Success "Chocolatey already installed at $ChocoInstallPath"
    
    # Check if it's in system PATH
    $systemPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($systemPath -notlike "*$ChocoBinPath*") {
        try {
            [System.Environment]::SetEnvironmentVariable("Path", "$systemPath;$ChocoBinPath", "Machine")
            Write-Success "Added Chocolatey to system PATH"
        } catch {
            Write-Warning "Could not add Chocolatey to system PATH (admin rights needed): $_"
            Write-Host " → Please manually add '$ChocoBinPath' to your system PATH" -ForegroundColor Yellow
        }
    } else {
        Write-Info "Chocolatey already in system PATH environment"
    }
    
} else {
    Write-Info "Chocolatey not found. Installing via MSI..."

    if (-not (Test-Path $DownloadsPath)) {
        New-Item -ItemType Directory -Path $DownloadsPath -Force | Out-Null
        Write-Info "Created Downloads directory: $DownloadsPath"
    }

    $MsiUrl = "https://github.com/chocolatey/choco/releases/download/2.5.1/chocolatey-2.5.1.0.msi"
    $MsiFile = Join-Path $DownloadsPath "chocolatey-2.5.1.0.msi"

    try {
        Write-Info "Downloading Chocolatey installer to $DownloadsPath..."
        curl.exe -L $MsiUrl -o $MsiFile
        if (Test-Path $MsiFile) {
            Write-Success "Chocolatey Installer downloaded to $MsiFile"
        } else {
            throw "Download failed - file not found at $MsiFile"
        }
    } catch {
        Write-ErrorMessage "Failed to download MSI: $_"
        exit 1
    }

    Write-Info "Launching Chocolatey installer in elevated PowerShell..."
    $psi = @{
        FilePath  = "powershell.exe"
        Verb      = "RunAs"
        ArgumentList = @("-NoExit", "-Command", "& { Start-Process msiexec.exe -ArgumentList '/i `"$MsiFile`"' -Wait }")
    }
    try {
        $proc = Start-Process @psi -PassThru
        Write-Host "`n=====================================" -ForegroundColor Yellow
        Write-Host "WAITING FOR CHOCOLATEY INSTALLER..." -ForegroundColor Yellow
        Write-Host "Do not close this window. The installer will run in another Admin PowerShell." -ForegroundColor White
        Write-Host "Once you finish the installation wizard, close the two window (Installer and another Powershell terminal) to continue." -ForegroundColor Cyan
        Write-Host "=====================================" -ForegroundColor Yellow

        while (-not $proc.HasExited) {
            Write-Host "[INFO] Waiting for Chocolatey installation to finish..." -ForegroundColor Magenta
            Start-Sleep -Seconds 5
        }

        Write-Success "Chocolatey installation process finished."
        Write-Info "Proceeding with next installations..."
    } catch {
        Write-ErrorMessage "Failed to start MSI in elevated PowerShell: $_"
        exit 1
    }
}

Write-Info "Continuing with next installations..."

# -------------------- CockroachDB --------------------

Write-Header "Installing CockroachDB"
$InstallDir = "C:\cockroach"
$cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue

if (-not $cockroachPath -and (Test-Path "$InstallDir\cockroach.exe")) {
    $cockroachPath = "$InstallDir\cockroach.exe"
}

if ($cockroachPath) {
    $versionInfo = & "$cockroachPath" version
    Write-Success "CockroachDB already installed with directory: $cockroachPath"
    Write-Host $versionInfo -ForegroundColor Cyan
} else {
    $Downloads = Join-Path $HOME "Downloads"
    if (-not (Test-Path $Downloads)) { New-Item -ItemType Directory -Path $Downloads | Out-Null }

    $Url = "https://binaries.cockroachdb.com/cockroach-v25.3.1.windows-6.2-amd64.zip"
    $ZipFile = Join-Path $Downloads "cockroach.zip"

    try {
        Write-Info "Downloading CockroachDB..."
        curl.exe -L $Url -o $ZipFile
        Write-Success "CockroachDB downloaded"
    } catch {
        Write-ErrorMessage "Failed to download CockroachDB: $_"
        exit 1
    }

    try {
        if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }

        Expand-Archive -Path $ZipFile -DestinationPath "C:\" -Force

        $expandedDir = Get-ChildItem -Path "C:\" -Directory |
            Where-Object { $_.Name -like "cockroach-v*" } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1

        if (-not $expandedDir) {
            throw "Extracted CockroachDB folder not found under C:\ after unzip."
        }

        Move-Item -Force -Path $expandedDir.FullName -Destination $InstallDir
        Write-Success "CockroachDB extracted to $InstallDir"
    } catch {
        Write-ErrorMessage "Failed to extract CockroachDB: $_"
        exit 1
    }

    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$InstallDir*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "Machine")
        Write-Success "CockroachDB added to PATH ($InstallDir)"
    }

    $cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue
    if (-not $cockroachPath -and (Test-Path "$InstallDir\cockroach.exe")) {
        $cockroachPath = "$InstallDir\cockroach.exe"
    }

    if ($cockroachPath) {
        $versionInfo = & "$cockroachPath" version
        Write-Success "CockroachDB installed successfully so directory: $cockroachPath"
        Write-Host $versionInfo -ForegroundColor Cyan
    } else {
        Write-ErrorMessage "CockroachDB not found after extraction"
        exit 1
    }
}

# -------------------- Node.js --------------------

Write-Header "Checking Node.js"
$nodePath = Get-Command node -ErrorAction SilentlyContinue
$npmPath  = Get-Command npm -ErrorAction SilentlyContinue

function Install-Node22 {
    Write-Info "Installing Node.js v22 (LTS)"
    try {
        $ChocoExePath = Join-Path $env:ProgramData "chocolatey\bin\choco.exe"
        if (-not (Test-Path $ChocoExePath)) {
            throw "Chocolatey executable not found at $ChocoExePath"
        }

        & $ChocoExePath install nodejs --version=22.11.0 -y --force --no-progress | Out-Host

        # Refresh PATH in current session after install
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("Path","User")

        Write-Success "Node.js v22 installation completed and PATH refreshed for current session."
    } catch {
        Write-ErrorMessage "Node.js/npm installation failed: $_"
        exit 1
    }
}

if ($nodePath -and $npmPath) {
    $nodeVersion = & node -v
    $npmVersion  = & npm -v
    if ($nodeVersion -notlike "v22*") {
        Write-Warning "Node.js version ($nodeVersion) detected. 
        It seems you are using a different version of Node.js we advise you to upgrade it from Node.js v22 LTS with the following command (From chocolatey):"
        Write-Info "choco install nodejs --version=22.11.0 -y --force --no-progress"
        Write-Info "Or run: & { $(Join-Path $env:ProgramData 'chocolatey\bin\choco.exe') install nodejs --version=22.11.0 -y --force --no-progress }"
    } else {
        Write-Success "Node.js ($nodeVersion) and npm ($npmVersion) already installed"
    }
} else {
    Install-Node22
}

# -------------------- Final Message --------------------

Write-Header "Installation Complete we advise to restart your terminal now."
Write-Success "All development tools such as Chocolatey, CockroachDB & Node.js was installed correctly."
Write-Host "CockroachDB installed at C:\cockroach and added to PATH." -ForegroundColor Cyan
Write-Host "Chocolatey bin directory (C:\ProgramData\chocolatey\bin) added to PATH." -ForegroundColor Cyan
Write-Host "Run 'npm install --force' inside CAP101 project to install dependencies." -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
