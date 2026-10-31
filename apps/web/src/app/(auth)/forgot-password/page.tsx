import LoginLayout from "@/features/auth/layout/LoginLayout";
import WelcomePanel from "@/features/auth/layout/WelcomePanel";
import ForgotPasswordCard from "@/features/auth/layout/ForgotPasswordCard";

export default function ForgotPasswordPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="forgot-password" />
            <ForgotPasswordCard />
        </LoginLayout>
    );
}