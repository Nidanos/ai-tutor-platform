
import Link from "next/link";

type LoginOptionsProps = {
    rememberMe: boolean;
    setRememberMe: (checked: boolean) => void;
};

function LoginOptions({
    rememberMe,
    setRememberMe,
}: LoginOptionsProps) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <label
                htmlFor="remember"
                className="flex cursor-pointer items-center gap-2 text-indigo-100"
            >
                <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                        setRememberMe(event.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer accent-violet-500"
                />
                <span>Remember me</span>
            </label>

            <Link
                href="/forgot-password"
                className="text-indigo-200 underline underline-offset-4 transition hover:text-white"
            >
                Forgot password?
            </Link>
        </div>
    );
}

export default LoginOptions;
