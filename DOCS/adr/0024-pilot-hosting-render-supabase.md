# ADR-0024: Pilot hosting: Vercel, Render and Supabase, backed up to a laptop

- **Status:** Accepted (25 Oct 2026; address and backup machine 26 Oct). Replaces ADR-0010's hosting table for the pilot; the rest of ADR-0010 stands
- **Date:** 25 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **Links:** ADR-0008 (client IP), ADR-0010 (hosting), ADR-0018 (data rights), `render.yaml`, `deploy/README.md`

## Context
ADR-0010 put the API, the queue and Postgres on one Oracle Cloud Always Free VM in Mumbai. The tenancy got only 2 Ampere cores and 12 GB, and Mumbai (one availability domain) had no Ampere capacity: 63 automatic attempts over 23–25 Oct, at 2 OCPU / 12 GB and 1 OCPU / 6 GB, plus tries by hand, all "out of host capacity". Azure for Students wasn't available to us. The pilot starts on 8 Nov, so it needs hosting that exists now and costs nothing.

## Decision
| Piece | Where | Free plan |
|---|---|---|
| Web (Next.js) | Vercel, as before | Hobby |
| API and its queue workers (one process) | **Render** web service, **Singapore** (Render's nearest region), built from `apps/api/Dockerfile` by `render.yaml` | Free: 512 MB, 0.1 CPU, 750 hours a month |
| Queue (Redis for BullMQ) | **Render Key Value**, Singapore, private network only, `noeviction` | Free: 25 MB, nothing kept on disk |
| Postgres | **Supabase**, **Mumbai**, through the shared pooler in session mode (Render has no IPv6) | Free: 500 MB |
| Backups | **The home server**, an old laptop running Ubuntu in India: `deploy/backup-laptop.sh` from cron at 23:30 IST and on start-up, `pg_dump` encrypted with AES-256, kept 14 days on its second disk | — |

- **Address:** `tutor.nidanos.com`, a Vercel custom domain (Cloudflare DNS, a DNS-only CNAME to Vercel). `WEB_ORIGIN` is set to it: the email links and the origin check use it.
- **Why the home server holds only backups:** it also runs other products and agents, and was switched off at night to save power (four times in five weeks, about 10 hours each). Down, it stops nothing in the pilot, and the next run catches up.
- **Kept awake:** a free web service sleeps after 15 minutes without requests, and a sleeping one runs no queue work and no hourly erasure. An outside pinger requests `/health` every 10 minutes; one always-on service uses 744 of the 750 free hours.
- **Client IP (ADR-0008):** there is no Caddy. The API keeps Vercel's visitor IP only when the request carries `ORIGIN_SECRET`, which Vercel adds and only Vercel knows (`vercel-visitor.ts`); otherwise Render's own proxy decides. `ORIGIN_SECRET` is required in production.
- **A lost queue:** Key Value keeps nothing on disk, so a restart can lose queued jobs. On start-up the API queues every ungraded submission again; the job id is the submission id, so nothing runs twice.
- **Where data lives:** stored in India (Supabase, Mumbai); processed in Singapore while the API handles a request. The privacy policy (sections 5 and 6), the data download's provider list and the DPDP vendor register say so.

## Consequences
- Every query crosses Singapore ↔ Mumbai (tens of milliseconds each), so a page that makes several queries is a few hundred milliseconds slower than on one machine. To be measured at the first deploy.
- 0.1 CPU makes argon2id slower: a login or sign-up may take about a second.
- Render may restart a free service at any time; in-memory rate-limit counters start again when it does.
- Supabase pauses a free project after a week without database use. During the pilot that can't happen; afterwards it needs a manual restore from the dashboard.
- Supabase's free plan has no backups of its own: the home server's nightly dump is the only copy. A missed night (server off) is caught up when it starts again.
- No shell on a free Render service: migrations, the seed, `exercises:verify` and `lessons:seed` run from the dev laptop against Supabase.
- **Later:** an own VM (Azure for Startups once Nidanos is registered) with `deploy/docker-compose.yml`, unchanged; moving is a dump and restore.
