import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_EXPLAIN_PROMPT, DEFAULT_CHAT_SYSTEM_PROMPT } from '../../types';
import type { ExplainStyle, Language } from '../../types';

export function PromptEditor() {
  const { settings, updateSettings } = useSettingsStore();

  const styleOptions: { value: ExplainStyle; label: string; desc: string }[] = [
    { value: 'vivid', label: '生动详细', desc: '通俗易懂，多用类比和例子' },
    { value: 'exam', label: '考点突出', desc: '标出重点、考点和易错点' },
    { value: 'quick', label: '简洁概括', desc: '快速总结，不超过200字' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-100">提示词设置</h2>

      {/* 讲解提示词模板 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          讲解提示词模板
          <span className="text-xs text-gray-600 ml-2">
            可用变量：{'{style}'} {'{language}'}
          </span>
        </label>
        <textarea
          rows={8}
          value={settings.explainPromptTemplate}
          onChange={(e) => updateSettings({ explainPromptTemplate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
            text-gray-200 font-mono focus:outline-none focus:border-blue-500/50
            resize-y"
        />
        <button
          onClick={() => updateSettings({ explainPromptTemplate: DEFAULT_EXPLAIN_PROMPT })}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          恢复默认
        </button>
      </div>

      {/* 对话系统提示词 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">对话系统提示词</label>
        <textarea
          rows={4}
          value={settings.chatSystemPrompt}
          onChange={(e) => updateSettings({ chatSystemPrompt: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
            text-gray-200 font-mono focus:outline-none focus:border-blue-500/50
            resize-y"
        />
        <button
          onClick={() => updateSettings({ chatSystemPrompt: DEFAULT_CHAT_SYSTEM_PROMPT })}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          恢复默认
        </button>
      </div>

      {/* 讲解风格 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">讲解风格</label>
        <div className="grid grid-cols-3 gap-2">
          {styleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ explainStyle: opt.value })}
              className={`px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                settings.explainStyle === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] opacity-60 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 语言 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">语言</label>
        <div className="flex gap-2">
          {([
            { value: 'zh' as Language, label: '中文' },
            { value: 'en' as Language, label: 'English' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ language: opt.value })}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                settings.language === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 自动讲解 */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-300">翻页自动生成讲解</label>
          <p className="text-xs text-gray-600 mt-0.5">
            切换到新页面时自动调用 AI 生成讲解
          </p>
        </div>
        <button
          onClick={() => updateSettings({ autoExplain: !settings.autoExplain })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            settings.autoExplain ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.autoExplain ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* 预生成页数 */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          预生成页数：{settings.preGenerateAhead}
          <span className="text-xs text-gray-600 ml-2">
            （翻页后自动为后 N 页生成讲解）
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={settings.preGenerateAhead}
          onChange={(e) => updateSettings({ preGenerateAhead: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>0 (禁用)</span>
          <span>5</span>
        </div>
      </div>
    </div>
  );
}
