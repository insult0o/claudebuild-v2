# ClaudeBuild v2 - Full Planning Conversation

## Context
This document contains the complete conversation about planning ClaudeBuild v2, incorporating research from open source Claude tools and implementing a comprehensive multi-agent development platform.

## Conversation Summary

### 1. Initial Research Phase
- Analyzed 5+ open source Claude tools (Claude Squad, async-code, Crystal, Claudia, CCManager)
- Identified key patterns: git worktrees, parallel execution, visual interfaces, MCP integration
- Discovered that NO existing tool combines BMAD methodology with full MCP integration

### 2. Architecture Planning
- Designed dual CLI/GUI interface
- Planned git worktree isolation for parallel agents
- Created comprehensive slash command system
- Integrated BMAD methodology for structured development

### 3. Implementation Phase 1
- ✅ Built git worktree manager
- ✅ Created session management CLI
- ✅ Implemented MCP keep-alive mechanism
- ✅ Developed Terminal UI with blessed.js

### 4. Key Learning from Kieran's Video
- Agentic coding > Vibe coding
- Treat Claude as a team of developers, not a code assistant
- Use slash commands for reusable workflows
- Implement multi-perspective reviews
- Parallel execution with git worktrees
- "Think ultra hard" for complex reasoning

### 5. Slash Command Design
Comprehensive slash commands adapted for ClaudeBuild:
- `/plan` - BMAD breakdown
- `/spec` - Technical specifications
- `/build` - Parallel execution
- `/review` - Multi-hat reviews
- `/validate` - Quality checks
- `/deploy` - CI/CD
- `/doc` - Documentation
- `/refactor` - Code improvement
- `/websearch` - Research

## Key Insights

### From Open Source Research:
1. **Claude Squad** - Terminal UI excellence
2. **async-code** - Web dashboard patterns
3. **Crystal** - Visual timeline and diffs
4. **Claudia** - MCP integration blueprint
5. **Kieran's Workflow** - Practical agentic coding

### Unique ClaudeBuild Advantages:
- BMAD methodology (no other tool has this)
- Full MCP server ecosystem
- Role-based agent orchestration
- Dependency resolution
- Tool governance

### Implementation Best Practices:
1. Start with planning, not coding
2. Use "think ultra hard" for complex tasks
3. Create reusable slash commands
4. Run agents in parallel
5. Review from multiple perspectives
6. Low friction through automation

## Technical Details

### Git Worktree Management
```javascript
// Create isolated session
await worktreeManager.createSession(sessionId, {
  agent: 'dev',
  task: { description: 'Implement feature X' }
});
```

### MCP Keep-Alive
- Ping every 30 seconds
- Auto-reconnect on failure
- Graceful shutdown handling
- Event-based monitoring

### TUI Interface
- Tmux-style keyboard shortcuts
- Session list with status
- Diff viewer
- Log display
- Command input

## Project Structure
```
claudebuild-v2/
├── packages/
│   ├── core/         # Shared engine
│   ├── cli/          # Enhanced CLI
│   ├── gui/          # Desktop app
│   └── shared/       # Common types
├── mcp-servers/      # MCP implementations
└── commands/         # Slash commands
```

## User Requirements (Specified)
1. Primary user: Solo developer
2. Interface: Both CLI and GUI
3. Configuration: Default prebuilt BMAD+MCP, changeable through code
4. Features: Everything - agent approvals, logs, task graphs, outputs

## Implementation Roadmap
- Phase 1: Core Enhancements ✅
- Phase 2: GUI Development 🚧
- Phase 3: Advanced Features 📅
- Phase 4: Voice & Multi-user 🔮

## Resources
- [Claude Squad](https://github.com/smtg-ai/claude-squad)
- [async-code](https://github.com/ObservedObserver/async-code)
- [Crystal](https://github.com/stravu/crystal)
- [Claudia](https://github.com/getAsterisk/claudia)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

---

*This conversation represents the comprehensive planning and initial implementation of ClaudeBuild v2, transforming it from a CLI tool to a complete AI development platform.*