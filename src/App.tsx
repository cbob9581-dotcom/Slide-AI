import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ApiSettings } from './components/settings/ApiSettings';
import { PromptEditor } from './components/settings/PromptEditor';

type View = 'main' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('main');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'settings') setView('settings');
      if (detail === 'main') setView('main');
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />;
  }

  return <MainLayout />;
}

function SettingsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen bg-gray-950 text-gray-100 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
            >
              ← 返回
            </button>
            <h1 className="text-lg font-semibold text-gray-100">设置</h1>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        <ApiSettings />
        <div className="border-t border-gray-800" />
        <PromptEditor />
      </div>
    </div>
  );
}
