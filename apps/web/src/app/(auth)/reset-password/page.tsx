import LoginLayout from "@/features/auth/layout/LoginLayout";
import WelcomePanel from "@/features/auth/layout/WelcomePanel";
import ResetPasswordCard from "@/features/auth/layout/ResetPasswordCard";

export default function ResetPasswordPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="forgot-password" />
            <ResetPasswordCard />
        </LoginLayout>
    );
}
