import type { InputHTMLAttributes, ReactNode } from "react";
import InputMessage from "./InputMessage";
import {
    inputVariants,
    labelVariants,
    type InputVariant,
} from "./inputStyles";

type InputProps = {
    label: string;
    error?: string;
    helperText?: string;
    startIcon?: ReactNode;
    endAdornment?: ReactNode;
    variant?: InputVariant;
} & InputHTMLAttributes<HTMLInputElement>;

function Input({
    label, error, helperText, startIcon, endAdornment, id,
    className = "", variant = "default", ...rest
}: InputProps) {
    const inputId = id ?? rest.name;
    if (!inputId) throw new Error("Input requires an id or name.");

    const describedBy = error
        ? `${inputId}-error`
        : helperText ? `${inputId}-helper` : undefined;

    return (
        <div className="w-full">
            <label htmlFor={inputId}
                className={`mb-2 block text-sm font-medium ${
                     variant === "default"
                     ? "text-indigo-100"
                     : labelVariants[variant]
                     }`}>
                {label}
            </label>
            <div className="relative">
                {startIcon && (
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-indigo-200">
                        {startIcon}
                    </span>
                )}
                <input
                    {...rest}
                    id={inputId}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className={`w-full rounded-xl border border-indigo-300/25 bg-white/5 py-3 pr-12 text-sm text-white placeholder:text-indigo-200/70 ${
                     startIcon ? "pl-11" : "pl-4"
                         } outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                    inputVariants[variant]
                    } ${error ? "border-red-400" : ""} ${className}`}
                />
                {endAdornment && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                    {endAdornment}
                    </div>
                )}
            </div>
            <InputMessage id={inputId} error={error}
                helperText={helperText} variant={variant} />
        </div>
    );
}

export default Input;