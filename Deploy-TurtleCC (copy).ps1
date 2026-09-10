<#
    TurtleCC VPS deployment helper

    Run this script on your Windows laptop.
    It does not contain your SSH key or database password.
#>

[CmdletBinding()]
param(
    [string]$SourceDir = (Get-Location).Path,
    [string]$VpsIp = "103.90.160.177",
    [string]$VpsUser = "root",
    [string]$RemoteDir = "",
    [string]$SshKey = ""
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

function Invoke-Remote([string]$Command) {
    $output = & ssh @script:SshArgs $script:Target $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed with exit code $LASTEXITCODE."
    }
    return ($output -join "`n")
}

Require-Command "ssh"
Require-Command "scp"
Require-Command "tar"

if (-not (Test-Path $SourceDir)) {
    throw "Source directory does not exist: $SourceDir"
}

$SourceDir = (Resolve-Path $SourceDir).Path
$Target = "$VpsUser@$VpsIp"

if ($VpsUser -notmatch "^[A-Za-z0-9._-]+$") {
    throw "Invalid VPS username."
}

if ($RemoteDir -and $RemoteDir -notmatch "^/[A-Za-z0-9._/-]+$") {
    throw "Invalid remote application directory."
}

$SshArgs = @(
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=accept-new"
)

if ($SshKey) {
    if (-not (Test-Path $SshKey)) {
        throw "SSH key does not exist: $SshKey"
    }
    $SshArgs += @("-i", $SshKey)
}

Write-Host "Testing SSH access to $Target ..."
$null = Invoke-Remote "echo connected"

if (-not $RemoteDir) {
    Write-Host "Finding the existing application directory ..."
    $discoverCommand = 'for d in /opt/turtlecc /opt/beastcc /var/www/turtlecc /var/www/beastcc /root/turtlecc /root/beastcc; do if [ -f "$d/docker-compose.yml" ]; then echo "$d"; exit 0; fi; done; exit 1'
    try {
        $RemoteDir = (Invoke-Remote $discoverCommand).Trim()
    } catch {
        throw "Could not find the old application directory. Run again with -RemoteDir /path/to/app."
    }
}

if (-not $RemoteDir) {
    throw "Remote application directory was not found."
}

Write-Host "Using remote application directory: $RemoteDir"

Write-Host ""
Write-Host "Enter the ROTATED PostgreSQL DATABASE_URL."
Write-Host "The value is hidden and is never written into this script."
$dbSecure = Read-Host "Rotated DATABASE_URL" -AsSecureString
$dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)

try {
    $databaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
}

if ($databaseUrl -notmatch "^postgres(ql)?://") {
    throw "The database URL must start with postgres:// or postgresql://."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tempDir = Join-Path $env:TEMP "turtlecc-deploy-$stamp"
$archive = Join-Path $tempDir "turtlecc-source.tar.gz"
$localBackup = Join-Path $tempDir "turtlecc-database-$stamp.dump"
$remoteBackup = "/tmp/turtlecc-source-$stamp.dump"
$remoteArchive = "/tmp/turtlecc-source-$stamp.tar.gz"
$remoteDbFile = "/tmp/turtlecc-db-url-$stamp"

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    Write-Host "Creating a source archive..."

    $tarArgs = @(
        "-czf", $archive,
        "--exclude=.git",
        "--exclude=node_modules",
        "--exclude=dist",
        "--exclude=.cache",
        "--exclude=.local",
        "--exclude=exports",
        "--exclude=*.zip",
        "--exclude=.env",
        "--exclude=.env.*",
        "-C", $SourceDir,
        "."
    )

    & tar @tarArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the source archive."
    }

    Write-Host "Backing up the current VPS database..."

    $backupCommand = 'set -eu; cd "' + $RemoteDir + '"; docker compose exec -T db sh -lc ''pg_dump --format=custom --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"'' > "' + $remoteBackup + '"; chmod 600 "' + $remoteBackup + '"'
    Invoke-Remote $backupCommand | Out-Null

    Write-Host "Downloading the backup to this laptop..."
    & scp @SshArgs "$Target`:$remoteBackup" $localBackup
    if ($LASTEXITCODE -ne 0) {
        throw "Could not download the VPS database backup."
    }

    Write-Host "Uploading the latest TurtleCC source..."
    & scp @SshArgs $archive "$Target`:$remoteArchive"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not upload the source archive."
    }

    Write-Host "Sending the rotated database URL through SSH..."
    $databaseUrl | & ssh @SshArgs $Target "umask 077; cat > '$remoteDbFile'"
    if ($LASTEXITCODE -ne 0) {
        throw "Could not transfer the database URL."
    }

    $deployCommand = @'
set -eu

cd "__REMOTE_DIR__"

if [ -f .env ]; then
  cp -a .env ".env.before-turtlecc-__STAMP__"
fi

tar -xzf "__REMOTE_ARCHIVE__" -C "__REMOTE_DIR__"

if [ -f deploy/nginx.conf ]; then
  sed -i 's/TurtleCC\.xyz/turtlecc.xyz/g' deploy/nginx.conf
fi

export TURTLECC_DB_URL="$(cat "__DB_FILE__")"

python3 - <<'PY'
from pathlib import Path
import os

env_path = Path(".env")
if not env_path.exists():
    raise SystemExit(".env does not exist on the VPS")

updates = {
    "DATABASE_URL": os.environ["TURTLECC_DB_URL"],
    "PLISIO_PUBLIC_APP_URL": "https://TurtleCC.xyz",
}

lines = env_path.read_text().splitlines()
written = set()
output = []

for line in lines:
    if "=" not in line or line.lstrip().startswith("#"):
        output.append(line)
        continue

    key = line.split("=", 1)[0]
    if key in updates:
        output.append(f"{key}={updates[key]}")
        written.add(key)
    else:
        output.append(line)

for key, value in updates.items():
    if key not in written:
        output.append(f"{key}={value}")

env_path.write_text("\n".join(output) + "\n")
PY

chmod 600 .env

echo "Restoring the old marketplace data into the new database..."

docker run --rm \
  --network host \
  -e "TARGET_DATABASE_URL=$TURTLECC_DB_URL" \
  -v "__REMOTE_BACKUP__:/tmp/source.dump:ro" \
  postgres:16-alpine \
  sh -lc 'pg_restore --clean --if-exists --no-owner --no-acl --dbname="$TARGET_DATABASE_URL" /tmp/source.dump'

echo "Applying schema and rebuilding TurtleCC..."

docker compose run --rm migrate
docker compose up -d --build

echo "Checking application health..."
sleep 10
curl -fsS http://127.0.0.1:5000/api/health

rm -f "__DB_FILE__" "__REMOTE_ARCHIVE__"

echo
echo "TurtleCC deployment completed."
echo "The local backup remains available on the laptop."
'@

    $deployCommand = $deployCommand.Replace("__REMOTE_DIR__", $RemoteDir)
    $deployCommand = $deployCommand.Replace("__STAMP__", $stamp)
    $deployCommand = $deployCommand.Replace("__REMOTE_ARCHIVE__", $remoteArchive)
    $deployCommand = $deployCommand.Replace("__DB_FILE__", $remoteDbFile)
    $deployCommand = $deployCommand.Replace("__REMOTE_BACKUP__", $remoteBackup)

    Write-Host "Restoring data and rebuilding the VPS app..."
    Invoke-Remote $deployCommand | Write-Host

    Write-Host ""
    Write-Host "Deployment finished."
    Write-Host "Database backup saved at:"
    Write-Host $localBackup
    Write-Host ""
    Write-Host "Keep that backup until TurtleCC.xyz has been verified."
} finally {
    Remove-Item $archive -Force -ErrorAction SilentlyContinue
}