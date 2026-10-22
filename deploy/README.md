# Deploying AI-Tutor

Production (ADR-0010): one Oracle Cloud VM in an India region runs Caddy, the API (with its queue workers), Postgres and Redis from `docker-compose.yml` here. Vercel serves the web app and proxies `/api/*` to the VM. Checked locally on 23 Oct: the stack builds and starts, migrations and the seed run in the API container, HTTPS works through Caddy, the client-IP rules hold (below), and a backup restores.

| File | What it is |
|---|---|
| `docker-compose.yml` | The four services. Only Caddy publishes ports |
| `Caddyfile` | HTTPS for `API_DOMAIN`, and the client-IP rule (ADR-0008) |
| `.env.example` | Every setting; copy to `deploy/.env` on the server |
| `backup.sh` | Nightly encrypted `pg_dump` |
| `../apps/api/Dockerfile` | The API image |
| `../apps/web/vercel.json` | The `/api` proxy to the VM, with the secret header |

## 1. The VM (once)
1. Ubuntu 24.04, ARM (Ampere A1), India region. In the VCN's security list, allow TCP 80 and 443 (and UDP 443 for HTTP/3) from anywhere, and SSH from your IP only.
2. Oracle's Ubuntu images also block ports in iptables. Open them and keep the rule:
   ```bash
   sudo iptables -I INPUT 6 -p tcp -m multiport --dports 80,443 -j ACCEPT
   sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
3. Docker: `curl -fsSL https://get.docker.com | sudo sh`, then `sudo usermod -aG docker $USER` and log in again.
4. DNS: an A record for the API's name (e.g. `api.<domain>`) pointing at the VM's public IP. Caddy gets the certificate on first start, so this must resolve first.

## 2. First start
```bash
git clone <repo> ai-tutor-platform && cd ai-tutor-platform/deploy
cp .env.example .env && nano .env      # fill every value; secrets: openssl rand -hex 32
docker compose up -d --build
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed
docker compose exec api pnpm exercises:verify   # every exercise and placement item, in the real sandbox; reruns pick up any skipped
docker compose exec api pnpm lessons:seed       # after the exercises: lessons are checked against them
docker compose exec api pnpm user:admin <your email>   # after signing up on the site
```
`exercises:verify` and `lessons:seed` run each item in E2B one at a time, so they take a while and use E2B credit. Both are safe to rerun.

## 3. Vercel (web)
1. Import the repository. Root directory: `apps/web`. Framework: Next.js.
2. Environment variables: `API_DOMAIN` (the API's name, without `https://`) and `ORIGIN_SECRET` (the same value as in `deploy/.env`).
3. Deploy. Put the site's address in `WEB_ORIGIN` in `deploy/.env`, then `docker compose up -d` to restart the API with it.

`vercel.json` sends `/api/*` straight to the VM and sets `X-Origin-Secret`; Vercel replaces `X-Forwarded-For` with the visitor's IP. `next.config.mjs`'s rewrite is only for local dev.

## 4. Checks after deploying
- `curl https://<API_DOMAIN>/health` gives `{"status":"ok"}`.
- `https://<web>/api/v1/auth/me` gives the API's `401` JSON, not a Next.js page. Logged in on the site, `https://<web>/api/v1/progress?course=dsa` shows `"course":{"slug":"dsa"}`: the query string got through (without it, the default course comes back).
- `docker compose exec api pnpm sandbox:smoke`: all six verdicts on real E2B.
- `docker compose exec api pnpm demo:walk`: one new learner through the whole loop.
- Client IP (ADR-0008): log in once through the site and once straight to `https://<API_DOMAIN>`, each with a made-up `X-Forwarded-For`. In `refresh_tokens.ip` the site login has your real IP and the direct one the caller's real address, never the made-up one:
  ```bash
  docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select ip, created_at from refresh_tokens order by created_at desc limit 2"
  ```
- Sign up, log in and log out on the site: cookies are set on the web's domain and writes pass the origin check.

## 5. Backups
1. On the staging laptop, make a key once and keep its private half only there (and on paper, offline):
   `gpg --quick-gen-key backups@<domain> default default never`, then `gpg --export --armor backups@<domain> > backup-key.asc`.
2. On the VM: `gpg --import backup-key.asc` and set `BACKUP_GPG_RECIPIENT=backups@<domain>` in `deploy/.env`.
3. Nightly, on the VM (`crontab -e`):
   `15 2 * * * bash /home/ubuntu/ai-tutor-platform/deploy/backup.sh >> /home/ubuntu/backup.log 2>&1`
   Dumps go to `/var/backups/ai-tutor` (make it yours: `sudo install -d -o $USER /var/backups/ai-tutor`) and are kept 14 days.
4. Nightly, on the laptop: `rsync -a ubuntu@<vm>:/var/backups/ai-tutor/ ~/ai-tutor-backups/`.
5. Restore (check one each month, into a scratch database):
   ```bash
   gpg --decrypt ai-tutor-<stamp>.dump.gpg > restore.dump
   docker compose exec -T postgres createdb -U "$POSTGRES_USER" restore_check
   docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d restore_check < restore.dump
   ```
   For a real restore, stop the API, drop and recreate `$POSTGRES_DB`, restore into it, start the API.

## Updating
```bash
git pull && docker compose up -d --build && docker compose exec api pnpm db:migrate
```
Logs: `docker compose logs -f api`. Turning on live AI once billing is active: set `GEMINI_PAID=true` in `deploy/.env`, `docker compose up -d`, then `docker compose exec api pnpm hints:generate`.
