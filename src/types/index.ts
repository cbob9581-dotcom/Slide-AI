// ============ 核心数据模型 ============

export interface Document {
  id: string;
  filename: string;
  filePath: string;
  type: 'pdf' | 'ppt' | 'pptx';
  totalPages: number;
  status: 'parsing' | 'ready' | 'failed';
  parsedAt: number;
  courseContext?: string;
}

export interface Page {
  id: string;
  documentId: string;
  pageNumber: number;
  imagePath: string;
  thumbnailPath: string;
  extractedText: string;
  speakerNotes: string;
  explanation?: string;
  explainStatus: 'pending' | 'generating' | 'done' | 'failed';
  summary?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pageNumber?: number;
  createdAt: number;
}

export interface Conversation {
  id: string;
  documentId: string;
  messages: Message[];
}

export type ApiProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';
export type ExplainStyle = 'vivid' | 'exam' | 'quick';
export type Language = 'zh' | 'en';

export interface Settings {
  apiProvider: ApiProvider;
  apiKey: string;
  apiBaseUrl?: string;
  modelName: string;
  explainPromptTemplate: string;
  chatSystemPrompt: string;
  explainStyle: ExplainStyle;
  language: Language;
  autoExplain: boolean;
  preGenerateAhead: number;
}

export interface ParseResult {
  status: string;
  total_pages: number;
  pages: {
    page_number: number;
    image_path: string;
    thumbnail_path: string;
    extracted_text: string;
    speaker_notes: string;
  }[];
}

export interface RagSearchResult {
  results: {
    page_num: number;
    text: string;
    dist?: number;
  }[];
}

// ============ Provider 配置 ============

export interface ProviderConfig {
  id: ApiProvider;
  name: string;
  models: string[];
  defaultModel: string;
  defaultBaseUrl?: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
    defaultModel: 'gpt-4o',
    defaultBaseUrl: 'https://api.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-4-5',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    defaultModel: 'gemini-2.5-pro',
  },
  {
    id: 'custom',
    name: '自定义端点',
    models: [],
    defaultModel: '',
    defaultBaseUrl: 'https://api.openai.com',
  },
];

// ============ 默认提示词 ============

export const DEFAULT_EXPLAIN_PROMPT = `你是一位优秀的老师，擅长把课件内容讲得生动易懂。
基于学生提供的幻灯片，生成一段详细讲解。
要求：用通俗语言解释核心概念，举例打比方，指出重点和易错点，解释图表和公式。
输出 Markdown 格式，合理使用标题、列表、加粗。`;

export const DEFAULT_CHAT_SYSTEM_PROMPT = `你是一个学习助手，基于课件内容回答学生的问题。
如果问题超出课件范围，可以基于你的知识回答，但要明确告知学生。
回答要简洁准确，如果合适可以用 Markdown 格式。`;

// ============ 默认设置 ============

export const DEFAULT_SETTINGS: Settings = {
  apiProvider: 'openai',
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com',
  modelName: 'gpt-4o',
  explainPromptTemplate: DEFAULT_EXPLAIN_PROMPT,
  chatSystemPrompt: DEFAULT_CHAT_SYSTEM_PROMPT,
  explainStyle: 'vivid',
  language: 'zh',
  autoExplain: true,
  preGenerateAhead: 2,
};
