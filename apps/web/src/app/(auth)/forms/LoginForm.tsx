"use client";

import { useState, type FormEvent } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import LoginOptions from "./LoginOptions";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { isValidEmail } from "../utils/validation";
import { getStoredValue, storeValue } from "../utils/formStorage";
import { useRouter } from "next/navigation";
import { loginUser } from "./loginServices";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginForm() {
   
    const router = useRouter();
    const { setAuthenticatedUser } = useAuth();
    const [email, setEmail] = useState<string>(
    () => getStoredValue("login-email")
    );
    const [password, setPassword] = useState<string>("");
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
    } | null>(null);

    const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    }>({});


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;
    
    setStatusMessage(null);

    const newErrors: {
        email?: string;
        password?: string;
    } = {};

    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
        newErrors.email = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!password) {
        newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    // Stop if validation fails
    if (Object.keys(newErrors).length > 0) {
        return;
    }

    // Simulate a login request
    setIsLoading(true);

    try {
        const user = await loginUser(trimmedEmail, password);

        setAuthenticatedUser(user);

        setStatusMessage({
            type: "success",
            text: `Welcome back, ${user.displayName}!`,
        });

        router.push("/dashboard");
    } catch (error) {
        setStatusMessage({
            type: "error",
            text: error instanceof Error
                ? error.message
                : "Unable to log in. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <form 
            className="space-y-5"
            onSubmit={handleSubmit}
        >
            {statusMessage && (
            <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border p-3 text-sm ${
                    statusMessage.type === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-red-400/30 bg-red-400/10 text-red-200"
                }`}
            >
                {statusMessage.text}
            </div>
        )}
            <Input
                id="email"
                name="email"
                label="Email address"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                helperText="Enter your registered email"
                startIcon={<Mail size={20} />}
                value={email}
                 onChange={(event) => {
                    const value = event.target.value;

                    setEmail(value);
                    storeValue("login-email", value);

                    setStatusMessage(null);

                    if (errors.email) {
                        setErrors((previous) => ({
                            ...previous,
                            email: undefined,
                         }));
                    }
                }}
                error={errors.email}
                required
            />

            <Input
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                helperText="Enter your password"
                startIcon={<LockKeyhole size={20} />}
                value={password}
                onChange={(event) => {
                    setStatusMessage(null);
                    setPassword(event.target.value);

                    if (errors.password) {
                        setErrors((previous) => ({
                            ...previous,
                            password: undefined,
                        }));
                    }
                }}
                error={errors.password}
                endAdornment={
                    <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="rounded-md p-1 text-indigo-200 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                        {showPassword ? (
                            <EyeOff size={20} />
                            ) : (
                            <Eye size={20} />
                        )}
                    </button>
                    }
                required
            />

            <LoginOptions
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
            />

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-4 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isLoading ? (
                    <>
                        <span
                            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                            aria-hidden="true"
                        />
                        Signing in...
                    </>
                ) : (
                    <>
                        Log In <span className="ml-2">→</span>
                    </>
                )}
            </Button>
        </form>
    );
}

export default LoginForm;