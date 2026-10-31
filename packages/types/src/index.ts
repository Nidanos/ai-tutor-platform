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

export * from "./diagnostic.js";
