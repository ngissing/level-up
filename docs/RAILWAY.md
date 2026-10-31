# Hosting on Railway

Railway runs Level Up from your GitHub repo and redeploys every time `main` changes.
The database is a single SQLite file, so it lives on a Railway **volume**. That keeps accounts and progress safe across redeploys.

## First-time setup (about 10 minutes)

1. **New project.** In Railway, choose **New Project → Deploy from GitHub repo**, then pick `ngissing/level-up`.
   - If the repo isn't listed, choose **Configure GitHub App** and give Railway access to it.
   - The first deploy will **fail** with "set the ADMIN_PASSWORD variable". That's expected: the app won't start on the internet with the default `changeme` password.
2. **Add a volume.** Right-click the service (or press ⌘K / Ctrl+K) → **Attach volume**. Set the mount path to `/data`.
   - The app finds the volume by itself through `RAILWAY_VOLUME_MOUNT_PATH`.
3. **Add variables.** Open the service, then **Variables → New Variable**:

   | Variable | Value |
   |---|---|
   | `ADMIN_PASSWORD` | A strong password for the first admin account (username `admin`) |
   | `NODE_ENV` | `production` |

   Saving the variables redeploys the app.
4. **Get a web address.** Go to **Settings → Networking → Generate Domain**. You'll get something like `level-up-production.up.railway.app`.
   - You can add your own domain here later.
5. **Log in** as `admin` with your `ADMIN_PASSWORD`. You'll be asked to choose a new password.
   - You can delete the `ADMIN_PASSWORD` variable afterwards. It's only used on the very first start.
6. In **Admin**, create your teacher and student accounts, classes, programs and reading levels.

## Updating

Merge a pull request into `main`, or push to `main`, and Railway redeploys by itself.

- Expect a few seconds of downtime while the new version starts. Railway briefly stops the app when a volume is attached.
- Voice recordings in `public/audio` deploy with the code. The Google key isn't needed on Railway.

## Good to know

- **Keep it to one replica.** SQLite is one file on one volume, so don't scale the service above 1 instance.
- **Backups.** Turn on volume backups under the volume's **Backups** tab.
- **Codespaces is separate.** Codespaces and Railway each have their own database. Accounts you made in Codespaces don't carry over, so use Codespaces for testing and Railway for real classes.
- **No demo accounts.** Railway doesn't add the demo accounts (`kai`, `teacher`, …), because their passwords are public in the README.
- **Workbook QR codes** point at whatever address the page was opened from. To force one address, set `BASE_URL`, e.g. `https://levelup.example.com`.

## Files involved

- `railway.json`: build with Railpack, start with `npm start`, health check at `/healthz`, restart on crash.
- `src/db.js`: uses the Railway volume when one is attached. `DB_FILE` overrides it.
- `server.js`: the first start on a hosted site requires `ADMIN_PASSWORD`.
