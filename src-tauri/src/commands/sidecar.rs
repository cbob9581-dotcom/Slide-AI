use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct RagSearchResult {
    pub page_num: u32,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RagSearchResponse {
    pub results: Vec<RagSearchResult>,
}

/// RAG 向量搜索（通过 Python sidecar）
#[tauri::command]
pub async fn search_rag(
    _document_id: String,
    _query: String,
    _top_k: Option<u32>,
    _state: State<'_, AppState>,
) -> Result<RagSearchResponse, String> {
    // TODO: 实现通过 sidecar 调用 rag_handler.py
    // 当前返回空结果，前端会回退到关键词匹配
    Ok(RagSearchResponse { results: vec![] })
}
