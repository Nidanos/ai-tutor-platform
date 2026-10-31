
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import Input from "@/components/ui/Input";
import type { SignupErrors } from "./signupTypes";

type Props = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: SignupErrors;
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setDateOfBirth: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
};

export default function SignupFields(props: Props) {
  const {
    fullName, email, password, confirmPassword, dateOfBirth,
    showPassword, showConfirmPassword, errors,
    setFullName, setEmail, setPassword, setConfirmPassword,
    setDateOfBirth, setShowPassword, setShowConfirmPassword,
  } = props;

  return (
    <>
      <Input id="fullName" name="fullName" label="Full name"
        type="text" placeholder="Full name" autoComplete="name"
        startIcon={<UserRound size={20} />} value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName} required />
      <Input id="signupEmail" name="email" label="Email address"
        type="email" placeholder="Email address" autoComplete="email"
        startIcon={<Mail size={20} />} value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email} required />
      <Input id="signupPassword" name="password" label="Create password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password" startIcon={<LockKeyhole size={20} />}
        value={password} onChange={(e) => setPassword(e.target.value)}
        error={errors.password} required
        endAdornment={<button type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label="Toggle password visibility">
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>} />
      <Input id="confirmPassword" name="confirmPassword"
        label="Confirm password"
        type={showConfirmPassword ? "text" : "password"}
        autoComplete="new-password" startIcon={<LockKeyhole size={20} />}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword} required
        endAdornment={<button type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          aria-label="Toggle confirm password visibility">
          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>} />
      <Input id="dateOfBirth" name="dateOfBirth" label="Date of birth"
        type="date" value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        error={errors.dateOfBirth} required />
    </>
  );
}
