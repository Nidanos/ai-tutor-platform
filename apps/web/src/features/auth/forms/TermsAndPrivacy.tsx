import Link from "next/link";

function TermsAndPrivacy() {
    return (
        <p className="text-sm text-indigo-200">
            By continuing, you agree to our{" "}
            <Link
                href="/terms"
                className="text-emerald-400 transition hover:text-emerald-300"
            >
                Terms of Service
            </Link>
            {" "}and{" "}
            <Link
                href="/privacy"
                className="text-emerald-400 transition hover:text-emerald-300"
            >
                Privacy Policy
            </Link>
            .
        </p>
    );
}

export default TermsAndPrivacy;