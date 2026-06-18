import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ApiSettings } from './components/settings/ApiSettings';
import { PromptEditor } from './components/settings/PromptEditor';
import { useSettingsStore } from './stores/settingsStore';

type View = 'main' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('main');
  const { settings, updateSettings } = useSettingsStore();

  useEffect(() => {
    const html = document.documentElement;
    if (settings.theme === 'light') html.classList.add('light');
    else html.classList.remove('light');
    if (window.__TAURI_INTERNALS__) {
      import('./services/tauriDocument').then(({ getApiKey }) => {
        getApiKey().then((key) => {
          if (key && key !== settings.apiKey) updateSettings({ apiKey: key });
        }).catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (settings.theme === 'light') html.classList.add('light');
    else html.classList.remove('light');
  }, [settings.theme]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'settings') setView('settings');
      if (detail === 'main') setView('main');
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  if (view === 'settings') return <SettingsPage onBack={() => setView('main')} />;
  return <MainLayout />;
}

function SettingsPage({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useSettingsStore();
  return (
    <div className="h-screen bg-gray-950 text-gray-100 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack}
              className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white text-sm font-medium">
              ← 返回主页
            </button>
            <h1 className="text-xl font-bold">⚙️ 设置</h1>
          </div>
          <button onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="w-10 h-10 rounded bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center text-lg"
            title={settings.theme === 'dark' ? '切换浅色' : '切换深色'}>
            {settings.theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900 rounded p-7 border border-gray-800"><ApiSettings /></div>
        <div className="bg-gray-900 rounded p-7 border border-gray-800"><PromptEditor /></div>
        <div className="lg:col-span-2 bg-gray-900 rounded p-7 border border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 mb-5">⚡ 讲解行为</h2>
          <AutoExplainSettings />
        </div>
      </div>
    </div>
  );
}

function AutoExplainSettings() {
  const { settings, updateSettings } = useSettingsStore();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-200">翻页自动生成讲解</p>
          <p className="text-xs text-gray-500 mt-0.5">切换到新页面时自动调用 AI</p>
        </div>
        <button onClick={() => updateSettings({ autoExplain: !settings.autoExplain })}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${settings.autoExplain ? 'bg-blue-600' : 'bg-gray-700'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.autoExplain ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-200">预生成页数</p>
          <span className="text-base font-bold text-blue-400">{settings.preGenerateAhead}</span>
        </div>
        <input type="range" min={0} max={5} step={1} value={settings.preGenerateAhead}
          onChange={(e) => updateSettings({ preGenerateAhead: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500" />
        <div className="flex justify-between text-[11px] text-gray-600 mt-1.5">
          <span>关闭</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
    </div>
  );
}
