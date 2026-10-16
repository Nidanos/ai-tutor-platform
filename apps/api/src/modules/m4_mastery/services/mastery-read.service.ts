import type { masteryRecords } from "../../../infrastructure/database/schema/index.js";
import { getSkill, getSkills } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/mastery.repository.js";
import { effectiveScore } from "./mastery-formula.js";

type MasteryRecord = typeof masteryRecords.$inferSelect;

// Reading and writing are always shown separately (FR-M11-02), each decayed from its own evidence.
function view(r: MasteryRecord, now = new Date()) {
  const dimension = (score: number, evidenceAt: Date | null) => ({
    score,
    effective: effectiveScore(score, r.decayLambda, evidenceAt, now),
    lastEvidenceAt: evidenceAt,
  });
  return {
    reading: dimension(r.readingScore, r.readingEvidenceAt),
    writing: dimension(r.writingScore, r.writingEvidenceAt),
    clearedAt: r.clearedAt,
    attemptCount: r.attemptCount,
    successCount: r.successCount,
  };
}

// Skills the learner has evidence on; untouched skills have no row yet.
export async function listMastery(userId: string, languageCode?: string) {
  const records = await repo.listRecords(userId, languageCode);
  const skillOf = new Map((await getSkills(records.map((r) => r.skillId))).map((s) => [s.id, s]));
  return records.map((r) => {
    const skill = skillOf.get(r.skillId)!;
    return { skill: { id: skill.id, slug: skill.slug, name: skill.name }, languageCode: r.languageCode, ...view(r) };
  });
}

// One skill in detail, with its recent evidence. A skill never practised shows zeros, not a 404.
export async function getSkillMastery(userId: string, skillId: string, languageCode: string) {
  const skill = await getSkill(skillId);
  const key = { userId, skillId, languageCode };
  const record = await repo.findRecord(key);
  const empty = { score: 0, effective: 0, lastEvidenceAt: null };
  return {
    skill: { id: skill.id, slug: skill.slug, name: skill.name },
    languageCode,
    ...(record ? view(record) : { reading: empty, writing: empty, clearedAt: null, attemptCount: 0, successCount: 0 }),
    history: record ? await repo.listEvidence(key) : [],
  };
}

// For M5: today's effective scores per skill, keyed by skill id.
export async function effectiveStates(userId: string, languageCode: string) {
  const now = new Date();
  const records = await repo.listRecords(userId, languageCode);
  return new Map(
    records.map((r) => [
      r.skillId,
      {
        reading: effectiveScore(r.readingScore, r.decayLambda, r.readingEvidenceAt, now),
        writing: effectiveScore(r.writingScore, r.decayLambda, r.writingEvidenceAt, now),
        cleared: r.clearedAt !== null,
        attempts: r.attemptCount,
      },
    ]),
  );
}
