import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { PROVIDERS } from '../../types';

export function ApiSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    if (window.__TAURI_INTERNALS__) {
      import('../../services/tauriDocument').then(({ getApiKey }) => {
        getApiKey().then((key) => { if (key) setApiKeyInput('••••••••'); }).catch(() => {});
      });
    }
  }, []);

  async function handleSaveKey() {
    if (!apiKeyInput || apiKeyInput === '••••••••') return;
    updateSettings({ apiKey: apiKeyInput });
    if (window.__TAURI_INTERNALS__) {
      import('../../services/tauriDocument').then(({ setApiKey }) => {
        setApiKey(apiKeyInput).catch(() => {});
      });
    }
    setApiKeyInput('••••••••');
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-100">🔑 API 配置</h2>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">AI 提供商</label>
        <div className="grid grid-cols-2 gap-3">
          {PROVIDERS.map((p) => {
            const active = settings.apiProvider === p.id;
            return (
              <button key={p.id} onClick={() => updateSettings({ apiProvider: p.id, modelName: p.defaultModel, apiBaseUrl: p.defaultBaseUrl })}
                className={`px-4 py-3 rounded text-sm text-left border-2 transition-all ${active ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'}`}>
                <div className={`font-semibold ${active ? 'text-blue-400' : 'text-gray-300'}`}>{p.name}</div>
                <div className="text-[11px] mt-0.5 text-gray-500">{p.defaultModel}</div>
              </button>
            );
          })}
        </div>
      </div>

      {settings.apiProvider === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">API 端点 URL</label>
          <input type="text" value={settings.apiBaseUrl || ''}
            onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
            placeholder="https://your-api.com/v1"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          <p className="text-[11px] text-gray-600 mt-1.5">需兼容 OpenAI Chat Completions 协议</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">模型</label>
        <input type="text" value={settings.modelName}
          onChange={(e) => updateSettings({ modelName: e.target.value })}
          placeholder="gpt-4o / claude-sonnet-4-5 / gemini-2.5-pro"
          className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Key <span className="text-xs text-gray-600 ml-2 font-normal">加密存储于本地</span>
        </label>
        <div className="flex gap-2">
          <input type="password" value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)} placeholder="sk-..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          <button onClick={handleSaveKey}
            disabled={!apiKeyInput || apiKeyInput === '••••••••'}
            className={`px-6 py-3 rounded text-sm font-semibold transition-all ${keySaved ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none'}`}>
            {keySaved ? '✓ 已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
