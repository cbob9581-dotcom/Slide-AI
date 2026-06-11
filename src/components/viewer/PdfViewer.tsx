import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
  pageNumber: number;
  scale?: number;
}

export function PdfViewer({ url, pageNumber, scale = 1.5 }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function render() {
      setLoading(true);
      setError(null);
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale });
        const canvasEl = canvas!;
        canvasEl.height = viewport.height;
        canvasEl.width = viewport.width;

        const ctx = canvasEl.getContext('2d')!;
        await page.render({
          canvasContext: ctx,
          viewport,
        } as unknown as Parameters<typeof page.render>[0]).promise;

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(`PDF 加载失败: ${(err as Error).message}`);
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url, pageNumber, scale]);

  return (
    <div className="flex-1 overflow-auto flex items-start justify-center p-2 bg-gray-950">
      {loading && !error && (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="text-red-400 text-sm p-4">{error}</div>
      )}
      <canvas ref={canvasRef} className={loading ? 'hidden' : 'shadow-lg'} />
    </div>
  );
}
