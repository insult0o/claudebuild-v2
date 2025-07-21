# ClaudeBuild GUI

Visual interface for ClaudeBuild multi-agent orchestration platform.

## Features

- **Session Management** - Create, resume, pause, and monitor development sessions
- **Agent Library** - Browse and deploy BMAD-based agent templates
- **Workflow Visualization** - Real-time task dependency graphs
- **Slash Commands** - Visual command palette for automation
- **MCP Integration** - Manage context servers and tools
- **Settings** - Configure agents, Git, and system preferences

## Tech Stack

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Tauri (Rust)
- **State**: Zustand
- **Visualization**: React Flow + D3.js
- **Editor**: Prism.js + React Simple Code Editor

## Development

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Setup

```bash
# Install dependencies
npm install

# Install Tauri CLI
npm install -g @tauri-apps/cli

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Architecture

```
gui/
├── src/                    # React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Main application pages
│   ├── stores/           # Zustand state management
│   ├── hooks/            # Custom React hooks
│   └── services/         # API services
├── src-tauri/            # Tauri backend
│   ├── src/             # Rust source code
│   └── Cargo.toml       # Rust dependencies
└── public/              # Static assets
```

## Pages

### Dashboard
- Overview of active sessions, agents, and tasks
- Activity timeline
- Quick stats and metrics

### Sessions
- Create and manage development sessions
- Git worktree isolation
- Checkpoint and diff viewing
- Progress tracking

### Agents
- Browse agent templates (Planner, Architect, Builder, etc.)
- Create custom agents with system prompts
- Monitor agent status and tasks

### Commands
- Visual slash command browser
- Execute commands with GUI
- Command history and favorites

### Workflow
- Visual task dependency graph
- Real-time progress updates
- Drag-and-drop task management

### Settings
- Configure default agents
- MCP server management
- Git integration settings
- Theme and preferences

## Integration with ClaudeBuild CLI

The GUI communicates with the ClaudeBuild CLI through Tauri's command system:

```rust
// Example: Create a new session
#[tauri::command]
async fn create_session(task: String, agent: String) -> Result<Session, String> {
    Command::new("claudebuild")
        .args(&["session", "new", "--task", &task, "--agent", &agent])
        .output()
}
```

## Building

### Development
```bash
npm run tauri:dev
```

### Production
```bash
# Build for current platform
npm run tauri:build

# Build for specific platform
npm run tauri:build -- --target x86_64-pc-windows-msvc
npm run tauri:build -- --target x86_64-apple-darwin
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

## License

MIT