import type { ReactNode } from "react";

type WelcomeMessageProps = {
    title: ReactNode;
    subtitle: string;
    variant?: "hero" | "card";
};

function WelcomeMessage({
    title,
    subtitle,
    variant = "card",
}: WelcomeMessageProps) {
    const isHero = variant === "hero";

    return (
        <div className={isHero ? "mt-4" : ""}>
            <h1
                className={
                    isHero
                        ? "max-w-xl text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
                        : "text-3xl font-bold tracking-tight text-white sm:text-4xl"
                }
            >
                {title}
            </h1>

            <p
                className={`mt-3 leading-relaxed text-indigo-200 ${
                    isHero
                        ? "max-w-lg text-base sm:text-lg"
                        : "text-sm sm:text-base"
                }`}
            >
                {subtitle}
            </p>
        </div>
    );
}

export default WelcomeMessage;