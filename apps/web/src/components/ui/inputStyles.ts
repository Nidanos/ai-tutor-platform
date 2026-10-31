export type InputVariant = "default" | "dark";

export const inputVariants: Record<InputVariant, string> = {
    default:
        "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20",
    dark:
        "border-indigo-300/25 bg-slate-900/30 text-white placeholder:text-indigo-200/60 focus:border-violet-400 focus:ring-violet-400/20",
};

export const labelVariants: Record<InputVariant, string> = {
    default: "text-slate-700",
    dark: "text-indigo-100",
};

export const helperVariants: Record<InputVariant, string> = {
    default: "text-slate-500",
    dark: "text-indigo-200/90",
};