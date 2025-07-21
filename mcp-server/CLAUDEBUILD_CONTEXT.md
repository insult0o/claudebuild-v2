# ClaudeBuild Development Context

## Overview

ClaudeBuild is a multi-agent development orchestrator that combines the BMAD (Breakthrough Method for Agile AI Driven Development) methodology with Claude Code capabilities. It was developed to enable parallel task execution through specialized AI agents.

## Development Journey

### Initial Request
The user wanted to use the BMAD method from a YouTube video to create a workflow study for a Claude Code automation project. After analyzing the BMAD methodology, we decided to build a complete system that combines BMAD planning with Claude Code execution.

### Key Development Phases

1. **BMAD Analysis and Planning**
   - Used BMAD agents (Analyst, PM, Architect, PO) to plan the ClaudeBuild project
   - Created comprehensive planning documents
   - Designed the system architecture

2. **Story Implementation** (Sequential development as requested by user)
   - STORY-001: CLI Framework
   - STORY-002: Configuration System
   - STORY-003: Project Scaffolding
   - STORY-004: Agent Runtime System

## System Architecture

### Core Components

```
claudebuild/
├── bin/
│   └── claudebuild.js          # Main CLI entry point
├── src/
│   ├── cli/
│   │   ├── commands/           # CLI command implementations
│   │   └── utils/              # CLI utilities (logger, validator)
│   ├── core/
│   │   ├── agents/             # Agent system
│   │   │   ├── manager.js      # Agent orchestration
│   │   │   ├── process.js      # Process management
│   │   │   ├── registry.js     # Agent type registry
│   │   │   ├── message-bus.js  # Inter-agent communication
│   │   │   ├── handlers/       # Agent type handlers
│   │   │   └── runtime/        # Agent runtime environments
│   │   ├── config/             # Configuration system
│   │   │   ├── index.js        # Config manager
│   │   │   └── providers/      # Config providers (env, project, global, default)
│   │   └── templates/          # Project scaffolding
│   │       ├── engine.js       # Template engine
│   │       └── types/          # Project templates
│   └── integrations/           # External integrations (future)
├── mcp-server/                 # MCP server for Claude integration
└── .claudebuild/               # Runtime directory
    ├── agents/                 # Agent working directories
    ├── artifacts/              # Build artifacts
    ├── checkpoints/            # Task checkpoints
    └── logs/                   # Agent logs
```

### Key Features

1. **CLI Framework**
   - Commander.js-based CLI with multiple commands
   - Commands: init, plan, build, status, agent, workflow, dashboard, config
   - Comprehensive help system
   - Beautiful terminal output with colors and formatting

2. **Configuration System**
   - Hierarchical configuration: env > project > global > default
   - Environment variable support with automatic camelCase conversion
   - Secure credential storage with encryption
   - YAML configuration files

3. **Project Scaffolding**
   - Template-based project initialization
   - Multiple project types (webapp, api, cli, library)
   - Variable interpolation with helper functions
   - Git integration

4. **Agent Runtime System**
   - Process-based agent isolation
   - Node.js runtime with IPC communication
   - Message bus for inter-agent communication
   - Health monitoring and auto-restart
   - Resource management (CPU, memory, timeout)
   - Agent registry with capability matching

### Agent Types

1. **Built-in Agents**
   - `orchestrator`: Master coordinator
   - `dev`: Development tasks (implement, refactor, fix, test)
   - `generic`: General purpose agent

2. **BMAD Agents** (ready to integrate)
   - `analyst`: Requirements analysis
   - `pm`: Project management
   - `architect`: Technical architecture
   - `qa`: Quality assurance
   - `devops`: Deployment and infrastructure

### Communication Architecture

```
AgentManager (Orchestrator)
    ├── AgentProcess (Process Management)
    ├── AgentRegistry (Agent Discovery)
    └── MessageBus (Communication)
         └── Agents (Isolated Processes)
```

- Each agent runs in a separate Node.js process
- IPC-based communication between manager and agents
- Pub/sub and request/response patterns via MessageBus
- Event-driven architecture with proper error handling

## Key Technical Decisions

1. **Process-based Isolation**: Each agent runs in its own process for true parallelism and fault isolation
2. **Node.js Runtime**: Flexible runtime that can execute both simple scripts and complex Claude Code integrations
3. **Message Bus Pattern**: Centralized communication hub for scalable inter-agent messaging
4. **Hierarchical Configuration**: Flexible configuration system supporting multiple environments
5. **Template Engine**: Extensible scaffolding system for different project types

## Implementation Challenges & Solutions

1. **Agent Type Registration**
   - Problem: "Unknown agent type: dev" error
   - Solution: Added dev agent to built-in agents in registry

2. **Task Completion Detection**
   - Problem: Build command timing out despite agents completing
   - Solution: Modified agent runtime to exit after task completion
   - Enhanced build command to track completion events

3. **Success Tracking**
   - Problem: Showing "0/3 successful" despite all tasks completing
   - Solution: Added event-based completion tracking before agent cleanup

## Testing Results

Successfully tested with a 3-task build:
- Task 1: Implement user authentication
- Task 2: Create REST API endpoints  
- Task 3: Write unit tests for auth module

All tasks completed successfully with proper file generation and agent cleanup.

## Completed Features

### ✅ Orchestration Engine (STORY-005) - COMPLETED
The orchestration engine is now fully implemented with:
- **Workflow Engine**: Task scheduling and dependency management
- **State Manager**: Persistent state with recovery capabilities
- **Dependency Resolver**: DAG-based execution ordering
- **Parallel Execution**: Configurable agent limits with queueing
- **Tool Access Control**: Policy-based governance with audit logs
- **Event System**: Comprehensive monitoring and progress tracking

See `ORCHESTRATION_ENGINE_IMPLEMENTATION.md` for full details.

## Next Steps

1. **Claude Code Integration**
   - Direct API integration
   - Tool usage within agents
   - Context management

2. **Monitoring & Visualization**
   - Web dashboard
   - Real-time agent status
   - Performance metrics

3. **MCP Server Enhancement**
   - Full tool exposure
   - Resource management
   - Event streaming

## Usage Examples

```bash
# Initialize a new project
claudebuild init my-project

# Plan tasks from an issue
claudebuild plan --issue "Build a user authentication system"

# Execute tasks with agents
claudebuild build --tasks tasks.json --parallel 4

# Check project status
claudebuild status --verbose

# List available agents
claudebuild agent list

# View agent logs
claudebuild agent logs <agent-id>
```

## Integration with Claude Code

The system is designed to be used as:
1. A CLI tool for local development
2. An MCP server for Claude Desktop/API integration
3. A library for programmatic usage

## Related Documentation

### TORE Matrix Labs Architecture
- `TORE_MATRIX_LABS_ARCHITECTURE.md` - Comprehensive multi-agent architecture using MCP
- `CLAUDEBUILDS_ORIGINAL_DESIGN.md` - Original CLAUDEBUILDS multi-agent design
- `CLAUDIA_ORCHESTRATOR_IMPLEMENTATION.md` - Claudia framework orchestrator implementation

### Planning and Strategy
- `CLAUDEBUILD_PLANNING_CONVERSATION.md` - Strategic planning with ChatGPT
- `AGENT_ROLES.md` - Detailed agent responsibilities
- `BMAD Method` - Breakthrough Method for Agile AI-Driven Development

### Implementation Guides
- `INTEGRATION_GUIDE.md` - Complete integration guide
- `AUTOMATIC_AUTH.md` - GitHub authentication setup
- `KNOWLEDGE_SHARING_PROTOCOL.md` - Tool discovery documentation

## MCP Integration Implementation

### Overview
ClaudeBuild now includes full MCP (Model Context Protocol) integration, allowing agents to use external tools like web search and GitHub search during their execution.

### Implementation Details
- **MCP Client**: Full stdio-based MCP client with proper initialization
- **Tool Permission System**: User-governed access control (ask|allow|deny)
- **Tool Usage Logging**: Complete audit trail of all tool invocations
- **Agent Integration**: Tools available through `context.tools` in agent runtime

### Available MCP Tools
1. **web_search**: DuckDuckGo-based web search (no API key required)
2. **github_search**: GitHub API search for repositories, code, issues, users
3. **claudebuild_plan**: Plan tasks using BMAD methodology
4. **claudebuild_build**: Execute multi-agent builds
5. **claudebuild_agent**: Manage agents (list, status, logs)
6. **claudebuild_status**: Get project status

### Key Implementation Files
- `/src/core/agents/mcp/client.js` - MCP client implementation
- `/src/core/agents/mcp/policy.js` - Tool access control
- `/src/core/agents/mcp/logger.js` - Usage tracking
- `/mcp-server/index.js` - MCP server with all tools

### Testing Results
Successfully tested MCP integration with:
- ✅ Agent connecting to MCP server
- ✅ Using web_search tool to find best practices
- ✅ Using github_search tool to find repositories
- ✅ Creating documentation based on research

### Important Discovery
When ClaudeBuild agents were building the monitoring dashboard, they made **ZERO** use of MCP servers for web searches, revealing the need for explicit MCP-enabled agent types.

## Conclusion

ClaudeBuild represents a significant step forward in AI-driven development, combining the BMAD methodology with practical multi-agent orchestration. The system builds upon the foundational work from TORE Matrix Labs, incorporating lessons learned from CLAUDEBUILDS original design and the Claudia orchestrator implementation. It is designed to be extensible, scalable, and capable of handling complex software development tasks with minimal human intervention.

The MCP server exposes ClaudeBuild functionality through standard MCP tools and resources, allowing Claude to orchestrate multi-agent development workflows. With the addition of full MCP integration, agents can now leverage external tools and resources to enhance their capabilities.