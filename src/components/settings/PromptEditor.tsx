import { useSettingsStore } from '../../stores/settingsStore';
import { DEFAULT_EXPLAIN_PROMPT, DEFAULT_CHAT_SYSTEM_PROMPT } from '../../types';
import type { ExplainStyle, Language } from '../../types';

export function PromptEditor() {
  const { settings, updateSettings } = useSettingsStore();

  const styles: { value: ExplainStyle; label: string; desc: string; icon: string }[] = [
    { value: 'vivid', label: '生动详细', desc: '通俗易懂，用类比和例子讲解', icon: '🎨' },
    { value: 'exam', label: '考点突出', desc: '标出重点、考点和易错点', icon: '🎯' },
    { value: 'quick', label: '简洁概括', desc: '快速总结核心要点', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-100">📝 提示词与风格</h2>

      {/* 讲解风格 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">讲解风格</label>
        <div className="space-y-2">
          {styles.map((s) => {
            const active = settings.explainStyle === s.value;
            return (
              <button key={s.value} onClick={() => updateSettings({ explainStyle: s.value })}
                className={`w-full px-4 py-3 rounded text-sm text-left border-2 transition-all flex items-center gap-3 ${active ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'}`}>
                <span className="text-xl">{s.icon}</span>
                <div>
                  <div className={`font-semibold ${active ? 'text-blue-400' : 'text-gray-300'}`}>{s.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 语言 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">输出语言</label>
        <div className="flex gap-2">
          {([{ value: 'zh' as Language, label: '🇨🇳 中文' }, { value: 'en' as Language, label: '🇺🇸 English' }]).map((o) => (
            <button key={o.value} onClick={() => updateSettings({ language: o.value })}
              className={`flex-1 px-4 py-2.5 rounded text-sm font-medium border-2 transition-all ${settings.language === o.value ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 讲解提示词 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">讲解提示词模板</label>
          <button onClick={() => updateSettings({ explainPromptTemplate: DEFAULT_EXPLAIN_PROMPT })}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors">恢复默认</button>
        </div>
        <textarea rows={6} value={settings.explainPromptTemplate}
          onChange={(e) => updateSettings({ explainPromptTemplate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-gray-200 font-mono leading-relaxed resize-y focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all" />
        <p className="text-[11px] text-gray-600 mt-1.5">可用变量：{'{style}'} {'{language}'}</p>
      </div>

      {/* 对话提示词 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">对话系统提示词</label>
          <button onClick={() => updateSettings({ chatSystemPrompt: DEFAULT_CHAT_SYSTEM_PROMPT })}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors">恢复默认</button>
        </div>
        <textarea rows={4} value={settings.chatSystemPrompt}
          onChange={(e) => updateSettings({ chatSystemPrompt: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-gray-200 font-mono leading-relaxed resize-y focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all" />
      </div>
    </div>
  );
}
