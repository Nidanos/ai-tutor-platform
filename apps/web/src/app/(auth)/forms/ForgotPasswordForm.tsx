"use client";

import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import Input from "../common/Input";
import Button from "../common/Button";
import { isValidEmail } from "../utils/validation";
import { api, ApiError } from "@/lib/api/client";

function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isLoading) return;
        
        setStatusMessage("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Email address is required.");
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            // The same answer whether or not the account exists, so nobody can probe for emails.
            const { message } = await api<{ message: string }>("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: trimmedEmail }),
            });
            setStatusMessage(message);
        } catch (err) {
            setStatusMessage(
                err instanceof ApiError && err.status === 429
                    ? "Too many requests. Please wait a few minutes and try again."
                    : "Something went wrong. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mt-8">
            <Input
                id="recovery-email"
                label="Email address"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    setStatusMessage("");
                }}
                error={error}
                helperText="Use the email address linked to your account."
                startIcon={<Mail size={22} />}
                variant="dark"
                autoComplete="email"
                required
            />

            <Button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Send size={20} />
                {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            {statusMessage && (
                <p
                    role="status"
                    aria-live="polite"
                    className="mt-4 text-center text-sm text-indigo-200"
                >
                    {statusMessage}
                </p>
            )}
        </form>
    );
}

export default ForgotPasswordForm;