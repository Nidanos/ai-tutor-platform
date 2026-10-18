import Link from "next/link";

type AuthHeaderProps = {
    variant?: "login" | "signup" | "forgot-password";
};

function AuthHeader({ variant = "login" }: AuthHeaderProps) {
    const isSignup = variant === "signup";
    const isForgotPassword = variant === "forgot-password";

    const message = isSignup
        ? "Already have an account?"
        : isForgotPassword
          ? "Remember your password?"
          : "Don't have an account?";

    const linkText = isSignup ? "Log In" : "Sign Up";
    const linkDestination = isSignup ? "/login" : "/register";

    return (
        <div className="mb-10 flex flex-wrap items-center justify-end gap-3 text-sm">
            <span className="text-indigo-100">{message}</span>

            <Link
                href={isForgotPassword ? "/login" : linkDestination}
                className="rounded-xl border border-white/20 px-5 py-3 font-medium transition hover:border-violet-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
                {isForgotPassword ? "Log In" : linkText}
            </Link>
        </div>
    );
}

export default AuthHeader;