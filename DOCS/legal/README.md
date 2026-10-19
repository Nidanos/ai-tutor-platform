# Legal

Drafts tailored to Nidanos. **They are not legal advice.** A lawyer should review the user-facing ones before launch; good drafts make that review quick and cheap.

| Doc | Audience | Purpose |
|---|---|---|
| [privacy-policy.md](privacy-policy.md) | Users (public) | DPDP notice: what we collect, why, and users' rights |
| [terms-of-service.md](terms-of-service.md) | Users (public) | Rules, refunds, AI disclaimer, liability, disputes |
| [parental-consent.md](parental-consent.md) | Parents (public) + team | Under-18 consent notice and flow |
| [dpdp-compliance.md](dpdp-compliance.md) | Team | Obligations map, data inventory, retention, vendors, engineering rules |
| [breach-response-plan.md](breach-response-plan.md) | Team | 6-hour, 72-hour and user-notice runbook |

## Decisions behind these docs (14 Oct 2026)
| Topic | Decision |
|---|---|
| Who | Nidanos (to be registered); product name to be decided (`[PRODUCT]`) |
| Users | Individual learners plus colleges and coaching institutes. **India only.** Open to all ages |
| Under 18 | A parent's adult account approves; stronger ID check before May 2027; minors excluded from AI training and research |
| Money | Free beta; paid later with 30 days' notice; 7-day refund on first purchase |
| Data location | India-region hosting; sandbox and AI providers may process abroad, with no identity sent |
| Optional uses | AI model training and research (college study + papers): separate opt-ins, adults only, default off |
| Tracking | No analytics, no ads, only 2 essential cookies |
| Retention | Delete after 3 years inactive (48-hour warning); code purged once a skill is cleared |
| Contact | Grievance Officer: **Aditi Tanwar**, `grievance@[DOMAIN]` |

**Why AI training is opt-in, not automatic:** under DPDP, consent must be specific and can't be bundled. Making training a condition of using the product would put the core consent at risk, so it gets its own tick box.

## Placeholders to fill before launch
`[PRODUCT]` · `[DOMAIN]` · `[ADDRESS]` · `[ENTITY]` (legal form and registration number) · hosting and payment vendors (email: Brevo, ADR-0017)

The site's `/terms` and `/privacy` pages are built from these files (19 Oct). They show the text as the pilot version, with **working values** in the blanks: AI-Tutor by Nidanos, nidanos.com, Nidanos Private Limited, and "to be added before public launch" for the address (`apps/web/src/app/(legal)/LegalPage.tsx`). **Review them before the pilot:** the `privacy@`, `grievance@` and `support@nidanos.com` mailboxes must exist, the Grievance Officer needs a postal address, and the providers list the privacy policy points to (`nidanos.com/privacy/providers`) doesn't exist yet.

## Key dates
- **Now → 10 Nov 2026 (MVP):** consent at register, rights endpoints, no analytics
- **Before public launch:** lawyer review, mailboxes live, vendor DPAs, policies published at `[DOMAIN]/privacy` and `[DOMAIN]/terms`
- **By about 13 May 2027:** the DPDP Rules' consent, children, breach and retention duties apply. Have the stronger parental ID check and the s.9(3) legal opinion done by then
