import { ArrowLeft, Mail } from "lucide-react";
import AuthHeader from "./AuthHeader";
import WelcomeMessage from "./WelcomeMessage";
import ForgotPasswordForm from "../forms/ForgotPasswordForm";
import Link from "next/link";

function ForgotPasswordCard() {
    return (
        <section className="relative rounded-2xl border border-indigo-300/20 bg-slate-950/25 p-6 shadow-xl backdrop-blur-sm sm:p-8 lg:p-10">
            <AuthHeader variant="forgot-password" />

            <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-violet-300/20 bg-violet-500/20 text-violet-200 shadow-lg shadow-violet-500/20">
                    <Mail size={36} />
                </div>

                <div className="mt-5">
                    <WelcomeMessage
                        title="Reset your password"
                        subtitle="Enter your email and we'll send you a link to reset your password."
                    />
                </div>
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-indigo-300/30" />

                    <span className="text-xs font-medium tracking-wider text-indigo-300">
                        ACCOUNT RECOVERY
                    </span>

                    <div className="h-px flex-1 bg-indigo-300/30" />
                </div>
            </div>

            <ForgotPasswordForm />
            
            <div className="mt-8">
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-200 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                    <ArrowLeft size={18} />
                    Back to Log In
            </Link>
            </div>

            <div className="mt-8 border-t border-indigo-300/20 pt-6 text-center">
                <p className="text-sm text-indigo-300/80">
                    Your account security matters to us.
                </p>
            </div>
        </section>
    );
}

export default ForgotPasswordCard;