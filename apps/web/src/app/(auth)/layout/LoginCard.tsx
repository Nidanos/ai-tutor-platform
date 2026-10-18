
import AuthHeader from "./AuthHeader";
import WelcomeMessage from "./WelcomeMessage";
import LoginForm from "../forms/LoginForm";
import TermsAndPrivacy from "../forms/TermsAndPrivacy";

export default function LoginCard() {
    return (
        <section className="flex min-w-0 items-center justify-center p-3 sm:p-5 lg:p-6">
            <div className="w-full max-w-[645px] rounded-2xl border border-white/20 bg-slate-950/25 p-5 shadow-xl backdrop-blur-xl sm:p-6 lg:p-7">
                <AuthHeader />

                <div className="mb-6">
                    <WelcomeMessage
                        title="Welcome back"
                        subtitle="Log in to continue learning."
                    />
                </div>

                <LoginForm />

                <div className="mt-6 text-center text-xs text-indigo-200 sm:text-sm">
                    <TermsAndPrivacy />
                </div>
            </div>
        </section>
    );
}
