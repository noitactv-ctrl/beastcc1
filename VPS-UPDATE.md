# TurtleCC VPS code update

This is a code-only update. It intentionally does not contain:

- The VPS `.env`
- Database dumps
- API keys or passwords
- The existing `attached_assets/` directory

The installer backs up the current database, preserves the current `.env` and
uploaded assets, installs the updated source, rebuilds Docker, and checks
`/api/health`.

## Windows PowerShell

Set the path to your SSH key:

```powershell
$Key = "$env:USERPROFILE\.ssh\id_ed25519"
```

If your key is RSA, use this instead:

```powershell
$Key = "$env:USERPROFILE\.ssh\id_rsa"
```

Upload the archive:

```powershell
scp -i $Key .\turtlecc-vps-update-latest.tar.gz root@103.90.160.177:/tmp/
```

Install it on the VPS. This keeps the existing application directory if it is
one of the standard TurtleCC/BEASTCC locations:

```powershell
ssh -i $Key root@103.90.160.177 "set -e; rm -rf /tmp/turtlecc-update; mkdir -p /tmp/turtlecc-update; tar -xzf /tmp/turtlecc-vps-update-latest.tar.gz -C /tmp/turtlecc-update --strip-components=1; bash /tmp/turtlecc-update/deploy/apply-turtlecc-update.sh"
```

If the old application is in a different directory, pass that directory:

```powershell
ssh -i $Key root@103.90.160.177 "set -e; rm -rf /tmp/turtlecc-update; mkdir -p /tmp/turtlecc-update; tar -xzf /tmp/turtlecc-vps-update-latest.tar.gz -C /tmp/turtlecc-update --strip-components=1; bash /tmp/turtlecc-update/deploy/apply-turtlecc-update.sh /path/to/current/app"
```

The installer prints the database backup location. Keep that backup until the
website has been checked.

## Verification

```powershell
ssh -i $Key root@103.90.160.177 "curl -fsS http://127.0.0.1:5000/api/health"
```

For the public HTTPS site:

```powershell
curl.exe https://TurtleCC.xyz/api/health
```