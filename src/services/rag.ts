import { useSettingsStore } from '../stores/settingsStore';
import { callLLM } from './llm';
import type { Page } from '../types';

/**
 * RAG 全文档问答
 */
export async function ragChat(
  documentId: string,
  query: string,
  allPages: Page[],
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const settings = useSettingsStore.getState().settings;

  // 尝试通过 Tauri sidecar 做向量检索
  let contextParts: string[] = [];

  if (window.__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const results: { results: { page_num: number; text: string }[] } =
        await invoke('search_rag', {
          documentId,
          query,
          topK: 4,
        });
      contextParts = results.results.map(
        (r) => `[第${r.page_num}页] ${r.text}`
      );
    } catch {
      // sidecar 不可用时回退到简单关键词匹配
      console.warn('RAG search unavailable, using fallback');
    }
  }

  // 回退：简单关键词匹配
  if (contextParts.length === 0) {
    const keywords = query.split(/[\s,，。！？]+/).filter((k) => k.length > 1);
    const scored = allPages
      .map((page) => {
        const text = `${page.extractedText} ${page.speakerNotes} ${page.explanation || ''}`;
        const score = keywords.reduce(
          (s, kw) => s + (text.toLowerCase().includes(kw.toLowerCase()) ? 1 : 0),
          0
        );
        return { page, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    contextParts = scored.map(
      (s) => `[第${s.page.pageNumber}页] ${s.page.extractedText}`
    );
  }

  const context = contextParts.length > 0
    ? contextParts.join('\n\n')
    : '（未找到相关页面内容，请基于你的知识回答）';

  const messages = [
    { role: 'system', content: settings.chatSystemPrompt },
    {
      role: 'user',
      content: `参考以下课件内容回答问题：\n\n${context}\n\n问题：${query}`,
    },
  ];

  return callLLM({ messages, onChunk, signal });
}
