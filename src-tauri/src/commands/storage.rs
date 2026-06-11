use tauri::{AppHandle, Manager};

/// 获取 API key 持久化文件路径
fn key_file_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).ok();
    Ok(dir.join("apikey.dat"))
}

/// 读取文件字节
#[tauri::command]
pub async fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// 获取 API Key（文件存储）
#[tauri::command]
pub async fn get_api_key(app: AppHandle) -> Result<String, String> {
    let path = key_file_path(&app)?;
    if path.exists() {
        let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
        return Ok(String::from_utf8_lossy(&bytes).to_string());
    }
    Ok(String::new())
}

/// 保存 API Key（文件存储）
#[tauri::command]
pub async fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    let path = key_file_path(&app)?;
    std::fs::write(&path, key.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

/// 获取应用数据目录
#[tauri::command]
pub async fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(path.to_str().unwrap_or("").to_string())
}

/// 保存文件（用于写入页面图片等）
#[tauri::command]
pub async fn save_file_bytes(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())
}
