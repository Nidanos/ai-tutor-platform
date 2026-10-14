# Breach response plan

> Internal runbook: what to do if personal data leaks, is stolen, or is lost.
> **Owner:** Ashwani (CTO, technical lead). **Comms and legal:** Aditi (Grievance Officer). **Decisions:** Aman (CEO).
> Print this. In a real incident, follow it step by step.

## Deadlines
| Who to tell | When | Law |
|---|---|---|
| **CERT-In** (incident@cert-in.org.in) | **Within 6 hours** of noticing a reportable cyber incident (e.g. data breach, unauthorised access) | CERT-In Directions, April 2022 (IT Act s.70B) |
| **Data Protection Board** | **Without delay**, then a **detailed report within 72 hours** | DPDP Act s.8(6), Rule 7 |
| **Each affected user** | **Without delay**, in plain language | DPDP Rule 7 |

There's no "too small to report" rule under DPDP. If personal data was breached, we report it.

## Step by step
**0–1 hour: contain**
1. Whoever notices it posts in the founders' group and calls Ashwani.
2. Stop the leak: revoke keys, rotate `JWT_SECRET` and database passwords (this signs everyone out), block attacker IPs, and take the affected service offline if needed.
3. **Preserve evidence.** Don't delete logs. Take snapshots of the database and logs.
4. Open an incident log: what was noticed, when, and every action taken, with timestamps.

**1–6 hours: assess and notify CERT-In**
5. Work out what data, how many users, since when, and whether it's still leaking.
6. Aditi files the CERT-In report, using the form on cert-in.org.in.
7. Aditi sends the Board its initial notice: what happened, when, the data involved, the users affected, and the immediate steps taken.

**6–72 hours: tell users, then the full report**
8. Email each affected user, using the template below.
9. Send the Board the detailed report: facts, cause, the steps to reduce harm, the people responsible, and how we're preventing a repeat.

**After**
10. Hold a blameless review within 7 days. Fix the root cause, and update [dpdp-compliance.md](dpdp-compliance.md) section 7.
11. Keep the incident log and every notice for at least 3 years.

## User notice template
> **Subject:** Important: a security incident affecting your [PRODUCT] account
>
> On [DATE] we discovered [WHAT HAPPENED, in one sentence]. It affected your [DATA, e.g. email address and learning progress]. Your password is stored as a one-way hash, and [was / was not] exposed.
>
> **Likely impact:** [e.g. you may get phishing emails].
> **What we did:** [e.g. closed the gap, signed everyone out, reported it to the authorities].
> **What you can do:** [e.g. change your password, and be careful of emails claiming to be from us].
>
> Questions: Aditi Tanwar, Grievance Officer, `grievance@[DOMAIN]`.
> Sorry, and thank you for your patience.

## Be ready before it happens
- [ ] `security@[DOMAIN]` mailbox, checked daily
- [ ] Everyone's phone numbers in the founders' group
- [ ] Logs kept for 180 days **in India**, as CERT-In requires, and refresh-token records for 1 year, as the DPDP Rules require
- [ ] A tested way to rotate every secret in under 30 minutes
- [ ] One practice run (tabletop) before launch
