import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content text-xs leading-relaxed space-y-2 ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic text-slate-700 dark:text-slate-300">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
          li: ({ children }) => <li className="text-slate-700 dark:text-slate-300">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500 pl-3 my-1.5 italic text-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              {children}
            </code>
          ),
          h1: ({ children }) => <h1 className="font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-xs text-slate-900 dark:text-white mt-1 mb-0.5">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
