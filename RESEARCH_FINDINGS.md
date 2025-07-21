# ClaudeBuild Research Findings - Open Source Claude Tools

## Executive Summary

Based on extensive research of existing open-source Claude tools, we've identified key patterns and features that can enhance ClaudeBuild with GUI capabilities, better orchestration, and improved user workflows.

## Key Open Source Projects

### 1. **Claude Squad** (CLI/TUI with Git Worktrees)
- **Repo**: [smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) (AGPL-3.0)
- **Key Features**:
  - Tmux-based terminal UI for parallel sessions
  - Git worktree isolation per agent
  - Keyboard shortcuts (n=new, r=resume, c=commit, s=save)
  - Built-in diff viewer
- **What to Learn**: Worktree management, TUI session controls

### 2. **async-code** (Web UI + Docker)
- **Repo**: [ObservedObserver/async-code](https://github.com/ObservedObserver/async-code) (Apache-2.0)
- **Key Features**:
  - Next.js + Tailwind web dashboard
  - Docker containerization per agent
  - Task cards UI pattern
  - Auto-commit and PR creation
- **What to Learn**: Web UI components, container orchestration

### 3. **Crystal** (Electron Desktop App)
- **Repo**: [stravu/crystal](https://github.com/stravu/crystal) (MIT)
- **Key Features**:
  - Session timeline visualization
  - Side-by-side diff editor
  - Rebase and squash UI controls
  - Desktop notifications
- **What to Learn**: Desktop GUI patterns, visual diff tools

### 4. **Claudia** (Tauri GUI + MCP)
- **Repo**: [getAsterisk/claudia](https://github.com/getAsterisk/claudia) (AGPL-3.0)
- **Key Features**:
  - Project/session browser
  - Custom agent library with templates
  - Usage analytics dashboard
  - **Built-in MCP server integration**
- **What to Learn**: Complete GUI architecture, MCP integration patterns

### 5. **CCManager** (Lightweight Session Manager)
- **Repo**: [kbwo/ccmanager](https://github.com/kbwo/ccmanager)
- **Key Features**:
  - Simple session state tracking
  - Non-tmux workflow support
- **What to Learn**: Lightweight session management

## What Makes ClaudeBuild Unique

While these tools excel at parallel execution and UI, **NONE** of them have:

1. **BMAD Methodology Integration**
   - PRD → Architecture → Story workflow
   - Role-based agents (Analyst, Architect, Dev, QA)
   - Context-engineered development

2. **MCP Server Ecosystem** (except Claudia partially)
   - Tool governance and approval flows
   - Context injection from external sources
   - Structured memory management

3. **Full Orchestration Engine**
   - Dependency resolution
   - Task queuing and prioritization
   - Agent role enforcement

## Recommended Architecture for ClaudeBuild v2

### Core Features to Implement

1. **Dual Interface (GUI + CLI)**
   ```
   claudebuild/
   ├── gui/              # Tauri/Electron app
   │   ├── sessions/     # Session browser (like Claudia)
   │   ├── agents/       # Agent library
   │   ├── diff/         # Diff viewer (like Crystal)
   │   └── analytics/    # Usage tracking
   ├── cli/              # Enhanced CLI
   │   └── tui/          # Optional TUI mode (like Claude Squad)
   └── core/             # Shared engine
       ├── worktree/     # Git worktree management
       ├── orchestrator/ # Task scheduling
       └── mcp/          # MCP integration
   ```

2. **Session Management**
   - Git worktree per session (proven pattern)
   - Auto-commit after each agent response
   - Visual timeline with checkpoints
   - Diff view with syntax highlighting

3. **Agent Orchestration**
   - Role-based agent templates
   - Parallel execution with dependency tracking
   - Tool approval gateway
   - Progress visualization

4. **MCP Integration** (Our Differentiator)
   - Built-in MCP server management
   - Tool permission system
   - Context injection from external sources
   - Memory persistence across sessions

## Implementation Roadmap

### Phase 1: Core Enhancement
- [ ] Integrate worktree management from Claude Squad
- [ ] Add session state tracking
- [ ] Implement checkpoint/resume functionality

### Phase 2: CLI/TUI Enhancement
- [ ] Add tmux-style session management
- [ ] Implement keyboard shortcuts
- [ ] Create interactive diff viewer

### Phase 3: GUI Development
- [ ] Build Tauri app with session browser
- [ ] Add agent library UI
- [ ] Implement visual diff and timeline
- [ ] Create analytics dashboard

### Phase 4: Advanced Features
- [ ] Docker containerization option
- [ ] Multi-user support
- [ ] CI/CD integration
- [ ] Voice control interface

## Code Patterns to Adopt

### Git Worktree Management (from Claude Squad)
```go
cmd := exec.Command("git", "worktree", "add", workpath, branch)
```

### Session State (from CCManager)
```typescript
interface Session {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  branch: string;
  worktree: string;
  agent: string;
  startTime: Date;
  checkpoints: Checkpoint[];
}
```

### Task Cards UI (from async-code)
```jsx
<TaskCard
  task={task}
  status={status}
  onResume={() => resumeSession(task.id)}
  onViewDiff={() => showDiff(task.branch)}
/>
```

### MCP Integration (enhance from Claudia)
```typescript
interface MCPConfig {
  servers: MCPServer[];
  tools: ToolDefinition[];
  permissions: PermissionPolicy;
  memory: MemoryStore;
}
```

## Unique Selling Points

ClaudeBuild v2 will be the **ONLY** tool that combines:
1. **BMAD methodology** for structured AI development
2. **Full MCP ecosystem** for context and tools
3. **Role-based orchestration** with dependency management
4. **Dual CLI/GUI interface** for all user types
5. **Built-in governance** for tool usage and approvals

## Resources

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) - Curated list of Claude tools
- [Anthropic Best Practices](https://docs.anthropic.com/claude-code/best-practices) - Official guidelines
- [MCP Documentation](https://modelcontextprotocol.io) - Protocol specification

---

*This research forms the foundation for ClaudeBuild v2, combining the best of existing tools with our unique BMAD+MCP capabilities.*