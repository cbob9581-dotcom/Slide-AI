import { useSettingsStore } from '../stores/settingsStore';
import type { Settings } from '../types';

// ============ LLM 请求/响应类型 ============

interface LLMRequestParams {
  messages: { role: string; content: unknown }[];
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

// ============ 各 Provider 构建器 ============

interface RequestBuild {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function buildOpenAIRequest(s: Settings, messages: unknown[]): RequestBuild {
  return {
    url: `${s.apiBaseUrl || 'https://api.openai.com'}/v1/chat/completions`,
    headers: {
      Authorization: `Bearer ${s.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: s.modelName,
      messages,
      stream: true,
    },
  };
}

function buildAnthropicRequest(s: Settings, messages: unknown[]): RequestBuild {
  // 提取 system 消息
  const systemMsg = (messages as { role: string; content: unknown }[]).find(
    (m) => m.role === 'system'
  );
  const otherMsgs = (messages as { role: string; content: unknown }[]).filter(
    (m) => m.role !== 'system'
  );

  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': s.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: {
      model: s.modelName,
      max_tokens: 4096,
      system: systemMsg ? (systemMsg.content as string) : '',
      messages: otherMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    },
  };
}

function buildGeminiRequest(s: Settings, messages: unknown[]): RequestBuild {
  const msgs = messages as { role: string; content: unknown }[];
  // Gemini 格式转换
  const contents = msgs
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
    }));

  const systemMsg = msgs.find((m) => m.role === 'system');

  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${s.modelName}:streamGenerateContent?alt=sse&key=${s.apiKey}`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      systemInstruction: systemMsg
        ? { parts: [{ text: systemMsg.content as string }] }
        : undefined,
      contents,
      generationConfig: { temperature: 0.7 },
    },
  };
}

// ============ SSE 流式读取 ============

async function readOpenAIStream(
  response: Response,
  onChunk?: (t: string) => void
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta =
          json?.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onChunk?.(delta);
        }
      } catch {
        // 解析失败跳过
      }
    }
  }

  return full;
}

async function readAnthropicStream(
  response: Response,
  onChunk?: (t: string) => void
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta') {
          const delta = json.delta?.text || '';
          if (delta) {
            full += delta;
            onChunk?.(delta);
          }
        }
      } catch {
        // skip
      }
    }
  }

  return full;
}

async function readGeminiStream(
  response: Response,
  onChunk?: (t: string) => void
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      try {
        const json = JSON.parse(data);
        const text =
          json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          full += text;
          onChunk?.(text);
        }
      } catch {
        // skip
      }
    }
  }

  return full;
}

// ============ 主调用函数 ============

export async function callLLM(params: LLMRequestParams): Promise<string> {
  const s = useSettingsStore.getState().settings;

  const builders: Record<
    string,
    (s: Settings, m: unknown[]) => RequestBuild
  > = {
    openai: buildOpenAIRequest,
    anthropic: buildAnthropicRequest,
    gemini: buildGeminiRequest,
    custom: buildOpenAIRequest, // 兼容 OpenAI 协议
  };

  const streamReaders: Record<string, (r: Response, cb?: (t: string) => void) => Promise<string>> = {
    openai: readOpenAIStream,
    anthropic: readAnthropicStream,
    gemini: readGeminiStream,
    custom: readOpenAIStream,
  };

  const builder = builders[s.apiProvider] || builders.openai;
  const reader = streamReaders[s.apiProvider] || streamReaders.openai;

  const { url, headers, body } = builder(s, params.messages);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: params.signal,
  });

  if (!response.ok) {
    let errMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errBody = await response.text();
      errMsg += ` - ${errBody.slice(0, 200)}`;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return reader(response, params.onChunk);
}

// ============ 辅助函数 ============

export async function callLLMNonStreaming(
  messages: { role: string; content: unknown }[]
): Promise<string> {
  const s = useSettingsStore.getState().settings;

  const builder = {
    openai: buildOpenAIRequest,
    anthropic: buildAnthropicRequest,
    gemini: buildGeminiRequest,
    custom: buildOpenAIRequest,
  }[s.apiProvider] || buildOpenAIRequest;

  const { url, headers, body } = builder(s, messages);

  // 非流式
  const nonStreamBody = {
    ...body,
    stream: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(nonStreamBody),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  if (s.apiProvider === 'anthropic') {
    return json?.content?.[0]?.text || '';
  }
  if (s.apiProvider === 'gemini') {
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return json?.choices?.[0]?.message?.content || '';
}
