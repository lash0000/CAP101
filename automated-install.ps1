# Automated Installation Script for Chocolatey, CockroachDB, Node.js, and npm
# UI-Rich with Colored Output and Progress Indicators

# Function to display formatted headers
function Write-Header {
    param($Message)
    Write-Host "`n" -NoNewline
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
}

# Function to display success message
function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Function to display error message
function Write-ErrorMessage {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to display info message
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Magenta
}

# Step 1: Check if Chocolatey is installed
Write-Header "Checking for Chocolatey Installation"
$chocoPath = Get-Command choco -ErrorAction SilentlyContinue
if ($chocoPath) {
    Write-Success "Chocolatey is already installed at $($chocoPath.Source)"
} else {
    Write-Info "Chocolatey not found. Installing Chocolatey..."

    # Define variables for Chocolatey installation
    $MsiUrl = "https://github.com/chocolatey/choco/releases/download/2.5.1/chocolatey-2.5.1.0.msi"
    $MsiFile = "$env:TEMP\chocolatey-2.5.1.0.msi"
    $InstallLog = "$env:TEMP\chocolatey-install.log"

    # Download Chocolatey MSI
    Write-Info "Downloading Chocolatey MSI from $MsiUrl..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $MsiUrl -OutFile $MsiFile
        Write-Success "Downloaded Chocolatey MSI"
    } catch {
        Write-ErrorMessage "Failed to download Chocolatey MSI: $_"
        exit 1
    }

    # Install Chocolatey MSI and wait for completion
    Write-Info "Installing Chocolatey..."
    try {
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$MsiFile`" /quiet /norestart /log `"$InstallLog`"" -Wait
        Write-Success "Chocolatey MSI installation initiated"
    } catch {
        Write-ErrorMessage "Failed to install Chocolatey: $_"
        exit 1
    }

    # Refresh environment variables to include Chocolatey
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

    # Verify Chocolatey installation
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoPath) {
        Write-Success "Chocolatey installed successfully at $($chocoPath.Source)"
    } else {
        Write-ErrorMessage "Chocolatey installation failed. Check $InstallLog for details."
        exit 1
    }
}

# Step 2: Install CockroachDB using Chocolatey
Write-Header "Installing CockroachDB"
$cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue
if ($cockroachPath) {
    Write-Success "CockroachDB is already installed at $($cockroachPath.Source)"
} else {
    Write-Info "Installing CockroachDB via Chocolatey..."
    try {
        $output = choco install cockroachdb -y --no-progress | Out-String
        Write-Host $output -ForegroundColor White
        Write-Success "CockroachDB installed successfully"
        
        # Verify CockroachDB installation
        $cockroachPath = Get-Command cockroach -ErrorAction SilentlyContinue
        if ($cockroachPath) {
            $version = cockroach version
            Write-Success "CockroachDB version check: $version"
        } else {
            Write-ErrorMessage "CockroachDB installation failed or not found in PATH."
            exit 1
        }
    } catch {
        Write-ErrorMessage "Failed to install CockroachDB: $_"
        exit 1
    }
}

# Step 3: Check for Node.js and npm, install if missing
Write-Header "Checking for Node.js and npm"
$nodePath = Get-Command node -ErrorAction SilentlyContinue
$npmPath = Get-Command npm -ErrorAction SilentlyContinue

if ($nodePath -and $npmPath) {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Success "Node.js ($nodeVersion) and npm ($npmVersion) are installed"
} else {
    Write-Info "Node.js or npm not found. Installing via Chocolatey..."
    try {
        $output = choco install nodejs -y --no-progress | Out-String
        Write-Host $output -ForegroundColor White
        Write-Success "Node.js and npm installed successfully"
        
        # Verify Node.js and npm installation
        $nodePath = Get-Command node -ErrorAction SilentlyContinue
        $npmPath = Get-Command npm -ErrorAction SilentlyContinue
        if ($nodePath -and $npmPath) {
            $nodeVersion = node -v
            $npmVersion = npm -v
            Write-Success "Node.js ($nodeVersion) and npm ($npmVersion) verified"
        } else {
            Write-ErrorMessage "Node.js or npm installation failed or not found in PATH."
            exit 1
        }
    } catch {
        Write-ErrorMessage "Failed to install Node.js: $_"
        exit 1
    }
}

# Step 4: Initialize npm project if Node.js and npm are installed
Write-Header "Initializing npm Project"
if ($nodePath -and $npmPath) {
    Write-Info "Running npm install --force..."
    try {
        $output = npm install --force | Out-String
        Write-Host $output -ForegroundColor White
        Write-Success "npm install completed successfully"
    } catch {
        Write-ErrorMessage "Failed to run npm install: $_"
        exit 1
    }
} else {
    Write-ErrorMessage "Cannot run npm install because Node.js or npm is not installed."
    exit 1
}

# Final Success Message
Write-Header "Installation Complete"
Write-Success "All components (Chocolatey, CockroachDB, Node.js, npm) installed and verified successfully!"
Write-Host "You can now start using CockroachDB and your npm project." -ForegroundColor Cyan
Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
