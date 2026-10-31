import {
    BarChart3,
    Code2,
    GraduationCap,
    ShieldCheck,
    BookOpen,
    Zap,
} from "lucide-react";

type LearningBenefitsProps = {
    variant?: "login" | "signup" | "forgot-password";
};

const loginBenefits = [
    {
        title: "Track Real Progress",
        subtitle: "See how far you've come",
        Icon: BarChart3,
    },
    {
        title: "Practice with Purpose",
        subtitle: "Build skills by doing",
        Icon: Code2,
    },
    {
        title: "Learn at Your Pace",
        subtitle: "AI-powered, always with you",
        Icon: GraduationCap,
    },
];

const signupBenefits = [
    {
        title: "Personalized Learning",
        subtitle: "A path that adapts to you",
        Icon: GraduationCap,
    },
    {
        title: "Hands-on Practice",
        subtitle: "Write, run, and learn by doing",
        Icon: Code2,
    },
    {
        title: "Track Your Progress",
        subtitle: "See real improvement over time",
        Icon: BarChart3,
    },
];

const forgotPasswordBenefits = [
    {
        title: "Your progress stays safe",
        subtitle: "All your data and achievements are secure.",
        Icon: ShieldCheck,
    },
    {
        title: "Your learning journey is waiting",
        subtitle: "Pick up right where you left off.",
        Icon: BookOpen,
    },
    {
        title: "Get back to learning in a few steps",
        subtitle: "A quick and easy recovery process.",
        Icon: Zap,
    },
];

function LearningBenefits({
    variant = "login",
}: LearningBenefitsProps) {
    const benefits =
        variant === "signup"
            ? signupBenefits
            : variant === "forgot-password"
              ? forgotPasswordBenefits
              : loginBenefits;

    return (
        <div className="space-y-5">
            {benefits.map(({ title, subtitle, Icon }) => (
                <div key={title} className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-indigo-400/20">
                        <Icon size={26} />
                    </div>

                    <div>
                        <h3 className="font-semibold">{title}</h3>

                        <p className="mt-1 text-sm text-indigo-200">
                            {subtitle}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LearningBenefits;