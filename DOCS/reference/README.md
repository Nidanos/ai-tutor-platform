# reference/

`ai-tutor-mvp.ts` is an **AI-generated reference stub, not our implementation.** Use it only as a map of endpoint shapes. It must never be copied into `apps/api`.

What it fakes:
- **Grading:** "passed" means the code is longer than 10 characters and has no "ERROR" string. No sandbox, no tests.
- **Auth:** the password is stored as `"hashed_" + password`, tokens are mock strings, and every request acts as the first user in memory.
- **Storage:** in-memory Maps, not Postgres.
- **Seed data:** JavaScript→React, not DSA (see ADR-0001).
- **Mastery:** overwritten with fixed values (0.8 / 0.65 / 0.35) on each submit, not updated from weighted evidence.
- **`POST /mastery/evidence`:** public, which breaks FR-M4-02 (see ADR-0006).
