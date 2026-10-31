import BrandLogo from "./BrandLogo";
import WelcomeMessage from "./WelcomeMessage";
import LearningBenefits from "./LearningBenefits";
import LearningJourney from "./LearningJourney";

type WelcomePanelProps = {
    variant?: "login" | "signup" | "forgot-password";
};

function WelcomePanel({ variant = "login" }: WelcomePanelProps) {
    const isSignup = variant === "signup";
    const isForgotPassword = variant === "forgot-password";

    const title = isSignup ? (
        <>
            Start your
            <br />
            learning{" "}
            <span className="bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">
                journey today.
            </span>
        </>
    ) : isForgotPassword ? (
        <>
            Forgot your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                password?
            </span>
        </>
    ) : (
        <>
            Welcome back!
            <br />
            Let's keep{" "}
            <span className="bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">
                learning.
            </span>
        </>
    );

    const subtitle = isSignup
        ? "Create your account and get a personalized learning experience with AI-powered guidance, hands-on practice, and real progress."
        : isForgotPassword
          ? "No worries. We'll help you get back to learning."
          : "Continue your learning journey with personalized guidance and hands-on practice.";

    return (
        <section className="relative flex flex-col justify-start gap-6 overflow-hidden p-6 sm:p-10 lg:gap-8 lg:p-10 xl:p-12">
            <BrandLogo />

            <WelcomeMessage
                variant="hero"
                title={title}
                subtitle={subtitle}
            />

            <LearningBenefits variant={variant} />

            <LearningJourney />
        </section>
    );
}

export default WelcomePanel;