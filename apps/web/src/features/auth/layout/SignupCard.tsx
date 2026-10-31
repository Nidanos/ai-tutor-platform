
import AuthHeader from "./AuthHeader";
import WelcomeMessage from "./WelcomeMessage";
import TermsAndPrivacy from "../forms/TermsAndPrivacy";
import SignupForm from "../forms/SignupForm";

function SignupCard() {
    return (
        <section className="relative rounded-2xl border border-indigo-300/20 bg-slate-950/25 p-6 shadow-xl backdrop-blur-sm sm:p-8 lg:p-10">
            <AuthHeader variant="signup" />

            <WelcomeMessage
                title="Create your account"
                subtitle="Get started with AI Tutor in just a few steps."
            />

            <SignupForm />

            <div className="mt-6">
                <TermsAndPrivacy />
            </div>
        </section>
    );
}

export default SignupCard;
