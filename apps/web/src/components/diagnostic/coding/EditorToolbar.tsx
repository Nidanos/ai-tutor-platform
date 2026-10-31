import { Send } from "lucide-react";

type EditorToolbarProps = {
  onSubmit: () => void;
  disabled?: boolean;
};

export default function EditorToolbar({
  onSubmit,
  disabled = false,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-end border-b border-white/10 bg-[#151d32] px-4 py-3">
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={15} />
        {disabled ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
