import type { ReactNode } from 'react';

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onRegenerate?: () => void;
}

export function PanelHeader({ title, subtitle, actions, onRegenerate }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-2 py-1 text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            title="重新生成"
          >
            ↻ 重新生成
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
