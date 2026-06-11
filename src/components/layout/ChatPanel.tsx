import { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';
import { ragChat } from '../../services/rag';
import { singlePageChat } from '../../services/explainService';
import { MessageBubble } from '../chat/MessageBubble';
import { ModeToggle } from '../chat/ContextSelector';

interface ChatPanelProps {
  style?: React.CSSProperties;
}

export function ChatPanel({ style }: ChatPanelProps) {
  const { currentDoc, currentPage, pages } = useDocumentStore();
  const settings = useSettingsStore((s) => s.settings);

  const {
    activeConversationId,
    setActiveConversation,
    getMessages,
    addMessage,
    updateMessage,
    startStreaming,
    appendStreaming,
    stopStreaming,
    streamingMessageId,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'page' | 'doc'>('page');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = getMessages();

  // 切换文档时切换对话
  useEffect(() => {
    if (currentDoc?.id && currentDoc.id !== activeConversationId) {
      setActiveConversation(currentDoc.id);
    }
  }, [currentDoc?.id]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');

    // 添加用户消息
    addMessage({
      role: 'user',
      content: question,
      pageNumber: mode === 'page' ? currentPage : undefined,
    });

    setLoading(true);
    abortRef.current = new AbortController();

    let answer = '';
    const assistantId = addMessage({
      role: 'assistant',
      content: '',
      pageNumber: undefined,
    });

    startStreaming(assistantId);

    try {
      if (mode === 'doc') {
        // RAG 全文档模式
        await ragChat(
          currentDoc!.id,
          question,
          pages,
          (chunk) => {
            answer += chunk;
            appendStreaming(assistantId, chunk);
          },
          abortRef.current.signal
        );
      } else {
        // 单页模式
        const page = pages[currentPage - 1];
        if (!page) throw new Error('当前页不存在');

        await singlePageChat(
          page,
          question,
          messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          (chunk) => {
            answer += chunk;
            appendStreaming(assistantId, chunk);
          },
          abortRef.current.signal
        );
      }

      updateMessage(assistantId, answer);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        updateMessage(assistantId, answer + '\n\n*（生成已停止）*');
      } else {
        updateMessage(
          assistantId,
          answer + `\n\n*（出错了：${(err as Error).message}）*`
        );
      }
    } finally {
      setLoading(false);
      stopStreaming();
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!currentDoc) {
    return (
      <div style={style} className="flex items-center justify-center bg-gray-950 text-gray-500">
        <p className="text-sm">请先打开课件文件</p>
      </div>
    );
  }

  return (
    <div style={style} className="flex flex-col h-full bg-gray-950 min-h-0">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm space-y-2">
            <p className="text-2xl">💬</p>
            <p>开始提问吧！</p>
            <p className="text-xs">
              你可以针对当前页或整份课件提问
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble key={msg.id} message={msg} isStreaming={msg.id === streamingMessageId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        {/* 模式切换 */}
        <div className="flex items-center justify-between px-3 pt-2">
          <ModeToggle value={mode} onChange={setMode} currentPage={currentPage} />
          {messages.length > 0 && (
            <button
              onClick={() => {
                useChatStore.getState().clearConversation(currentDoc!.id);
              }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              清空对话
            </button>
          )}
        </div>

        {/* 输入框 */}
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'page'
                ? `问关于第 ${currentPage} 页的问题...`
                : '问关于整份课件的问题...'
            }
            className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
              text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50
              transition-colors"
            rows={2}
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleStop}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600/20 text-red-400
                hover:bg-red-600/30 border border-red-600/30 transition-colors flex-shrink-0"
            >
              停止
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white
                hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex-shrink-0"
            >
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
