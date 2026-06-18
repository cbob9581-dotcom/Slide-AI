import { useDocumentStore } from '../stores/documentStore';
import { useSettingsStore } from '../stores/settingsStore';
import { callLLM, callLLMNonStreaming } from './llm';
import type { Page } from '../types';

/**
 * 将本地图片路径转为 base64 data URL
 */
async function pageImageToBase64(imagePath: string): Promise<string> {
  // 在 Tauri 环境中，通过 invoke 读取文件
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes: number[] = await invoke('read_file_bytes', { path: imagePath });
    const mime = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const base64 = btoa(String.fromCharCode(...bytes));
    return `data:${mime};base64,${base64}`;
  }
  // fallback: 浏览器环境
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 构建讲解提示词
 */
function buildExplainPrompt(
  page: Page,
  prevSummary: string,
  s: ReturnType<typeof useSettingsStore.getState>['settings']
): string {
  const styleMap: Record<string, string> = {
    vivid: '生动通俗，多用类比和例子',
    exam: '突出考点，标出重点和易错点',
    quick: '简洁概括，不超过200字',
  };
  const langHint = s.language === 'en'
    ? 'Please output in English.'
    : '请用中文输出。';

  return `
页面文字：${page.extractedText || '（无文字）'}
${page.speakerNotes ? `演讲者备注：${page.speakerNotes}` : ''}
${prevSummary ? `前一页内容：${prevSummary}` : ''}
讲解风格：${styleMap[s.explainStyle] || styleMap.vivid}
${langHint}
请用 Markdown 格式输出讲解。
`.trim();
}

/**
 * 生成单页讲解
 */
export async function generateExplanation(
  page: Page,
  prevSummary: string,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<{ explanation: string; summary: string }> {
  const settings = useSettingsStore.getState().settings;

  // 构建多模态消息（图片 + 文本）
  let imageBase64: string | null = null;
  try {
    imageBase64 = await pageImageToBase64(page.imagePath);
  } catch {
    // 图片读取失败，只用文字
    console.warn('Failed to load page image, using text only');
  }

  const userContent: unknown[] = [];

  if (imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imageBase64 },
    });
  }

  userContent.push({
    type: 'text',
    text: buildExplainPrompt(page, prevSummary, settings),
  });

  const messages = [
    { role: 'system', content: settings.explainPromptTemplate },
    { role: 'user', content: userContent },
  ];

  const explanation = await callLLM({ messages, onChunk, signal });

  // 生成本页摘要（给下一页用，非流式）
  let summary = '';
  try {
    summary = await callLLMNonStreaming([
      {
        role: 'user',
        content: `用2句话总结这页的核心内容：\n${page.extractedText}`,
      },
    ]);
  } catch {
    // 摘要生成失败不阻塞
    console.warn('Failed to generate page summary');
  }

  return { explanation, summary };
}

/**
 * 单页对话
 */
export async function singlePageChat(
  page: Page,
  question: string,
  history: { role: string; content: string }[],
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const settings = useSettingsStore.getState().settings;

  const pageContext = `当前第 ${page.pageNumber} 页内容：
文字：${page.extractedText || '（无文字）'}
${page.speakerNotes ? `演讲者备注：${page.speakerNotes}` : ''}
${page.explanation ? `AI讲解：${page.explanation}` : ''}`;

  const messages = [
    { role: 'system', content: settings.chatSystemPrompt },
    { role: 'user', content: pageContext },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  return callLLM({ messages, onChunk, signal });
}

/**
 * 预生成队列 —— 并行滑动窗口
 * 用户在页 N 时，同时并行预生成 N+1 到 N+K 页
 */
const preGenRunning = new Map<string, AbortController>();

export function cancelPreGenerate() {
  preGenRunning.forEach((ctrl) => ctrl.abort());
  preGenRunning.clear();
}

export async function triggerPreGenerate(
  currentPage: number,
  aheadCount: number
): Promise<void> {
  if (aheadCount <= 0) return;

  const { pages, updatePage } = useDocumentStore.getState();

  // 计算滑动窗口：当前页之后的 aheadCount 页
  const targets: { idx: number; page: Page; prevSummary: string }[] = [];
  for (let offset = 1; offset <= aheadCount; offset++) {
    const idx = currentPage - 1 + offset;
    if (idx >= pages.length) break;
    const page = pages[idx];
    if (page.explainStatus === 'done' || page.explainStatus === 'generating') continue;
    const prev = pages[idx - 1];
    targets.push({ idx, page, prevSummary: prev?.summary ?? '' });
  }

  if (targets.length === 0) return;

  // 并行发起所有预生成请求
  await Promise.all(targets.map(async ({ page, prevSummary }) => {
    const ctrl = new AbortController();
    preGenRunning.set(page.id, ctrl);

    try {
      updatePage(page.id, { explainStatus: 'generating' });

      const { explanation, summary } = await generateExplanation(
        page, prevSummary, () => {}, ctrl.signal
      );

      updatePage(page.id, { explanation, summary, explainStatus: 'done' });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        updatePage(page.id, { explainStatus: 'failed' });
      }
    } finally {
      preGenRunning.delete(page.id);
    }
  }));
}
