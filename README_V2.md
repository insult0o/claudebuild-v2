# ClaudeBuild v2 - Multi-Agent AI Development Platform

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/rust-%3E%3D1.70.0-orange.svg" alt="Rust">
</p>

ClaudeBuild v2 is a comprehensive AI development platform that orchestrates multiple Claude agents to build software using the BMAD (Breakdown, Map, Assign, Deliver) methodology. It combines powerful CLI tools with an intuitive GUI for managing complex development workflows.

## 🚀 Key Features

### 🧠 BMAD Methodology
- **Strategic Planning** - AI-driven requirement breakdown
- **Role-Based Agents** - Specialized agents for each development phase
- **Context Engineering** - Structured knowledge management
- **Dependency Resolution** - Intelligent task orchestration

### 🔧 Core Capabilities
- **Session Management** - Git worktree isolation for parallel development
- **Slash Commands** - Reusable workflow automation
- **MCP Integration** - External tools and context servers
- **Multi-Perspective Reviews** - Comprehensive code analysis
- **Visual Workflow Builder** - Drag-and-drop task management

### 🖥️ Dual Interface
- **Powerful CLI** - Full control for power users
- **Intuitive GUI** - Visual interface built with Tauri
- **Real-time Monitoring** - Live progress tracking
- **Integrated Diff Viewer** - Visual code changes

## 📦 Installation

### Prerequisites
- Node.js 18+
- Git
- Rust (for GUI)

### Quick Start
```bash
# Install ClaudeBuild CLI
npm install -g claudebuild

# Initialize a new project
claudebuild init

# Launch GUI (optional)
claudebuild gui
```

## 🎯 Usage Examples

### CLI Workflow
```bash
# 1. Plan a feature using BMAD
claudebuild slash plan "Build user authentication system"

# 2. Create development session
claudebuild session new --task "Implement OAuth2" --agent dev

# 3. Build in parallel
claudebuild slash build --from tasks.json --parallel 5

# 4. Review from multiple perspectives
claudebuild slash review --latest --hat "security,performance,ux"

# 5. Complete and merge
claudebuild session complete session-123 --merge
```

### GUI Workflow
1. Launch GUI: `claudebuild gui`
2. Create new session from Dashboard
3. Monitor agents in real-time
4. Review visual workflow graph
5. Approve tool usage via dialogs
6. Merge completed work visually

## 🏗️ Architecture

### System Components
```
claudebuild/
├── src/
│   ├── cli/              # CLI interface
│   ├── core/             # Core engine
│   │   ├── agents/       # Agent system
│   │   ├── worktree/     # Git isolation
│   │   └── commands/     # Slash commands
│   └── gui/              # Tauri GUI application
├── commands/             # Slash command library
└── mcp-server/          # MCP integration
```

### Agent Roles
- **🧠 Planner** - Strategic breakdown and task creation
- **🏛️ Architect** - Technical design and specifications
- **🔨 Builder** - Code implementation
- **🔍 Reviewer** - Multi-perspective analysis
- **📋 Manager** - Orchestration and validation
- **🧪 QA** - Testing and quality assurance

## 💫 Advanced Features

### Session Management
- Git worktree isolation
- Checkpoint/resume capability
- Parallel execution
- Automatic commits

### Slash Commands
```bash
/plan        # BMAD planning
/spec        # Technical specifications
/build       # Parallel implementation
/review      # Code review
/validate    # Quality checks
/deploy      # Deployment pipeline
```

### MCP Servers
- GitHub integration
- Web search capabilities
- Documentation access
- Custom tool connections

## 🎨 GUI Features

### Dashboard
- Real-time metrics
- Active session monitoring
- Agent status tracking
- Activity timeline

### Session Manager
- Visual session creation
- Progress tracking
- Diff viewing
- Checkpoint management

### Workflow Visualizer
- Task dependency graphs
- Drag-and-drop interface
- Status indicators
- Real-time updates

### Agent Library
- Template browser
- Custom agent creation
- System prompt editor
- Capability management

## 🔧 Configuration

### Project Configuration (`.claudebuild.yml`)
```yaml
version: 1.0.0
project:
  name: my-project
  type: fullstack
agents:
  defaultType: dev
  maxParallel: 5
mcp:
  servers:
    - name: github
      enabled: true
tools:
  defaultPolicy: ask
```

### Environment Variables
```bash
CLAUDEBUILD_TOOL_PERMISSION=allow  # Tool approval mode
CLAUDEBUILD_MCP_ENABLED=true       # Enable MCP servers
CLAUDEBUILD_LOG_LEVEL=info         # Logging level
```

## 📖 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [BMAD Methodology](docs/bmad-methodology.md)
- [Agent Templates](docs/agent-templates.md)
- [Slash Commands](commands/README.md)
- [GUI User Guide](gui/README.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone repository
git clone https://github.com/claudebuild/claudebuild.git
cd claudebuild

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build
```

## 📊 Benchmarks

- **Session Creation**: < 2 seconds
- **Parallel Agents**: Up to 10 simultaneous
- **MCP Response**: < 500ms
- **GUI Startup**: < 3 seconds

## 🗺️ Roadmap

### Current (v2.0)
- ✅ Session management
- ✅ Slash commands
- ✅ GUI application
- ✅ BMAD templates

### Upcoming (v2.1)
- 🔄 Voice control
- 🔄 Multi-user support
- 🔄 CI/CD integration
- 🔄 Cloud deployment

### Future (v3.0)
- 🔮 AI model selection
- 🔮 Custom workflows
- 🔮 Plugin system
- 🔮 Mobile companion

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Anthropic for Claude and claude-code
- Open source projects that inspired us:
  - [Claude Squad](https://github.com/smtg-ai/claude-squad)
  - [async-code](https://github.com/ObservedObserver/async-code)
  - [Crystal](https://github.com/stravu/crystal)
  - [Claudia](https://github.com/getAsterisk/claudia)

## 📞 Support

- [Documentation](https://claudebuild.dev/docs)
- [Discord Community](https://discord.gg/claudebuild)
- [GitHub Issues](https://github.com/claudebuild/claudebuild/issues)

---

Built with ❤️ by the ClaudeBuild Team