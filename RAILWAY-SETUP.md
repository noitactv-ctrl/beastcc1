# TurtleCC Telegram credit bot on Railway

The TurtleCC credit/rewards bot runs inside the production Node process. Railway
keeps that process alive so Telegram polling and the 30-second reward
synchronization continue running.

The Railway service must use the **same PostgreSQL database** and the same
encryption secrets as the website. Do not create a second database for the bot.

## 1. Create the Railway service

1. Open Railway and choose **New Project**.
2. Choose **Deploy from GitHub repo**.
3. Select the repository containing this TurtleCC source.
4. Railway detects `railway.json` and uses the existing `Dockerfile`.
5. Wait for the first build to finish.

The Railway service runs the normal production command. The bot starts when the
server starts; there is no separate bot command to run.

## 2. Add Railway variables

In the Railway service, open **Variables** and add these values:

```text
NODE_ENV=production
DATABASE_URL=<the same production PostgreSQL URL used by the website>
SESSION_SECRET=<the existing production session secret>
SETTINGS_ENCRYPTION_KEY=<the existing production settings encryption key>
ADMIN_EMAILS=<admin email list>
OWNER_EMAILS=<owner email list>
PLISIO_PUBLIC_APP_URL=https://TurtleCC.xyz
```

If the Telegram settings have not already been saved in the database, also add:

```text
TELEGRAM_BOT_TOKEN=<Telegram bot token>
Telegram_group_id=<main Telegram channel or group ID>
```

The application prefers the encrypted Telegram token and channel ID stored in
the database. The environment variables are fallback values.

Keep `SESSION_SECRET` and `SETTINGS_ENCRYPTION_KEY` identical to the values used
by the existing website. If the encryption key changes, Railway cannot decrypt
the stored Telegram bot token or other encrypted settings.

Do not paste any of these values into chat. Enter them only in Railway's
Variables panel.

## 3. Generate a Railway domain

In the Railway service:

1. Open **Settings** or **Networking**.
2. Choose **Generate Domain**.
3. Copy the generated HTTPS domain.

Test it from a browser:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health
```

The response should be:

```json
{"ok":true}
```

The Railway service logs should show the application starting. Once its
database and Telegram settings are valid, the credit bot will start polling
automatically.

## 4. Keep the Vercel website connected to Railway

The browser currently calls relative paths such as `/api/login` and
`/api/user`. If Vercel is serving only the frontend, add an API rewrite so
those requests reach Railway.

1. Copy `vercel.railway.json.example` to `vercel.json`.
2. Replace `YOUR-RAILWAY-DOMAIN.up.railway.app` with the actual Railway domain.
3. Deploy the Vercel project again.

The resulting `vercel.json` should look like this:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-real-railway-domain.up.railway.app/api/:path*"
    }
  ]
}
```

This keeps requests same-origin from the browser, so the existing session
cookie continues to work. Do not point Vercel at a second database.

## 5. Configure the credit bot

After Railway is healthy and the Vercel rewrite is deployed:

1. Sign in to the TurtleCC admin panel through the Vercel domain.
2. Open the credit bot settings.
3. Confirm the bot token, Telegram channel ID, bot name, required name, and
   reward amount.
4. Enable the bot.
5. Send `/start` to the bot and test account linking with a test account.

The bot credits the wallet in PostgreSQL. Test that the balance change appears
on the Vercel website.

## 6. Troubleshooting

View Railway logs first. Common errors:

- `DATABASE_URL must be set` — add the shared production database URL.
- Settings decryption errors — restore the existing
  `SETTINGS_ENCRYPTION_KEY` or `SESSION_SECRET`.
- Bot is configured but no messages arrive — check the Telegram token, confirm
  the bot is not running somewhere else with the same token, and confirm the
  Telegram channel ID.
- Vercel login or balance requests return 404 — add the `/api` rewrite and
  redeploy Vercel.

Do not run two polling copies with the same Telegram bot token. Telegram will
reject one of the polling connections.