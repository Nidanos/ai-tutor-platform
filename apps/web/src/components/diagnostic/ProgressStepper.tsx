import { Check } from "lucide-react";

const steps = [
  "Introduction",
  "Assessment",
  "In Progress",
  "Complete",
];

type ProgressStepperProps = {
  currentStep?: number;
};

export default function ProgressStepper({
  currentStep = 1,
}: ProgressStepperProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl items-start">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isReached = stepNumber <= currentStep;

        return (
          <div
            key={step}
            className="relative flex flex-1 flex-col items-center"
          >
            {index < steps.length - 1 && (
              <div className="absolute left-1/2 top-5 h-0.5 w-full bg-indigo-300/20">
                <div
                  className={`h-full transition-all duration-500 ${
                    stepNumber < currentStep
                      ? "w-full bg-violet-500"
                      : "w-0"
                  }`}
                />
              </div>
            )}

            <div
              className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ${
                isCompleted
                  ? "border-violet-500 bg-violet-500 text-white"
                  : isActive
                    ? "border-violet-400 bg-violet-500 text-white ring-2 ring-violet-400/30"
                    : "border-indigo-300/50 bg-[#202454] text-white"
              }`}
            >
              {isCompleted ? <Check size={20} /> : stepNumber}
            </div>

            <span
              className={`mt-3 text-center text-xs transition-colors sm:text-sm ${
                isReached
                  ? "font-semibold text-white"
                  : "text-indigo-200"
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}