import { Marked } from "marked";

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SAFE_URL = /^(https?:|mailto:|\/|#)/i;

// Exercise and lesson text comes from the database, partly written by a model, so raw HTML shows as text
// and only web links survive: no script, event handler or javascript: URL can reach the page.
const marked = new Marked({
  async: false,
  renderer: {
    html: ({ text }) => escape(text),
    image: ({ text }) => escape(text),
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      return SAFE_URL.test(href) ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${text}</a>` : text;
    },
  },
});

type MarkdownProps = { text: string; className?: string };

export default function Markdown({ text, className = "" }: MarkdownProps) {
  return <div className={`markdown ${className}`.trim()} dangerouslySetInnerHTML={{ __html: marked.parse(text) as string }} />;
}
