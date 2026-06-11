import { useState, useCallback } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { ResizeDivider } from '../ui/ResizeDivider';
import { ThumbnailBar } from './ThumbnailBar';
import { SlidePanel } from './SlidePanel';
import { ExplainPanel } from './ExplainPanel';
import { ChatPanel } from './ChatPanel';
import type { LoadProgress } from '../../services/documentLoader';

export function MainLayout() {
  const { currentDoc } = useDocumentStore();
  const [splitH, setSplitH] = useState(65); // 上方区域占百分比
  const [splitV, setSplitV] = useState(50); // 左右各占百分比

  const handleSplitH = useCallback((v: number) => setSplitH(v), []);
  const handleSplitV = useCallback((v: number) => setSplitV(v), []);

  if (!currentDoc) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* 左侧缩略图栏 */}
      <ThumbnailBar />

      {/* 右侧主区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 上方：双栏 —— 原课件 | AI讲解 */}
        <div className="flex min-h-0" style={{ height: `${splitH}%` }}>
          <SlidePanel style={{ width: `${splitV}%` }} />
          <ResizeDivider onDrag={handleSplitV} />
          <ExplainPanel style={{ width: `${100 - splitV}%` }} />
        </div>

        {/* 拖拽条 */}
        <ResizeDivider horizontal onDrag={handleSplitH} />

        {/* 下方：对话框 */}
        <div style={{ height: `${100 - splitH}%` }}>
          <ChatPanel style={{ height: '100%' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * 欢迎页 —— 没有打开文档时显示
 */
function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleOpenFile = async () => {
    if (!window.__TAURI_INTERNALS__) return;
    setError(null);

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{ name: '课件文件', extensions: ['pdf', 'ppt', 'pptx'] }],
      });

      if (!selected) return;

      const filePath = typeof selected === 'string' ? selected : (selected as { path: string }).path;
      const filename = filePath.split(/[/\\]/).pop() || 'unknown';
      const docId = `doc-${Date.now()}`;

      // 开始加载
      setLoading(true);
      setProgress({ step: '准备中...', current: 0, total: 0 });

      const store = useDocumentStore.getState();
      store.setDocument({
        id: docId,
        filename,
        filePath,
        type: filename.endsWith('.pdf') ? 'pdf' : filename.endsWith('.pptx') ? 'pptx' : 'ppt',
        status: 'parsing',
        totalPages: 0,
        parsedAt: Date.now(),
      });

      const { loadDocument } = await import('../../services/documentLoader');
      const { document, pages } = await loadDocument(filePath, filename, docId, (p) => setProgress({ ...p }));

      store.setDocument(document);
      store.setPages(pages);
      setLoading(false);
      setProgress(null);
    } catch (err) {
      setLoading(false);
      setProgress(null);
      setError((err as Error).message || '未知错误');
      useDocumentStore.getState().clearDocument();
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  // ====== 加载中状态 ======
  if (loading) {
    const pct = progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100 gap-6">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-lg text-gray-300 font-medium">{progress?.step || '正在处理...'}</p>
        {progress && progress.total > 0 && (
          <div className="w-80">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====== 错误状态 ======
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100 gap-6">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold text-red-400">打开失败</h2>
        <p className="text-gray-400 text-sm text-center max-w-md whitespace-pre-wrap">{error}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => setError(null)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            重新选择
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
            className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
          >
            ⚙️ 设置
          </button>
        </div>
      </div>
    );
  }

  // ====== 正常欢迎页 ======
  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={`flex flex-col items-center gap-6 p-12 rounded-2xl border-2 border-dashed transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 bg-gray-900/50'
        }`}
      >
        <div className="text-6xl">📖</div>
        <h1 className="text-2xl font-bold text-gray-100">Slide AI</h1>
        <p className="text-gray-400 text-sm text-center max-w-md">
          智能课件学习助手 — 打开 PDF 或 PPT 课件，
          <br />
          AI 将为你逐页生成生动讲解
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleOpenFile}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            打开课件文件
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
            className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium
              hover:bg-gray-700 transition-colors border border-gray-700"
          >
            ⚙️ 设置
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          支持 PDF、PPT、PPTX 格式 · 也可拖放文件到窗口
        </p>
      </div>
    </div>
  );
}
