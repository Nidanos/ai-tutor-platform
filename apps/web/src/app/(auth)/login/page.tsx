import LoginLayout from "@/features/auth/layout/LoginLayout";
import WelcomePanel from "@/features/auth/layout/WelcomePanel";
import LoginCard from "@/features/auth/layout/LoginCard";

export default function LoginPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="login" />
            <LoginCard />
        </LoginLayout>
    );
}