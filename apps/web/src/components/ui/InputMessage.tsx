import { helperVariants, type InputVariant } from "./inputStyles";

type InputMessageProps = {
    id: string;
    error?: string;
    helperText?: string;
    variant: InputVariant;
};

function InputMessage({
    id,
    error,
    helperText,
    variant,
}: InputMessageProps) {
    if (error) {
        return (
            <p
                id={`${id}-error`}
                role="alert"
                className="mt-2 text-sm text-red-400"
            >
                {error}
            </p>
        );
    }

    if (!helperText) {
        return null;
    }

    return (
        <p
            id={`${id}-helper`}
            className={`mt-2 text-sm ${helperVariants[variant]}`}
        >
            {helperText}
        </p>
    );
}

export default InputMessage;