# ClaudeBuild MCP Server

This MCP (Model Context Protocol) server provides access to ClaudeBuild functionality for AI assistants like Claude.

## 🎉 MCP Integration Now Complete!

### What Happened
1. **Analysis revealed**: Agents made ZERO use of MCP tools when building monitoring dashboard
2. **The test**: ClaudeBuild was asked to implement MCP integration
3. **The result**: Agents just built another monitoring dashboard 
4. **The insight**: Without MCP access, agents can't adapt to new requirements
5. **The solution**: Manual implementation of complete MCP integration

### What's New for Agents
```javascript
// Agents now have access to MCP tools in their context:
const results = await context.tools.webSearch('React best practices 2024');
const repos = await context.tools.githubSearch('typescript starter template');
const doc = await context.tools.readPdf('https://example.com/guide.pdf');
```

### Implementation Details
- **MCP Client**: `src/core/agents/mcp/client.js` - Connects to MCP servers
- **Access Policy**: `src/core/agents/mcp/policy.js` - User controls (ask|allow|deny)
- **Usage Logger**: `src/core/agents/mcp/logger.js` - Full audit trail
- **Enhanced Runtime**: `src/core/agents/runtime/node.js` - Tools in context
- **Example Agent**: `src/core/agents/handlers/builder-mcp.js` - Shows usage

### Security & Control
- Every tool use requires permission check
- Policies in `.claudebuild/config/tool-policy.json`
- Logs in `.claudebuild/logs/tool-usage/`
- Cost tracking and suspicious activity detection
- Session-level permissions for efficiency

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Add to your Claude Desktop configuration (~/.config/claude/config.json):

```json
{
  "mcpServers": {
    "claudebuild": {
      "command": "node",
      "args": ["/home/insulto/claudebuild/mcp-server/index.js"],
      "env": {
        "NODE_ENV": "production",
        "GITHUB_TOKEN": "your_github_personal_access_token"
      }
    }
  }
}
```

**Note**: The GITHUB_TOKEN enables automatic GitHub access for all agents without authentication prompts.

## Available Tools

### claudebuild_plan
Plan tasks for a project using BMAD methodology.
- `issue`: Main issue or project description
- `outputFile`: Output file for tasks.json (optional)

### claudebuild_build
Execute build with multi-agent orchestration.
- `tasksFile`: Path to tasks.json file (optional)
- `parallel`: Number of parallel agents (optional)
- `dryRun`: Perform a dry run (optional)

### claudebuild_agent
Manage ClaudeBuild agents.
- `action`: 'list', 'status', or 'logs'
- `agentId`: Agent ID for status/logs (optional)

### claudebuild_status
Get ClaudeBuild project status.
- `verbose`: Show detailed status (optional)

## Available Resources

### claudebuild://context
Comprehensive development context and history of ClaudeBuild.

### claudebuild://status
Current development status board showing progress and completed features.

### claudebuild://architecture
Detailed system architecture documentation.

## Usage Examples

```typescript
// Plan tasks for a new feature
await use_tool('claudebuild_plan', {
  issue: 'Implement user authentication with JWT tokens',
  outputFile: 'auth-tasks.json'
});

// Execute the build
await use_tool('claudebuild_build', {
  tasksFile: 'auth-tasks.json',
  parallel: 4
});

// Check agent status
await use_tool('claudebuild_agent', {
  action: 'list'
});

// Get project status
await use_tool('claudebuild_status', {
  verbose: true
});

// Read development context
const context = await read_resource('claudebuild://context');
```

## Development Workflow

1. **Initialize Project**: Use regular ClaudeBuild CLI
2. **Plan Tasks**: Use `claudebuild_plan` tool
3. **Execute Build**: Use `claudebuild_build` tool
4. **Monitor Progress**: Use `claudebuild_status` and `claudebuild_agent` tools
5. **Review Context**: Read resources for architecture and development history

## Integration with BMAD

ClaudeBuild integrates BMAD methodology agents:
- Analyst: Requirements analysis
- PM: Project management  
- Architect: Technical design
- Developer: Implementation
- QA: Testing and validation
- DevOps: Deployment

Each agent type can be extended with custom handlers and capabilities.