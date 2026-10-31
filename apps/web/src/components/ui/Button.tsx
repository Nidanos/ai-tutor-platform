import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
    children,
    type = "button",
    className = "",
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            className={className}
            {...rest}
        >
            {children}
        </button>
    );
}

export default Button;