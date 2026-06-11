/**
 * 文档加载器 — 纯前端 PDF.js 解析，图片存为 data URL
 */
import * as pdfjsLib from 'pdfjs-dist';
import type { Document, Page } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface LoadProgress {
  step: string;
  current: number;
  total: number;
}

export async function loadDocument(
  filePath: string,
  filename: string,
  docId: string,
  onProgress: (p: LoadProgress) => void
): Promise<{ document: Document; pages: Page[] }> {
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  const isPpt = filename.toLowerCase().endsWith('.ppt') || filename.toLowerCase().endsWith('.pptx');

  if (isPpt) {
    throw new Error('PPT 需要 LibreOffice + Python sidecar。\n请先将 PPT 导出为 PDF 再打开。');
  }
  if (!isPdf) {
    throw new Error('不支持的文件格式，请选择 PDF 文件');
  }

  onProgress({ step: '读取文件...', current: 0, total: 100 });
  const bytes = await readFileViaTauri(filePath);

  onProgress({ step: '解析 PDF...', current: 10, total: 100 });
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const totalPages = pdf.numPages;

  const pages: Page[] = [];
  for (let i = 1; i <= totalPages; i++) {
    onProgress({ step: `渲染第 ${i}/${totalPages} 页...`, current: i, total: totalPages });

    const pdfPage = await pdf.getPage(i);

    const textContent = await pdfPage.getTextContent();
    const extractedText = textContent.items
      .map((it: unknown) => (it as { str?: string }).str || '')
      .join(' ')
      .trim();

    const imgDataUrl = await renderToDataUrl(pdfPage, 2.0);
    const thumbDataUrl = await renderToDataUrl(pdfPage, 0.5);

    pages.push({
      id: `${docId}-p${i}`,
      documentId: docId,
      pageNumber: i,
      imagePath: imgDataUrl,
      thumbnailPath: thumbDataUrl,
      extractedText,
      speakerNotes: '',
      explainStatus: 'pending',
    });
  }

  onProgress({ step: '完成！', current: totalPages, total: totalPages });

  return {
    document: {
      id: docId, filename, filePath, type: 'pdf',
      totalPages, status: 'ready', parsedAt: Date.now(),
    },
    pages,
  };
}

async function renderToDataUrl(pdfPage: pdfjsLib.PDFPageProxy, scale: number): Promise<string> {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await pdfPage.render({
    canvasContext: ctx, viewport,
  } as unknown as Parameters<typeof pdfPage.render>[0]).promise;

  return canvas.toDataURL('image/png');
}

async function readFileViaTauri(path: string): Promise<number[]> {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<number[]>('read_file_bytes', { path });
  }
  throw new Error('Tauri 环境不可用');
}
