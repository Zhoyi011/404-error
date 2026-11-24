use std::time::Duration;
use tauri_plugin_opener::OpenerExt;

const ALLOWED_REPO_PREFIX: &str = "https://github.com/Zhoyi011/404-error/";

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
fn get_client_platform_info() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows-exe"
    } else if cfg!(target_os = "linux") {
        if std::env::var_os("APPIMAGE").is_some() || std::env::var_os("APPDIR").is_some() {
            "linux-appimage"
        } else if std::path::Path::new("/etc/debian_version").exists() {
            "linux-deb"
        } else {
            "linux-appimage"
        }
    } else {
        "web"
    }
}

#[tauri::command]
async fn fetch_remote_json(url: String) -> Result<String, String> {
    if !url.starts_with(ALLOWED_REPO_PREFIX) {
        return Err("Blocked untrusted update URL".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(6))
        .user_agent("404-error-desktop/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .header("Cache-Control", "no-cache")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }

    response.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
fn open_download_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with(ALLOWED_REPO_PREFIX) {
        return Err("Blocked untrusted download URL".to_string());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_client_platform_info,
            fetch_remote_json,
            open_download_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
