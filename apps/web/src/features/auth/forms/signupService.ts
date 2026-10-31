import { api, ApiError } from "@/lib/api/client";
import type { RegisterResponse, SignupFormData } from "./signupTypes";

export async function registerUser(data: SignupFormData) {
  const { fullName, confirmPassword, ...formData } = data;
  void confirmPassword;

  try {
    return await api<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email.trim(),
        password: formData.password,
        displayName: fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        acceptTerms: formData.acceptTerms,
        acceptPrivacy: formData.acceptPrivacy,
        aiTraining: formData.aiTraining,
        research: formData.research,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.body.code === "EMAIL_TAKEN") {
        throw new Error("This email is already registered. Please log in.");
      }
      throw new Error(error.body.message);
    }
    throw new Error("Unable to create your account. Please try again.");
  }
}
