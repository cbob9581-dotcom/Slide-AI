mod commands;

use commands::document::*;
use commands::sidecar::*;
use commands::storage::*;
use tauri::Manager;
use tokio::sync::Mutex;

pub struct AppState {
    pub sidecar_process: Mutex<Option<std::process::Child>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            sidecar_process: Mutex::new(None),
        })
        .setup(|app| {
            if let Ok(app_data) = app.path().app_data_dir() {
                std::fs::create_dir_all(&app_data).ok();
                std::fs::create_dir_all(app_data.join("slides")).ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            parse_document,
            read_file_bytes,
            save_file_bytes,
            get_api_key,
            set_api_key,
            search_rag,
            get_app_data_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
