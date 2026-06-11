import { useDocumentStore } from '../../stores/documentStore';
import { useState, useEffect } from 'react';

interface ThumbnailBarProps {
  className?: string;
}

export function ThumbnailBar({ className = '' }: ThumbnailBarProps) {
  const { pages, currentPage, setCurrentPage } = useDocumentStore();
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);

  // 键盘翻页
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPage(Math.max(1, currentPage - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentPage(Math.min(pages.length, currentPage + 1));
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage(Math.max(1, currentPage - 5));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage(Math.min(pages.length, currentPage + 5));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(pages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, setCurrentPage]);

  return (
    <div
      className={`flex flex-col bg-gray-900 border-r border-gray-800 overflow-hidden ${className}`}
      style={{ width: 140 }}
    >
      {/* 标题 */}
      <div className="px-3 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-400 font-medium">缩略图</p>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {currentPage} / {pages.length}
        </p>
      </div>

      {/* 缩略图列表 */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {pages.map((page) => {
          const isActive = page.pageNumber === currentPage;
          const isHovered = page.pageNumber === hoveredPage;
          const hasExplanation =
            page.explainStatus === 'done';
          const isGenerating =
            page.explainStatus === 'generating';

          return (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.pageNumber)}
              onMouseEnter={() => setHoveredPage(page.pageNumber)}
              onMouseLeave={() => setHoveredPage(null)}
              className={`w-full text-left rounded-lg overflow-hidden transition-all duration-150 border-2 ${
                isActive
                  ? 'border-blue-500 shadow-md shadow-blue-500/20'
                  : 'border-transparent hover:border-gray-700'
              }`}
            >
              <div className="relative aspect-[4/3] bg-gray-800">
                <img
                  src={page.thumbnailPath}
                  alt={`第 ${page.pageNumber} 页`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* 状态标记 */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {hasExplanation && (
                    <span className="w-2 h-2 rounded-full bg-green-500" title="已生成讲解" />
                  )}
                  {isGenerating && (
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="生成中" />
                  )}
                </div>
                {/* 页码 */}
                <div
                  className={`absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[10px] text-center ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-black/60 text-gray-300'
                  }`}
                >
                  {page.pageNumber}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
