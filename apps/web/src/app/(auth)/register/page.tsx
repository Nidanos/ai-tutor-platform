import LoginLayout from "../layout/LoginLayout";
import WelcomePanel from "../layout/WelcomePanel";
import SignupCard from "../layout/SignupCard";

export default function SignupPage() {
    return (
        <LoginLayout>
            <WelcomePanel variant="signup" />
            <SignupCard />
        </LoginLayout>
    );
}