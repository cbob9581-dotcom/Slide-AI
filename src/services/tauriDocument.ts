import type { ParseResult, Document, Page } from '../types';

/**
 * 调用 Tauri commands 进行文档解析
 * 在 Tauri 环境外运行时有 mock 回退
 */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function parseDocument(
  filePath: string,
  filename: string,
  documentId: string
): Promise<{ document: Document; pages: Page[] }> {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    const result: ParseResult = await invoke('parse_document', {
      path: filePath,
      documentId,
    });

    const doc: Document = {
      id: documentId,
      filename,
      filePath,
      type: filename.endsWith('.pdf')
        ? 'pdf'
        : filename.endsWith('.pptx')
          ? 'pptx'
          : 'ppt',
      totalPages: result.total_pages,
      status: 'ready',
      parsedAt: Date.now(),
    };

    const pages: Page[] = result.pages.map((p) => ({
      id: `${documentId}-p${p.page_number}`,
      documentId,
      pageNumber: p.page_number,
      imagePath: p.image_path,
      thumbnailPath: p.thumbnail_path,
      extractedText: p.extracted_text,
      speakerNotes: p.speaker_notes,
      explainStatus: 'pending',
    }));

    return { document: doc, pages };
  }

  // 非 Tauri 环境 mock
  throw new Error('Tauri environment required for document parsing');
}

/**
 * 获取 API Key（从系统钥匙串）
 */
export async function getApiKey(): Promise<string> {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_api_key');
  }
  return '';
}

/**
 * 保存 API Key 到系统钥匙串
 */
export async function setApiKey(key: string): Promise<void> {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('set_api_key', { key });
  }
}

/**
 * 读取文件字节
 */
export async function readFileBytes(path: string): Promise<number[]> {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('read_file_bytes', { path });
  }
  throw new Error('Tauri environment required');
}
