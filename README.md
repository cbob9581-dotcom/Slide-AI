# Slide AI — 智能课件学习助手

基于 **Tauri 2.x** 桌面应用，左侧展示原始课件（PDF/PPT），右侧由 AI 逐页生成生动讲解，底部支持单页/全文档问答。

## 技术栈

| 层 | 选型 |
|---|---|
| 桌面框架 | Tauri 2.x (Rust) |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS 4 |
| Markdown | react-markdown + KaTeX |
| PDF 渲染 | PDF.js |
| 文档处理 | Python sidecar (PyMuPDF + python-pptx) |
| LLM 调用 | 前端直调 API (OpenAI/Anthropic/Gemini/自定义) |
| 状态管理 | Zustand |

## 快速开始

### 前置条件

- **Node.js** ≥ 18
- **Rust** (安装：https://rustup.rs/)
- **Python 3.10+** (用于文档解析 sidecar)
- **LibreOffice** (用于 PPT→PDF 转换)

### 安装

```bash
# 1. 安装前端依赖
npm install

# 2. 安装 Python sidecar 依赖
pip install -r src-tauri/sidecar/requirements.txt

# 3. (可选) 安装 OCR 和 RAG 依赖
# pip install paddleocr sentence-transformers sqlite-vec
```

### 开发

```bash
# 仅前端开发（浏览器）
npm run dev

# Tauri 桌面应用开发
npm run tauri:dev
```

### 构建

```bash
npm run tauri:build
```

## 项目结构

```
slide-ai/
├── src/                        # React 前端
│   ├── components/
│   │   ├── layout/             # MainLayout, SlidePanel, ExplainPanel, ChatPanel
│   │   ├── viewer/             # PdfViewer, ImageViewer
│   │   ├── chat/               # MessageBubble, ContextSelector
│   │   ├── settings/           # ApiSettings, PromptEditor
│   │   └── ui/                 # ResizeDivider, PanelHeader, Loading
│   ├── stores/                 # Zustand stores
│   ├── services/               # LLM, RAG, explainService, tauriDocument
│   └── types/                  # TypeScript 类型定义
├── src-tauri/                  # Tauri/Rust 后端
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── commands/           # document, sidecar, storage
│   └── sidecar/                # Python 文档处理器
│       ├── processor.py        # 入口
│       ├── pdf_handler.py      # PDF 解析
│       ├── ppt_handler.py      # PPT 解析
│       ├── ocr_handler.py      # OCR 处理
│       └── rag_handler.py      # RAG 向量检索
└── package.json
```

## 功能

- ✅ PDF/PPT 逐页展示（左原课件 + 右 AI 讲解）
- ✅ 流式 AI 讲解生成（多 provider 支持）
- ✅ 可拖拽分栏 + 缩略图导航
- ✅ 单页对话 + 全文档 RAG 问答
- ✅ 可配置提示词模板 + 多种讲解风格
- ✅ 讲解预生成 + 缓存
- ✅ API Key 系统钥匙串安全存储
- ✅ 演讲者备注自动注入
- ✅ 前后页上下文传递

## 配置

在应用内设置页面配置：

1. **API 提供商** — OpenAI / Anthropic / Gemini / 自定义端点
2. **API Key** — 存储于系统钥匙串
3. **提示词模板** — 自定义讲解和对话的系统提示词
4. **讲解风格** — 生动详细 / 考点突出 / 简洁概括
