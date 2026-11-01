import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
};

export default function CodeEditor({
  value,
  onChange,
  height = "420px",
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-panel">
      <Editor
        height={height}
        language="cpp"
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 23,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          padding: {
            top: 16,
            bottom: 16,
          },
          tabSize: 4,
          insertSpaces: true,
          renderLineHighlight: "line",
          roundedSelection: true,
          cursorBlinking: "smooth",
          fontFamily: "Consolas, 'Courier New', monospace",
        }}
      />
    </div>
  );
}