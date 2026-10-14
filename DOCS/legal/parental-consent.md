# Parental Consent: notice and flow

> **Draft v0.1, 14 Oct 2026.** DPDP Act s.9 and Rule 10 apply from about **13 May 2027**. Building the flow before then keeps us compliant from day one.

## A. The notice parents see (email + approval page)

**Subject:** Approve [CHILD NAME]'s [PRODUCT] account

Hello,

**[CHILD NAME]** (born [DATE OF BIRTH]) wants to learn programming on **[PRODUCT]**, an adaptive coding tutor run by Nidanos. Indian law requires a parent or guardian to approve accounts for anyone under 18.

**If you approve, we will:**
- keep your child's email, display name, date of birth, the code they write and their learning progress;
- use this data **only to teach them**: grading their code, measuring what they know, and choosing the next lesson;
- keep their code only until they master each skill.

**We will never:**
- show your child ads or use their data for marketing;
- use their data for AI training or research;
- track them for any purpose other than teaching them;
- sell their data.

**You can, at any time:** see, download, correct or delete your child's data, or withdraw this consent (which closes the account), from your own account or by emailing `privacy@[DOMAIN]`.

Full details: [Privacy Policy](privacy-policy.md). Questions: Aditi Tanwar, Grievance Officer, `grievance@[DOMAIN]`.

**[Approve]**  **[Decline]**

If you didn't expect this email, just ignore it. Without approval the account stays locked, and we delete it after 7 days.

---

## B. The flow (to build)
```
Child signs up with date of birth → age < 18?
  no  → normal account
  yes → account "pending_parent"; nothing processed except sign-up details
        → child enters parent's email → parent gets the email above
        → parent signs in with, or creates, an ADULT account (age ≥ 18, email verified)
        → parent approves → consent saved (kind: parental, parent id, notice version, time)
        → child's account unlocked and linked to the parent
  no approval in 7 days → sign-up data deleted
```

| Rule | Why |
|---|---|
| Parent must be a verified adult account | Rule 10: the fiduciary must check that the person giving consent is an identifiable adult |
| **Before May 2027:** add a stronger check (e.g. a DigiLocker age/identity token) | Rule 10 names reliable identity details or a government-issued or government-authorised token as the verification paths. A self-declared adult may not be enough |
| No AI training, research or analytics on child accounts, ever | The s.9(3) ban on tracking and behavioural monitoring of children; these purposes aren't covered by any exemption |
| A child turning 18 is asked to give their own consent | Their parent's consent no longer covers them as an adult |
| Institution accounts for minors: the institution collects parental consent under its contract with us | The educational-institution exemption covers the institution's own educational activities |

## C. Open legal question (ask a lawyer before May 2027)
Adaptive learning works by measuring how a learner performs. Is that "**behavioural monitoring**" of a child under s.9(3)?

**Our position:** the measurement is limited to delivering the teaching the parent approved. There's no profiling beyond that, no ads, and no other use. Get a written legal opinion. If the answer is no, minors should join only through institutions, which have an exemption for their educational activities.
