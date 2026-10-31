import LoginLayout from "@/features/auth/layout/LoginLayout";
import WelcomePanel from "@/features/auth/layout/WelcomePanel";
import SignupCard from "@/features/auth/layout/SignupCard";

export default function SignupPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="signup" />
            <SignupCard />
        </LoginLayout>
    );
}