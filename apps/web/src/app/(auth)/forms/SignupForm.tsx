
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "../common/Button";
import { getStoredValue, storeValue } from "../utils/formStorage";
import SignupFields from "./SignupFields";
import SignupConsents from "./SignupConsents";
import { isAdult, validateSignup } from "./signupValidation";
import { registerUser } from "./signupService";
import type { SignupErrors, SignupFormData } from "./signupTypes";

export default function SignupForm() {
  const router = useRouter();
  const [data, setData] = useState<SignupFormData>({
    fullName: getStoredValue("signup-name"),
    email: getStoredValue("signup-email"),
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    acceptTerms: false,
    acceptPrivacy: false,
    aiTraining: false,
    research: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [status, setStatus] = useState("");

  function update<K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setStatus("");
    if (key === "fullName") storeValue("signup-name", value as string);
    if (key === "email") storeValue("signup-email", value as string);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSignup(data);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setIsLoading(true);
    try {
      await registerUser(data);
      setStatus("Account created successfully. Redirecting to login...");
      window.setTimeout(() => router.push("/login?registered=1"), 900);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <SignupFields {...data} showPassword={showPassword}
        showConfirmPassword={showConfirmPassword} errors={errors}
        setFullName={(v) => update("fullName", v)}
        setEmail={(v) => update("email", v)}
        setPassword={(v) => update("password", v)}
        setConfirmPassword={(v) => update("confirmPassword", v)}
        setDateOfBirth={(v) => update("dateOfBirth", v)}
        setShowPassword={setShowPassword}
        setShowConfirmPassword={setShowConfirmPassword} />
      <SignupConsents {...data} errors={errors}
        showOptionalConsent={isAdult(data.dateOfBirth)}
        onTermsChange={(v) => update("acceptTerms", v)}
        onPrivacyChange={(v) => update("acceptPrivacy", v)}
        onAiTrainingChange={(v) => update("aiTraining", v)}
        onResearchChange={(v) => update("research", v)} />
      {status && <p role="status" aria-live="polite" className="text-sm text-indigo-200">{status}</p>}
      <Button type="submit" disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-4 font-semibold text-white disabled:opacity-60">
        {isLoading ? "Creating account..." : "Create Account →"}
      </Button>
    </form>
  );
}
