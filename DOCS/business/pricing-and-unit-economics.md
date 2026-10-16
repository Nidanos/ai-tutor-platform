# Pricing and unit economics

> **Estimate, 16 Oct 2026.** Prices come from current trackers (E2B, Gemini, hosting) at **$1 ≈ ₹88**. Founders' salaries are **not** included: this is only the cost of keeping the platform running. Replace the estimates with real numbers after the pilot: `llm_calls` logs the cost of every LLM call, and E2B bills per second.

## 1. Unit costs
| Item | Basis | Cost |
|---|---|---|
| One code submission | Fresh E2B sandbox, ~7 s billed, 2 vCPU / 512 MiB ($0.000014 per vCPU-second + $0.0000045 per GiB-second) | **about ₹0.02** |
| One live tutor hint | Gemini Flash-Lite ($0.10 / $0.40 per M tokens), ~2,000 tokens in, ~200 out | **about ₹0.03** |
| Lessons + exercises | Generated once per course (Flash, Batch API), then frozen | about ₹400 per course, shared by all students |
| Exercise verification runs | ~4 sandbox runs per generated exercise | about ₹0.08 per exercise, once |

## 2. Cost per student per month
| Profile | Submissions | Live hints | Cost |
|---|---|---|---|
| Light (2 days a week) | 80 | 20 | about ₹2 |
| **Typical** (4 days a week) | 320 | 80 | **about ₹9** |
| Heavy (daily, at the caps) | 1,200 | 600 (cap 20/day) | about ₹42, the most the caps allow |
| Free plan, at its caps (15 submits + 5 live hints a day) | 450 | 150 | **at most about ₹13** |

## 3. Fixed costs per month (commercial phase)
| Item | Cost |
|---|---|
| Server: ₹0 on Oracle Always Free, otherwise a Mumbai VPS (ADR-0010) | ₹0–2,000 |
| Domain, email, backups | about ₹250 |
| Pvt Ltd compliance (CA, annual filings, spread monthly) | about ₹2,500 |
| New course content (amortised) | about ₹100 |
| **Total** | **about ₹3,000–5,000** |
| **E2B Pro**, needed beyond roughly 1,000–2,000 active students (Hobby: 1 new sandbox per second, 20 at once) | + about ₹13,200 |

## 4. Break-even fee per paying student (typical usage)
Includes ~2.4% payment-gateway fees. GST (18%) applies only after ₹20 lakh turnover a year; add it to the price then.

| Paying students | Fixed cost each | Usage | Break-even / month |
|---|---|---|---|
| 100 | ₹50 | ₹9 | about ₹61 |
| 500 | ₹10 | ₹9 | about ₹20 |
| 2,000 (with E2B Pro) | ₹9 | ₹9 | about ₹19 |

With a free plan of about 4 free users per payer (~₹4 each), add **about ₹16** per paying student.

## 5. Recommended pricing
| Plan | Price | Limits | Reasoning |
|---|---|---|---|
| **Free** | ₹0 | 15 submissions + 5 live hints a day | Lets students try it; costs at most ~₹13 each |
| **Student Pro** | **₹99/month** or **₹799/year** (≈ ₹67/month) | 20 live hints a day; rate limit 10 submits a minute | Covers the heaviest legal user (₹42) plus fixed costs and free users, even at 100 payers |
| **College seat** | **₹49 per student per month**, billed per semester | Same as Pro | Bulk sale to institutions |

- **Absolute floor: about ₹49/month**, and only once there are 500+ paying students.
- **₹99/month is profitable from about 100 paying students**, and the margin pays for E2B Pro when Hobby is outgrown.
- **The biggest cost lever is usage caps, not price.** With the caps, no single student can cost more than ~₹42 a month.
- Refunds: 7 days on the first purchase (Terms of Service, section 3).

## 6. Revisit when
- The Gemini promo pricing ends (31 Dec 2026), or E2B changes its prices.
- The pilot gives real usage numbers (submissions and hints per active student).
- The ₹20 lakh GST threshold is near, or E2B Hobby limits start queueing submissions.
