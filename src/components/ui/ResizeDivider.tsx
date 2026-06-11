import { useCallback, useRef, useEffect } from 'react';

interface ResizeDividerProps {
  onDrag: (value: number) => void;
  horizontal?: boolean;
}

export function ResizeDivider({ onDrag, horizontal = false }: ResizeDividerProps) {
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = horizontal ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [horizontal]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const newValue = horizontal
        ? ((e.clientY - rect.top) / rect.height) * 100
        : ((e.clientX - rect.left) / rect.width) * 100;
      onDrag(Math.max(15, Math.min(85, newValue)));
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [horizontal, onDrag]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`flex-shrink-0 bg-gray-800 hover:bg-blue-600 transition-colors cursor-${
        horizontal ? 'row' : 'col'
      }-resize ${horizontal ? 'h-1 w-full' : 'w-1 h-full'}`}
    />
  );
}
