
import { api, ApiError } from "@/lib/api/client";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: "LEARNER" | "AUTHOR" | "ADMIN";
  timezone: string;
  dateOfBirth: string | null;
  status: "active" | "pending_parent";
  createdAt: string
};

export async function loginUser(email: string, password: string) {
  try {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const result = await api<{ user: AuthUser }>("/auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.body.code === "INVALID_CREDENTIALS") {
        throw new Error("Incorrect email or password.");
      }
      throw new Error(error.body.message);
    }
    throw new Error("Unable to log in. Please try again.");
  }
}
