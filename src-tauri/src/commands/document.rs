use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct PageResult {
    pub page_number: u32,
    pub image_path: String,
    pub thumbnail_path: String,
    pub extracted_text: String,
    pub speaker_notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseResult {
    pub status: String,
    pub total_pages: u32,
    pub pages: Vec<PageResult>,
}

/// 解析文档（通过 Python sidecar）
#[tauri::command]
pub async fn parse_document(
    path: String,
    document_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ParseResult, String> {
    use tauri_plugin_shell::ShellExt;

    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let out_dir = app_data.join("slides").join(&document_id);
    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    let out_dir_str = out_dir.to_str().ok_or("invalid output path")?.to_string();

    // 构建 JSON 指令
    let cmd = serde_json::json!({
        "action": "parse_document",
        "path": path,
        "out_dir": out_dir_str
    });

    let cmd_str = serde_json::to_string(&cmd).map_err(|e| e.to_string())?;

    // 调用 Python sidecar
    let shell = app.shell();
    let output = shell
        .sidecar("python-sidecar")
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?
        .args([&cmd_str])
        .output()
        .await
        .map_err(|e| format!("Sidecar error: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Sidecar failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: ParseResult =
        serde_json::from_str(&stdout).map_err(|e| format!("Parse result error: {}", e))?;

    Ok(result)
}
