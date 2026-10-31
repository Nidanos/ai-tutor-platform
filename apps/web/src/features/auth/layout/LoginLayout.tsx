import type { ReactNode } from "react";

type LoginLayoutProps = {
    children: ReactNode;
};

function LoginLayout({ children }: LoginLayoutProps) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-auth-start via-auth-mid to-auth-end p-3 text-white sm:p-5 lg:p-6">
            <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] grid-cols-1 items-stretch overflow-hidden rounded-2xl border border-white/20 bg-white/[0.03] shadow-2xl sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
                {children}
            </div>
        </main>
    );
}

export default LoginLayout;