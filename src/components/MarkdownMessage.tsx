import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-bold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="my-2 whitespace-pre-wrap leading-6 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-6">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-violet-400 pl-3 text-slate-600 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-violet-700 dark:bg-slate-800 dark:text-violet-300">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
  table: ({ children }) => (
    <table className="my-3 block w-full overflow-x-auto border-collapse text-left text-xs">
      {children}
    </table>
  ),
  th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-bold dark:border-slate-700 dark:bg-slate-900">{children}</th>,
  td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top dark:border-slate-700">{children}</td>,
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
    components={markdownComponents}
  >
    {content}
  </ReactMarkdown>
);
