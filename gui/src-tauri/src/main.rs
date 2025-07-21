#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Session {
    id: String,
    branch: String,
    worktree: String,
    status: String,
    agent: String,
    task: Option<Task>,
    created: String,
    checkpoints: Vec<Checkpoint>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Task {
    description: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Checkpoint {
    id: String,
    message: String,
    timestamp: String,
}

// Get list of sessions
#[tauri::command]
async fn get_sessions() -> Result<Vec<Session>, String> {
    let output = Command::new("claudebuild")
        .args(&["session", "list", "--json"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let sessions: Vec<Session> = serde_json::from_slice(&output.stdout)
            .map_err(|e| e.to_string())?;
        Ok(sessions)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Create new session
#[tauri::command]
async fn create_session(task: String, agent: String) -> Result<Session, String> {
    let output = Command::new("claudebuild")
        .args(&["session", "new", "--task", &task, "--agent", &agent, "--json"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let session: Session = serde_json::from_slice(&output.stdout)
            .map_err(|e| e.to_string())?;
        Ok(session)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Resume session
#[tauri::command]
async fn resume_session(session_id: String) -> Result<(), String> {
    let output = Command::new("claudebuild")
        .args(&["session", "resume", &session_id])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Pause session
#[tauri::command]
async fn pause_session(session_id: String) -> Result<(), String> {
    let output = Command::new("claudebuild")
        .args(&["session", "pause", &session_id])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Create checkpoint
#[tauri::command]
async fn checkpoint_session(session_id: String, message: String) -> Result<(), String> {
    let output = Command::new("claudebuild")
        .args(&["session", "checkpoint", &session_id, "-m", &message])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Execute slash command
#[tauri::command]
async fn execute_slash_command(command: String, args: String) -> Result<String, String> {
    let output = Command::new("claudebuild")
        .args(&["slash", &command, &args])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into_owned())
    }
}

// Get agent templates
#[tauri::command]
async fn get_agent_templates() -> Result<Vec<String>, String> {
    // This would call the actual claudebuild CLI
    Ok(vec![
        "planner".to_string(),
        "architect".to_string(),
        "builder".to_string(),
        "reviewer".to_string(),
        "qa".to_string(),
        "manager".to_string(),
    ])
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_sessions,
            create_session,
            resume_session,
            pause_session,
            checkpoint_session,
            execute_slash_command,
            get_agent_templates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}