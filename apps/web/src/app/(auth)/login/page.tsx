import LoginLayout from "../layout/LoginLayout";
import WelcomePanel from "../layout/WelcomePanel";
import LoginCard from "../layout/LoginCard";

export default function LoginPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="login" />
            <LoginCard />
        </LoginLayout>
    );
}