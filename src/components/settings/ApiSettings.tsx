import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { PROVIDERS } from '../../types';
import type { ApiProvider } from '../../types';

export function ApiSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === settings.apiProvider);

  // 加载已保存的 API Key
  useEffect(() => {
    async function loadKey() {
      if (window.__TAURI_INTERNALS__) {
        try {
          const { getApiKey } = await import('../../services/tauriDocument');
          const key = await getApiKey();
          if (key) {
            setApiKeyInput('••••••••');
          }
        } catch {
          // ignore
        }
      }
    }
    loadKey();
  }, []);

  async function handleSaveKey() {
    if (!apiKeyInput || apiKeyInput === '••••••••') return;
    if (window.__TAURI_INTERNALS__) {
      try {
        const { setApiKey } = await import('../../services/tauriDocument');
        await setApiKey(apiKeyInput);
        updateSettings({ apiKey: apiKeyInput });
        setApiKeyInput('••••••••');
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 2000);
      } catch (err) {
        console.error('Failed to save API key:', err);
      }
    } else {
      // 非 Tauri 环境存本地
      updateSettings({ apiKey: apiKeyInput });
      setApiKeyInput('••••••••');
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-100">API 设置</h2>

      {/* Provider 选择 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">AI 提供商</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                updateSettings({
                  apiProvider: provider.id,
                  modelName: provider.defaultModel,
                  apiBaseUrl: provider.defaultBaseUrl,
                });
              }}
              className={`px-3 py-2.5 rounded-lg text-sm text-left border transition-colors ${
                settings.apiProvider === provider.id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="font-medium">{provider.name}</div>
              <div className="text-[10px] opacity-60 mt-0.5">
                {provider.defaultModel}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义端点 */}
      {settings.apiProvider === 'custom' && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            API 端点 URL（兼容 OpenAI 协议）
          </label>
          <input
            type="text"
            value={settings.apiBaseUrl || ''}
            onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
            placeholder="https://your-api.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
              text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      )}

      {/* Model 选择 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">模型</label>
        {currentProvider && currentProvider.models.length > 0 ? (
          <select
            value={settings.modelName}
            onChange={(e) => updateSettings({ modelName: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
              text-gray-200 focus:outline-none focus:border-blue-500/50"
          >
            {currentProvider.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={settings.modelName}
            onChange={(e) => updateSettings({ modelName: e.target.value })}
            placeholder="输入模型名称"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
              text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        )}
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          API Key
          <span className="text-xs text-gray-600 ml-2">（存储于系统钥匙串）</span>
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="输入 API Key..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
              text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={handleSaveKey}
            disabled={!apiKeyInput || apiKeyInput === '••••••••'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              keySaved
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {keySaved ? '✓ 已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
