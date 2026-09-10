# TurtleCC VPS deployment from Windows PowerShell

This guide assumes:

- VPS address: `103.90.160.177`
- The latest TurtleCC source has been downloaded to the laptop
- The laptop has an SSH key authorized on the VPS
- The new PostgreSQL password has already been rotated

Do not paste private keys or database passwords into chat.

## 1. Download the latest source

Download/export the latest project source from the workspace and extract it somewhere easy, for example:

```text
C:\Users\YOUR_NAME\Downloads\TurtleCC
```

Put `Deploy-TurtleCC.ps1` in that same folder.

## 2. Open PowerShell

Open the Start menu, search for **PowerShell**, and open it.

Go to the source folder:

```powershell
cd "$env:USERPROFILE\Downloads\TurtleCC"
```

Allow the script only for this PowerShell window:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
```

## 3. Test SSH

For the usual Ed25519 key:

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@103.90.160.177 "echo VPS connected"
```

For an RSA key:

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_rsa" root@103.90.160.177 "echo VPS connected"
```

The expected result is:

```text
VPS connected
```

## 4. Run the deployment

With an Ed25519 key:

```powershell
.\Deploy-TurtleCC.ps1 `
  -SourceDir (Get-Location).Path `
  -VpsIp "103.90.160.177" `
  -VpsUser "root" `
  -SshKey "$env:USERPROFILE\.ssh\id_ed25519"
```

With an RSA key:

```powershell
.\Deploy-TurtleCC.ps1 `
  -SourceDir (Get-Location).Path `
  -VpsIp "103.90.160.177" `
  -VpsUser "root" `
  -SshKey "$env:USERPROFILE\.ssh\id_rsa"
```

When prompted for `Rotated DATABASE_URL`, enter the replacement PostgreSQL URL. The prompt hides the value.

The script will:

1. Find the old TurtleCC/BEASTCC application directory.
2. Back up the current VPS database.
3. Download that backup to the laptop.
4. Upload the current source and assets.
5. Restore the backup into the new PostgreSQL database.
6. Update the VPS `.env`.
7. Build and restart the app.
8. Check the local VPS health endpoint.

## 5. Configure DNS

At the domain provider, create:

```text
TurtleCC.xyz       A       103.90.160.177
www.TurtleCC.xyz   A       103.90.160.177
```

Check from PowerShell:

```powershell
Resolve-DnsName TurtleCC.xyz
Resolve-DnsName www.TurtleCC.xyz
```

Both should show `103.90.160.177`.

## 6. Create HTTPS certificates

Run these commands from PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@103.90.160.177 "sudo systemctl stop nginx"
```

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@103.90.160.177 "sudo certbot certonly --standalone -d turtlecc.xyz -d www.turtlecc.xyz -d beastcc.xyz -d www.beastcc.xyz"
```

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@103.90.160.177 "sudo systemctl start nginx"
```

If your key is `id_rsa`, replace `id_ed25519` with `id_rsa`.

## 7. Install the reverse proxy

The script normally uses `/opt/turtlecc`. If it reported another directory, replace `/opt/turtlecc` below.

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@103.90.160.177 "sudo cp /opt/turtlecc/deploy/nginx.conf /etc/nginx/sites-available/turtlecc.conf && sudo ln -sfn /etc/nginx/sites-available/turtlecc.conf /etc/nginx/sites-enabled/turtlecc.conf && sudo nginx -t && sudo systemctl reload nginx"
```

## 8. Verify

```powershell
curl.exe https://turtlecc.xyz/api/health
```

Expected response:

```json
{"ok":true}
```

Check the old-domain redirect:

```powershell
curl.exe -I https://beastcc.xyz
```

It should redirect to `https://turtlecc.xyz`.