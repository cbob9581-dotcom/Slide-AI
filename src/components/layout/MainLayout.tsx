import { useState, useCallback } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ResizeDivider } from '../ui/ResizeDivider';
import { ThumbnailBar } from './ThumbnailBar';
import { SlidePanel } from './SlidePanel';
import { ExplainPanel } from './ExplainPanel';
import { ChatPanel } from './ChatPanel';
import type { LoadProgress } from '../../services/documentLoader';

export function MainLayout() {
  const { currentDoc, clearDocument, currentPage: _cp } = useDocumentStore();
  const { settings, updateSettings } = useSettingsStore();
  const [splitH, setSplitH] = useState(65);
  const [splitV, setSplitV] = useState(50);

  const handleSplitH = useCallback((v: number) => setSplitH(v), []);
  const handleSplitV = useCallback((v: number) => setSplitV(v), []);

  if (!currentDoc) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* ====== 顶部工具栏：设置 + 主题 + 关闭 ====== */}
      <header className="flex items-center justify-between px-5 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold truncate max-w-md">
            📖 {currentDoc.filename}
          </span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
            {useDocumentStore.getState().currentPage}/{currentDoc.totalPages}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="w-9 h-9 rounded hover:bg-gray-800 transition-colors flex items-center justify-center text-base"
            title={settings.theme === 'dark' ? '切换浅色' : '切换深色'}>
            {settings.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
            className="w-9 h-9 rounded hover:bg-gray-800 transition-colors flex items-center justify-center text-base"
            title="设置">
            ⚙️
          </button>
          <button
            onClick={clearDocument}
            className="w-9 h-9 rounded hover:bg-red-900/40 transition-colors flex items-center justify-center text-sm text-gray-500 hover:text-red-400"
            title="关闭当前课件，回到首页">
            ✕
          </button>
        </div>
      </header>

      {/* ====== 主区域 ====== */}
      <div className="flex flex-1 min-h-0">
        <ThumbnailBar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex min-h-0" style={{ height: `${splitH}%` }}>
            <SlidePanel style={{ width: `${splitV}%` }} />
            <ResizeDivider onDrag={handleSplitV} />
            <ExplainPanel style={{ width: `${100 - splitV}%` }} />
          </div>
          <ResizeDivider horizontal onDrag={handleSplitH} />
          <div style={{ height: `${100 - splitH}%` }}>
            <ChatPanel style={{ height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** ====== 欢迎页 ====== */
function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { settings, updateSettings } = useSettingsStore();

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
      setLoading(true);
      setProgress({ step: '准备中...', current: 0, total: 0 });
      const store = useDocumentStore.getState();
      store.setDocument({
        id: docId, filename, filePath,
        type: filename.endsWith('.pdf') ? 'pdf' : filename.endsWith('.pptx') ? 'pptx' : 'ppt',
        status: 'parsing', totalPages: 0, parsedAt: Date.now(),
      });
      const { loadDocument } = await import('../../services/documentLoader');
      const { document, pages } = await loadDocument(filePath, filename, docId, (p) => setProgress({ ...p }));
      store.setDocument(document);
      store.setPages(pages);
      setLoading(false);
      setProgress(null);
    } catch (err) {
      setLoading(false); setProgress(null);
      setError((err as Error).message || '未知错误');
      useDocumentStore.getState().clearDocument();
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  if (loading) {
    const pct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 gap-6">
        <div className="w-14 h-14 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-lg text-gray-300 font-medium">{progress?.step || '处理中...'}</p>
        {progress && progress.total > 0 && (
          <div className="w-80">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progress.current} / {progress.total}</span><span>{pct}%</span>
            </div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 gap-6">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold text-red-400">打开失败</h2>
        <p className="text-gray-400 text-sm text-center max-w-md whitespace-pre-wrap">{error}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setError(null)}
            className="px-7 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30">重新选择</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
            className="px-7 py-3 bg-gray-800 text-gray-300 rounded font-semibold hover:bg-gray-700 transition-colors border border-gray-700">⚙️ 设置</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-950" onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      <div className={`flex flex-col items-center gap-6 p-12 rounded border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 bg-gray-900/50'}`}>
        <div className="text-6xl">📖</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Slide AI</h1>
        <p className="text-gray-400 text-sm text-center max-w-md leading-relaxed">
          智能课件学习助手 — 打开 PDF 或 PPT 课件，<br />AI 将为你逐页生成生动讲解
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={handleOpenFile}
            className="px-8 py-3.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.98]">
            📂 打开课件文件
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
            className="px-8 py-3.5 bg-gray-800 text-gray-300 rounded font-semibold hover:bg-gray-700 transition-all border border-gray-700">
            ⚙️ 设置
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">支持 PDF、PPT、PPTX 格式 · 也可拖放文件到窗口</p>
      </div>
    </div>
  );
}
