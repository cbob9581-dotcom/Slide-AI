import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { useDocumentStore } from '../../stores/documentStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { generateExplanation, triggerPreGenerate, cancelPreGenerate } from '../../services/explainService';
import { PanelHeader } from '../ui/PanelHeader';
import { Skeleton, BlinkCursor } from '../ui/Loading';

interface ExplainPanelProps {
  style?: React.CSSProperties;
}

export function ExplainPanel({ style }: ExplainPanelProps) {
  const { currentDoc, currentPage, pages, updatePage } = useDocumentStore();
  const settings = useSettingsStore((s) => s.settings);
  const page = pages[currentPage - 1];

  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 翻页自动生成讲解
  useEffect(() => {
    if (!page || !currentDoc) return;
    if (page.explainStatus === 'done') {
      setStreamingText('');
      return;
    }
    if (!settings.autoExplain) return;

    startGenerate();
    return () => {
      abortRef.current?.abort();
      cancelPreGenerate();
    };
  }, [page?.id]);

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingText, page?.explanation]);

  async function startGenerate() {
    if (!page) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStreamingText('');
    updatePage(page.id, { explainStatus: 'generating' });

    const prevPage = pages[currentPage - 2];
    const prevSummary = prevPage?.summary ?? '';

    try {
      const { explanation, summary } = await generateExplanation(
        page,
        prevSummary,
        (chunk) => setStreamingText((p) => p + chunk),
        abortRef.current.signal
      );

      updatePage(page.id, {
        explanation,
        summary,
        explainStatus: 'done',
      });
      setStreamingText('');

      // 预生成后续页面
      if (settings.preGenerateAhead > 0) {
        triggerPreGenerate(currentPage + 1, settings.preGenerateAhead);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Generate explanation failed:', err);
      updatePage(page.id, { explainStatus: 'failed' });
    }
  }

  const isGenerating = page?.explainStatus === 'generating';
  const content = page?.explainStatus === 'done'
    ? (page.explanation ?? '')
    : streamingText;

  if (!currentDoc) {
    return (
      <div style={style} className="flex items-center justify-center bg-gray-950 text-gray-500">
        <p className="text-sm">请先打开课件文件</p>
      </div>
    );
  }

  return (
    <div style={style} className="flex flex-col bg-gray-900 min-w-0">
      <PanelHeader
        title="AI 讲解"
        subtitle={
          page
            ? page.explainStatus === 'generating'
              ? '生成中...'
              : page.explainStatus === 'done'
                ? '已完成'
                : page.explainStatus === 'failed'
                  ? '生成失败'
                  : '待生成'
            : ''
        }
        onRegenerate={page?.explainStatus !== 'generating' ? startGenerate : undefined}
      />
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-5 prose prose-invert prose-sm max-w-none
          prose-headings:text-gray-100 prose-p:text-gray-300
          prose-strong:text-gray-100 prose-a:text-blue-400
          prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
          prose-li:text-gray-300 prose-blockquote:text-gray-400 prose-blockquote:border-l-blue-500
          prose-table:border-gray-700 prose-th:bg-gray-800 prose-td:border-gray-700"
      >
        {isGenerating && !streamingText && !page?.explanation && <Skeleton />}

        {content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        ) : !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg mb-2">📝</p>
            <p className="text-sm">
              {settings.autoExplain ? '翻页后将自动生成讲解' : '点击上方"重新生成"按钮生成讲解'}
            </p>
          </div>
        ) : null}

        {isGenerating && streamingText && <BlinkCursor />}
      </div>
    </div>
  );
}
