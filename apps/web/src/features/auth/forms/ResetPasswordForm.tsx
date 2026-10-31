"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api/client";

type Status = "ready" | "missing-link" | "done";

function ResetPasswordForm() {
    const [token, setToken] = useState("");
    const [status, setStatus] = useState<Status>("ready");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // The token comes in the link's #fragment, which browsers never send to a server.
    useEffect(() => {
        const found = new URLSearchParams(window.location.hash.slice(1)).get("token");
        if (found) setToken(found);
        else setStatus("missing-link");
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isLoading) return;

        const nextErrors: typeof errors = {};
        if (password.length < 8 || password.length > 128)
            nextErrors.password = "Password must contain 8–128 characters";
        if (password !== confirmPassword)
            nextErrors.confirmPassword = "Passwords do not match";
        setErrors(nextErrors);
        setMessage("");
        if (Object.keys(nextErrors).length) return;

        setIsLoading(true);
        try {
            await api("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
            });
            setStatus("done");
        } catch (err) {
            setMessage(
                err instanceof ApiError && err.body.code === "RESET_LINK_INVALID"
                    ? err.body.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    if (status === "missing-link") {
        return (
            <p role="status" className="mt-8 text-center text-sm text-indigo-200">
                This page needs the link from your reset email.{" "}
                <Link href="/forgot-password" className="font-medium text-white underline">
                    Get a new link
                </Link>
            </p>
        );
    }

    if (status === "done") {
        return (
            <div role="status" className="mt-8 text-center">
                <p className="text-sm text-indigo-200">
                    Your password has been changed, and you have been logged out on every device.
                </p>
                <Link
                    href="/login"
                    className="mt-6 inline-block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                    Log in with your new password
                </Link>
            </div>
        );
    }

    const toggle = (
        <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
        >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
    );

    return (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <Input
                id="newPassword"
                name="password"
                label="New password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                startIcon={<LockKeyhole size={20} />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                endAdornment={toggle}
                variant="dark"
                required
            />
            <Input
                id="confirmNewPassword"
                name="confirmPassword"
                label="Confirm new password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                startIcon={<LockKeyhole size={20} />}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
                variant="dark"
                required
            />

            <Button
                type="submit"
                disabled={isLoading || !token}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <KeyRound size={20} />
                {isLoading ? "Saving..." : "Set New Password"}
            </Button>

            {message && (
                <p role="alert" aria-live="polite" className="mt-4 text-center text-sm text-indigo-200">
                    {message}{" "}
                    <Link href="/forgot-password" className="font-medium text-white underline">
                        Get a new link
                    </Link>
                </p>
            )}
        </form>
    );
}

export default ResetPasswordForm;
