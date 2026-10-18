function BrandLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white to-violet-200 text-3xl text-violet-600 shadow-lg">
                ✦
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    AI Tutor
                </h2>
                <p className="text-sm text-indigo-200">
                    Learn. Build. Go Further.
                </p>
            </div>
        </div>
    );
}

export default BrandLogo;