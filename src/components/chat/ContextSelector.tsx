interface ModeToggleProps {
  value: 'page' | 'doc';
  onChange: (mode: 'page' | 'doc') => void;
  currentPage: number;
}

export function ModeToggle({ value, onChange, currentPage }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-0.5 text-xs">
      <button
        onClick={() => onChange('page')}
        className={`px-3 py-1 rounded-md transition-colors ${
          value === 'page'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        📄 当前页 ({currentPage})
      </button>
      <button
        onClick={() => onChange('doc')}
        className={`px-3 py-1 rounded-md transition-colors ${
          value === 'doc'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        📚 全文档
      </button>
    </div>
  );
}
