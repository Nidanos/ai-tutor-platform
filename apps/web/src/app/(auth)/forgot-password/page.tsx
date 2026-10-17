import LoginLayout from "../layout/LoginLayout";
import WelcomePanel from "../layout/WelcomePanel";
import ForgotPasswordCard from "../layout/ForgotPasswordCard";

export default function ForgotPasswordPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="forgot-password" />
            <ForgotPasswordCard />
        </LoginLayout>
    );
}