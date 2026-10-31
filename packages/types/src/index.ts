// Contracts the API returns and the web app reads. Add a type here when a screen first uses an endpoint.

export type UserRole = "LEARNER" | "AUTHOR" | "ADMIN";

// GET /auth/me
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  timezone: string;
  dateOfBirth: string | null;
  status: "active" | "pending_parent";
  createdAt: string;
};

// The seeded courses (apps/api seed/data.ts); every course is in C++ for now.
export type CourseSlug = "cpp-basics" | "dsa";

// GET /me/consents lists the live ones; only the two optional opt-ins switch on and off (PUT|DELETE /me/consents/:kind).
export type ConsentKind = "terms" | "data_processing" | "parental" | "research_study" | "ai_training";
export type Consent = { kind: ConsentKind; policyVersion: string; grantedAt: string };

export * from "./dashboard.js";
export * from "./diagnostic.js";
