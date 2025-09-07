# Automated script to install CockroachDB SQL shell, update PATH, and check for Node.js/npm
$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

# Define variables
$CockroachVersion = "v25.3.1"
$DownloadUrl = "https://binaries.cockroachdb.com/cockroach-sql-$CockroachVersion.windows-6.2-amd64.zip"
$InstallDir = "$env:APPDATA\CockroachDB"
$ZipFile = "$env:TEMP\cockroach-sql-$CockroachVersion.zip"
$BinaryPath = "$InstallDir\cockroach-sql.exe"

# Step 1: Download and install CockroachDB SQL shell
Write-Host "Downloading CockroachDB SQL shell ($CockroachVersion)..."
try {
    # Create install directory if it doesn't exist
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

    # Download the zip file
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile

    # Extract the zip file
    Write-Host "Extracting archive..."
    Expand-Archive -Force -Path $ZipFile -DestinationPath $InstallDir

    # Move the executable to the install directory (if not already in the correct location)
    $ExtractedBinary = "$InstallDir\cockroach-sql-$CockroachVersion.windows-6.2-amd64\cockroach-sql.exe"
    if (Test-Path $ExtractedBinary) {
        Move-Item -Force -Path $ExtractedBinary -Destination $BinaryPath
        Remove-Item -Path "$InstallDir\cockroach-sql-$CockroachVersion.windows-6.2-amd64" -Recurse -Force
    }
} catch {
    Write-Host "Error during download or extraction: $_"
    exit 1
}

# Step 2: Update PATH
Write-Host "Updating PATH to include CockroachDB..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
    $env:Path += ";$InstallDir"
    Write-Host "Added $InstallDir to user PATH."
} else {
    Write-Host "CockroachDB directory already in PATH."
}

# Step 3: Verify CockroachDB SQL shell installation
Write-Host "Verifying CockroachDB SQL shell installation..."
try {
    $cockroachVersion = & cockroach-sql version --build-tag
    if ($cockroachVersion -match $CockroachVersion) {
        Write-Host "Success: CockroachDB SQL shell ($cockroachVersion) is installed and accessible."
    } else {
        Write-Host "Warning: CockroachDB SQL shell is installed but version check failed."
    }
} catch {
    Write-Host "Error: CockroachDB SQL shell not found in PATH or failed to execute."
    exit 1
}

# Step 4: Check for Node.js and npm
Write-Host "Checking for Node.js and npm..."
$nodeInstalled = $false
$npmInstalled = $false

try {
    $nodeVersion = & node --version
    if ($nodeVersion) {
        Write-Host "Node.js is installed: $nodeVersion"
        $nodeInstalled = $true
    }
} catch {
    Write-Host "Node.js is not installed."
}

try {
    $npmVersion = & npm --version
    if ($npmVersion) {
        Write-Host "npm is installed: $npmVersion"
        $npmInstalled = $true
    }
} catch {
    Write-Host "npm is not installed."
}

# Step 5: Provide feedback for npm project initialization
if ($nodeInstalled -and $npmInstalled) {
    Write-Host "Success: Both Node.js and npm are installed. You can now initialize a project with 'npm install --force' in your project directory."
} else {
    Write-Host "Cannot proceed with npm project initialization. Please install Node.js and npm."
}

Write-Host "Script completed."
Pause
