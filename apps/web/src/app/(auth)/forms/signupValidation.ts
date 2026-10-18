import { isValidEmail } from "../utils/validation";
import type { SignupErrors } from "./signupTypes";

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

export function validateSignup(data: SignupInput): SignupErrors {
  const errors: SignupErrors = {};
  const name = data.fullName.trim();
  const email = data.email.trim();
  const today = new Date().toISOString().slice(0, 10);

  if (!name || name.length > 80)
    errors.fullName = "Name must contain 1–80 characters";
  if (!email || email.length > 254 || !isValidEmail(email))
    errors.email = "Enter a valid email address";
  if (data.password.length < 8 || data.password.length > 128)
    errors.password = "Password must contain 8–128 characters";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords do not match";
  if (!data.dateOfBirth || data.dateOfBirth > today)
    errors.dateOfBirth = "Enter a valid date of birth";
  if (!data.acceptTerms)
    errors.acceptTerms = "Please accept the terms";
  if (!data.acceptPrivacy)
    errors.acceptPrivacy = "Please accept the privacy policy";

  return errors;
}
