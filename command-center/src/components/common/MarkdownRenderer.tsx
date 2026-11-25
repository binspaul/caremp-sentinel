import React, { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const INLINE_REGEX = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;

function parseInline(str: string): React.ReactNode[] {
  if (!str) return [];
  const parts = str.split(INLINE_REGEX);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={i} className="italic text-slate-700 dark:text-slate-300">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code_block'; lang: string; content: string }
  | { type: 'p'; text: string };

function parseMarkdownToBlocks(markdown: string): Block[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      flushList();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        blocks.push({
          type: 'code_block',
          lang: codeLang,
          content: codeLines.join('\n'),
        });
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push({ type: 'blockquote', text: trimmed.slice(2).trim() });
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    // Unordered List
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Standard paragraph line
    flushList();
    blocks.push({ type: 'p', text: trimmed });
  }

  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: 'code_block', lang: codeLang, content: codeLines.join('\n') });
  }

  return blocks;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const blocks = useMemo(() => parseMarkdownToBlocks(content), [content]);

  return (
    <div className={`markdown-content text-xs leading-relaxed space-y-2 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">
                {parseInline(block.text)}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={idx} className="font-bold text-xs text-slate-900 dark:text-white mt-1.5 mb-1">
                {parseInline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="font-semibold text-xs text-slate-900 dark:text-white mt-1 mb-0.5">
                {parseInline(block.text)}
              </h3>
            );
          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-emerald-500 pl-3 my-1.5 italic text-slate-600 dark:text-slate-400"
              >
                {parseInline(block.text)}
              </blockquote>
            );
          case 'hr':
            return <hr key={idx} className="my-2 border-slate-200 dark:border-slate-800" />;
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-4 space-y-1 my-1.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300">
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-4 space-y-1 my-1.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-700 dark:text-slate-300">
                    {parseInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'code_block':
            return (
              <pre
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto my-2"
              >
                <code>{block.content}</code>
              </pre>
            );
          case 'p':
          default:
            return (
              <p key={idx} className="mb-1.5 last:mb-0 text-slate-700 dark:text-slate-300">
                {parseInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
