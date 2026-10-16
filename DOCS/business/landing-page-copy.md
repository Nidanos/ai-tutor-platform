# nidanos.com: new copy (AI lab first, services second)

> **Draft v1, 16 Oct 2026.** Based on a full review of the live site (section A).
> **Decisions:** home = Nidanos as an AI lab with AI-Tutor as the flagship; the agency moves to `/services`; two calls to action (students: pilot waitlist; colleges: partner); products move from `kodeforgelabs.com` to `nidanos.com` subdomains; team shown by what each person owns, not by titles.

---

## A. Review of the current site (16 Oct 2026)

**Keep:**
- **Speed:** 0.8 s load, 141 KB, 7 requests.
- **Mobile:** clean layout at phone width.
- **SEO basics:** title, description, Open Graph, canonical, `robots.txt`, sitemap, structured data.
- **Trust:** real shipped products, team pages, transparent prices, a clear process.

**Fix:**

| # | Issue | Fix |
|---|---|---|
| 1 | Positioned only as a web agency; AI-Tutor is absent | New home (section C); agency moves to `/services` (section D) |
| 2 | `/privacy` and `/terms` are 404, while the contact form collects name, email and phone | Publish both pages (section E) and add a notice under every form (DPDP Act) |
| 3 | Missing pages return HTTP 200 (soft 404) | Serve a real `404` status |
| 4 | Products hosted on `kodeforgelabs.com` | Move to `mcq.nidanos.com` and `gradplacifyr.nidanos.com`, with 301 redirects from the old addresses |
| 5 | Team pages are rendered only in the browser | Prerender them, or set their title and description on the server |
| 6 | Structured data says `ProfessionalService` only | Add `Organization` and `SoftwareApplication` (section F) |

---

## B. Page map
| Page | Purpose |
|---|---|
| `/` | Nidanos, the AI lab: the idea, AI-Tutor, our products, how we build AI, team, contact |
| `/services` | Today's agency content, almost unchanged (section D) |
| `/privacy`, `/terms` | Required by law and by payment and credit programs (section E) |
| `/team/*` | Unchanged, plus the new "owns" lines |

---

## C. Home page copy

### Meta
- **Title:** Nidanos: AI that makes itself unnecessary
- **Description:** Nidanos is an AI lab in New Delhi. We build AI products that make you capable, then step back. First up: AI-Tutor, a coding tutor that withdraws its help as you prove yourself.
- **OG title:** AI that makes itself unnecessary
- **OG description:** Learn to code without a crutch. Join the AI-Tutor pilot.

### 1. Hero
> **Eyebrow:** NIDANOS · AI LAB · NEW DELHI
>
> # AI that makes itself unnecessary.
>
> Most apps are built to keep you coming back. We build AI that makes you capable, then steps back. Our first product, **AI-Tutor**, teaches you to code and withdraws its help as you prove yourself.
>
> **[Join the AI-Tutor pilot]** **[Partner with us: colleges]**
>
> *Free pilot · 50–100 students · starting Nov–Dec 2026*

**Hero visual** (reusing today's "health check" card style):
```
AI-TUTOR · YOUR SKILL: LOOPS
Reading code      ████████░░  0.78
Writing code      ███░░░░░░░  0.31
Help available    Stage 2 of 4 · up to 4 hints
Next              Solve a level-3 exercise with ≤ 1 hint
● Help fades as you improve
```

### 2. The idea
> ## Like a gurukul, not a crutch.
>
> In a gurukul, the guru teaches, guides and corrects. When the learning is complete, the shishya goes out into the world and survives alone. That's the only measure that matters: **can you do it without us?**
>
> Today's courses measure what you watched. AI assistants hand over answers. Both feel like progress, and both leave you stuck at a blank editor.

### 3. AI-Tutor
> ## AI-Tutor: learn to code without a crutch.
> *Working name.*
>
> **1. Write real code.** Every answer is compiled and run against hidden tests in a secure sandbox, the way placement interviews judge you.
>
> **2. See honest progress.** Two scores for every skill, **reading code** and **writing code**, built only from code you actually ran. Never "80% complete".
>
> **3. Get hints, not answers.** A Socratic tutor that makes you think. It never hands you the solution.
>
> **4. Watch the help fade.** Each skill starts with full support, and support drops stage by stage as you solve problems with few hints, until you need none.
>
> **Why it works:** in a randomised trial with about 1,000 students, unrestricted AI help cut exam scores by 17% once it was taken away, while hint-only AI caused no such drop (Bastani et al., *PNAS* 2025). AI-Tutor is built the hint-only way.
>
> **First course:** C++ basics → Data Structures & Algorithms, for placement preparation.
>
> **[Join the pilot]** **[Run a pilot at your college]**

### 4. Where we are
> ## Built, tested, and getting ready for the pilot.
> - Code judged in about 6 seconds, in a fresh, offline sandbox for every submission
> - A mastery engine that tracks reading and writing separately and accounts for forgetting
> - Help that fades per skill, enforced on our servers
> - 69 automated tests · built for India's DPDP Act from day one

### 5. Our products
> ## What we've built.
>
> **AI-Tutor** · *Preparing pilot*: an adaptive coding tutor that steps back as you grow.
>
> **AI MCQ Platform** · *Live, on our own GPU*: practice tests generated by a language model **we host ourselves**: pick a topic and a level, get a test, track progress. → `mcq.nidanos.com`
>
> **GradPlacifyr** · *Built for universities*: placement management for students, recruiters and drives, with strict role-based access and AI resume parsing. → `gradplacifyr.nidanos.com`
>
> **careerVversity** · *Live client platform*: psychometric assessments with personalised reports, bookings and an admin CMS, in production for a real career practice. → `careervversity.com`

### 6. How we build AI
> ## Our rules.
> - **Capability over engagement.** We measure success by how little you need us.
> - **Evidence, not vibes.** Progress moves only when you produce something real.
> - **Your data stays yours.** Hosted in India, never sold, and used for AI training only if you opt in.
> - **We run what we build.** Our servers, our sandboxes, our own GPU.

### 7. Team
> ## Three founders. No titles. Here's what each of us owns.
>
> **Aman Dogra** · *owns where we're going*: the company, the partnerships, and the code that ties the screens to the data.
>
> **Ashwani Kumar Puri** · *owns the engine*: servers, data, the sandbox that runs your code, and everything that has to work at 3 a.m.
>
> **Aditi Tanwar** · *owns what you see and feel*: design, the interface, and how Nidanos shows up in the world.
>
> *We met in the MCA programme at JIMS Rohini, and we build together.*

### 8. We also build for others
> ## Need a website or platform built?
> The team that builds AI-Tutor also builds fast, secure websites and web apps for businesses, institutes and coaches, with the price on every service.
>
> **[See services and pricing →]** (`/services`)

### 9. Contact: two forms
**Students: join the AI-Tutor pilot**
- Name\* · Email\* · I'm a: *Student / Working professional* · College (optional) · Year/course (optional)
- Button: **Join the waitlist**
- Under the button: *We'll use your email only to contact you about the AI-Tutor pilot. 18+ only for the pilot. See our [Privacy Policy](/privacy).*

**Colleges: partner with us**
- Name\* · College\* · Role (e.g. Training & Placement Officer)\* · Email\* · Phone · Batch size
- Button: **Start a conversation**
- Under the button: *We'll use these details only to reply about a pilot at your college. See our [Privacy Policy](/privacy).*

Footer: hello@nidanos.com · New Delhi, India · LinkedIn · Instagram · X · Threads · Reddit · [Privacy](/privacy) · [Terms](/terms)

---

## D. `/services` page
Reuse today's home content almost as is: hero, health-check card, 9 service cards with prices, work, process, FAQ and enquiry form. Two changes:
1. **Eyebrow:** "NIDANOS STUDIO · WEB DESIGN & DEVELOPMENT"
2. **Under the hero, add:** *"The same team builds Nidanos' own AI products. [See AI-Tutor →](/)"*

Add the privacy notice under the enquiry form: *"We'll use these details only to reply to your enquiry. See our [Privacy Policy](/privacy)."*
Meta title: **Web Design, Development & Website Fixes | Nidanos Studio, New Delhi** (keeps the agency's search traffic).

## E. `/privacy` and `/terms`
- **Short website version now:** what the enquiry and waitlist forms collect (name, email, phone, college), the purpose (replying, pilot invites), retention (deleted after 12 months without a project or pilot), contact `grievance@nidanos.com`, the Grievance Officer (Aditi Tanwar), and that nothing is sold.
- **Full version for the AI-Tutor product:** `DOCS/legal/privacy-policy.md` and `terms-of-service.md`, published before the pilot opens sign-ups.

## F. Structured data (home)
```json
{ "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "name": "Nidanos", "url": "https://nidanos.com/", "email": "hello@nidanos.com",
    "slogan": "AI that makes itself unnecessary.", "address": { "@type": "PostalAddress", "addressLocality": "New Delhi", "addressCountry": "IN" },
    "sameAs": ["https://www.linkedin.com/company/nidanos/", "https://www.instagram.com/nidanos_/", "https://x.com/Nidanos_"] },
  { "@type": "SoftwareApplication", "name": "AI-Tutor", "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web", "publisher": { "@type": "Organization", "name": "Nidanos" } } ] }
```
Keep today's `ProfessionalService` block on `/services`.
