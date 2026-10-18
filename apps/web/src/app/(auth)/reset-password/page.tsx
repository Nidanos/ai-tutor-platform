import LoginLayout from "../layout/LoginLayout";
import WelcomePanel from "../layout/WelcomePanel";
import ResetPasswordCard from "../layout/ResetPasswordCard";

export default function ResetPasswordPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="forgot-password" />
            <ResetPasswordCard />
        </LoginLayout>
    );
}
