type DiagnosticHeaderProps = {
  userName: string;
};

export default function DiagnosticHeader({ userName }: DiagnosticHeaderProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl text-indigo-600">
          ✦
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AI Tutor</h1>
          <p className="text-sm text-indigo-200">Learn. Build. Go Further.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white">{userName}</span>
        <span
          aria-label={`Profile for ${userName}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-lg text-white"
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
