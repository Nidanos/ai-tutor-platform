import { learnerPlacements } from "../../m3_diagnostic/services/diagnostic.service.js";
import { learnerEnrollments } from "../../m3_diagnostic/services/enrollments.service.js";
import { learnerMastery } from "../../m4_mastery/services/mastery-read.service.js";
import { learnerRecommendations } from "../../m5_recommender/services/recommender.service.js";
import { learnerPractice } from "../../m7_execution/services/submissions.service.js";
import { learnerHints } from "../../m8_socratic/services/hints.service.js";
import { learnerSessions } from "../../m9_sessions/services/sessions.service.js";
import { learnerScaffolding } from "../../m12_scaffolding/services/scaffolding.service.js";
import { accountData } from "../repositories/account.repository.js";
import { me } from "./auth.service.js";

// The access right (DPDP s.11) asks for a summary, the purposes and who the data was shared with,
// not only the data. These match the privacy policy, sections 2 and 5.
const ABOUT = {
  summary: "Everything AI-Tutor holds about you, as of exportedAt. Times are in UTC.",
  purposes: {
    account: "Create your account, sign you in, check whether you need parental consent, and show times correctly",
    signInSecurity: "Keep your account safe and detect stolen sessions",
    learning: "Grade your work, measure what you know, and choose your next lesson",
  },
  sharedWith: [
    { provider: "Oracle Cloud (India region)", purpose: "Hosting our servers and database", data: "All of this data" },
    { provider: "Vercel", purpose: "Serving the website", data: "Your requests and IP address, no database access" },
    { provider: "E2B", purpose: "Running your code in an isolated sandbox", data: "Your submitted code and the exercise's tests, no name or email" },
    { provider: "Google Gemini (paid, no-training terms)", purpose: "Writing hints", data: "Your code and the exercise context, no name or email" },
    { provider: "Brevo", purpose: "Sending account emails", data: "Your email address and the email itself" },
  ],
};

// GET /me/data: each module hands over its own rows; M5 finds its rows by enrollment.
export async function exportData(userId: string) {
  await me(userId);
  const courses = await learnerEnrollments(userId);
  const [account, placementTests, mastery, recommendations, practice, hints, sessions, scaffolding] = await Promise.all([
    accountData(userId),
    learnerPlacements(userId),
    learnerMastery(userId),
    learnerRecommendations(courses.map((c) => c.id)),
    learnerPractice(userId),
    learnerHints(userId),
    learnerSessions(userId),
    learnerScaffolding(userId),
  ]);
  return { exportedAt: new Date(), about: ABOUT, account, courses, placementTests, mastery, recommendations, practice, hints, sessions, scaffolding };
}
