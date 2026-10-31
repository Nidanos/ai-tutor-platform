import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import AuthHeader from "./AuthHeader";
import WelcomeMessage from "./WelcomeMessage";
import ResetPasswordForm from "../forms/ResetPasswordForm";

function ResetPasswordCard() {
    return (
        <section className="relative rounded-2xl border border-indigo-300/20 bg-slate-950/25 p-6 shadow-xl backdrop-blur-sm sm:p-8 lg:p-10">
            <AuthHeader variant="forgot-password" />

            <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-violet-300/20 bg-violet-500/20 text-violet-200 shadow-lg shadow-violet-500/20">
                    <KeyRound size={36} />
                </div>

                <div className="mt-5">
                    <WelcomeMessage
                        title="Set a new password"
                        subtitle="Choose a new password for your account. You'll be logged out everywhere else."
                    />
                </div>
            </div>

            <ResetPasswordForm />

            <div className="mt-8">
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-200 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                    <ArrowLeft size={18} />
                    Back to Log In
                </Link>
            </div>
        </section>
    );
}

export default ResetPasswordCard;
