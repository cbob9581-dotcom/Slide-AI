import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-blue-600/30 text-gray-100 border border-blue-600/20'
            : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
        }`}
      >
        {/* 页面标记 */}
        {message.pageNumber && (
          <div className="text-[10px] text-blue-400/70 mb-1">
            📄 第 {message.pageNumber} 页
          </div>
        )}

        {/* 内容 */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-text-bottom animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
