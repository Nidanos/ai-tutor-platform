# ADR-0010: Hosting, LLM provider and how teaching content is made

- **Status:** Accepted. For the pilot, the hosting table is replaced by ADR-0024 (25 Oct: Oracle had no Ampere capacity in Mumbai); the LLM and content decisions stand
- **Date:** 16 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **Constraint:** almost no budget. Learner data should stay in India (DPDP, `DOCS/legal/dpdp-compliance.md`).

## Hosting
| Piece | Where | Why |
|---|---|---|
| API + queue worker + Redis + **PostgreSQL** | **Oracle Cloud Always Free** ARM VM in an **India region**, Docker Compose (same as local) + Caddy for HTTPS | ₹0; enough RAM for all four; data stays in India |
| Web (Next.js) | **Vercel** (free Hobby) during the college phase | Built for Next.js. Hobby is non-commercial: before charging users, move to Cloudflare (free, commercial use allowed) or serve it from the VM |
| Code sandbox | E2B (ADR-0003) | Already decided |
| Staging + backups | Ashwani's old laptop (Ubuntu Server 24.04): staging copy and the **nightly encrypted `pg_dump`** target | Real learner data never lives only at home: home internet, power and theft risk |

**Rejected:** Render (free services sleep after ~15 min; background workers aren't free; no India region). Cloudflare Workers for the backend (Express + BullMQ + Postgres would need a rewrite). The laptop as the primary database (outages, slow queries from the cloud, weak "reasonable security" under DPDP).

**Fallback, in order, if Oracle won't give an instance** (it has refused before for "out of capacity"):
1. Retry with a smaller shape (1–2 ARM cores) and at off-peak hours. Upgrading the account to Pay-As-You-Go often gets capacity; Always Free resources stay free, but a card is on file, so set a budget alert first.
2. **Azure for Students** ($100 credit) VM in Central or South India. It covers the college phase to 10 Nov.
3. A paid 2 vCPU / 4 GB VPS in Mumbai or Bangalore, about ₹1,000–2,000/month, once there are paying users.
4. College demo only: the laptop behind a Cloudflare Tunnel, with test accounts only.

Everything ships as Docker Compose plus a database dump, so moving between these is copy and restore, not a rebuild. The images (Node, Postgres, Redis) and argon2 all run on ARM and x86.

## LLM
- **Provider: Google Gemini, paid tier, called directly**: cheapest good models, one data processor, no training on our data. It sits behind one adapter (`infrastructure/llm`), and model names live in `.env`, so switching model, or to OpenRouter later, is configuration, not code.
- **Generation model: Gemini Flash through the Batch API** (half price; generation runs offline). An exercise that fails sandbox verification twice is retried once with Pro. Budget: about ₹300–400 for a 300-exercise course, paid once. *(Built 19 Oct with normal calls, not Batch: Gemini 3.8 Flash twice, then 3.1 Pro; a separate ₹300/month cap; about ₹1.5 per exercise. ADR-0016.)*
- **Live tutor model: Flash-Lite**, for Socratic hints about the learner's own code and "explain my compile error". About ₹0.03 per hint. *(Built 19 Oct with Gemini 3.5 Flash Lite, about ₹0.08 per hint; ADR-0015.)*
- **Spend caps:** live calls are capped at **20 per learner per day** and **₹500 per month** in total. When a cap is hit, the frozen hint for that level is served instead, so learners are never blocked and the bill can't surprise us. Every call is logged in `llm_calls` with its estimated cost.

## How teaching content is made (extends ADR-0005)
| Layer | What the learner gets | Made |
|---|---|---|
| 1. **Lesson** per skill and language | Plain explanation, **Mermaid diagram**, worked example, further-reading links | LLM once → reviewed → frozen *(built 20 Oct as three levels per skill, ADR-0019; C++ basics and DSA hand-written)* |
| 2. **Practice** | Exercises on rungs 1–5 with 5 frozen hints each | LLM once → verified in the sandbox → frozen (ADR-0005) |
| 3. **Live tutor** | A hint about *their* code, an explanation of their compile error | Live Flash-Lite, filtered so it never shows solution code (FR-M8-04); the frozen hint is the fallback |

- **Visuals are Mermaid diagrams** (settles the open decision): text the LLM writes and the web renders, so they're cheap, the labels are exact, and they're easy to review.
- Grading, mastery and next-step choice never use an LLM (ADR-0005 unchanged).
- Lessons need a small schema addition (a frozen lesson per skill and language), designed when M6 generation is built. *(Built 20 Oct: one per skill, language and level, plus a live note; ADR-0019.)*

## Consequences
- Learner code goes to Gemini only inside live tutor calls, never with a name or email; the Privacy Policy already says so (section 5).
- Vendors to add to the DPDP register: Oracle (hosting), Vercel (web), Google (Gemini).
- New work: production Compose file, Caddy, a nightly backup script, the LLM adapter with spend caps, and lesson generation. Caddy and Vercel must pass on the visitor's IP for the rate limits (ADR-0008, "Client IP behind proxies"). *(Built 23 Oct in `deploy/`: the production Compose file, Caddyfile, `vercel.json`, the API image and `backup.sh`, with a runbook. Checked locally: HTTPS through Caddy, the client-IP rules, and a backup restored. Not yet run on Oracle or Vercel.)*
