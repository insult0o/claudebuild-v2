# ClaudeBuild Integration Guide

## Quick Start

### 1. Install MCP Server
```bash
cd /home/insulto/claudebuild/mcp-server
npm install
```

### 2. Configure Claude Desktop
Add to `~/.config/claude/config.json`:
```json
{
  "mcpServers": {
    "claudebuild": {
      "command": "node",
      "args": ["/home/insulto/claudebuild/mcp-server/index.js"],
      "env": {
        "GITHUB_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    }
  }
}
```

**Automatic GitHub Access**: Replace `YOUR_GITHUB_TOKEN_HERE` with your actual GitHub Personal Access Token. This enables automatic GitHub operations without any prompts.

### 3. Test MCP Connection
In Claude, try:
```
Can you read the ClaudeBuild context?
> use_tool('read_resource', { uri: 'claudebuild://context' })
```

## Complete Document Map

### Core Documentation
- `CLAUDEBUILD_CONTEXT.md` - Development history and implementation details
- `ARCHITECTURE.md` - System design and component architecture
- `EXPORT_SUMMARY.md` - Quick summary of what was built
- `CLAUDEBUILD_PLANNING_CONVERSATION.md` - Strategic planning decisions

### Operational Guides
- `README.md` - MCP server usage guide
- `README_tools.md` - MCP tool specifications
- `AGENT_ROLES.md` - Agent responsibilities and workflow
- `TOOL_CALL_POLICY.md` - Permission system documentation
- `INTEGRATION_GUIDE.md` - This file

### Agent Prompts
- `prompts/planner.prompt.md` - Planner agent system prompt
- `prompts/architect.prompt.md` - Architect agent system prompt
- `prompts/scrummaster.prompt.md` - ScrumMaster agent system prompt
- `prompts/builder.prompt.md` - Builder agent system prompt
- `prompts/qa.prompt.md` - QA agent system prompt
- `prompts/orchestrator.prompt.md` - Orchestrator agent system prompt

## Using ClaudeBuild via MCP

### Planning a Project
```typescript
// Generate tasks from an issue
await use_tool('claudebuild_plan', {
  issue: 'Build a real-time chat application with rooms',
  outputFile: 'chat-tasks.json'
});
```

### Building with Agents
```typescript
// Execute the build
await use_tool('claudebuild_build', {
  tasksFile: 'chat-tasks.json',
  parallel: 4,
  dryRun: false
});
```

### Monitoring Progress
```typescript
// Check status
await use_tool('claudebuild_status', {
  verbose: true
});

// List active agents
await use_tool('claudebuild_agent', {
  action: 'list'
});
```

## Workflow Example

### 1. Initialize Project
```bash
claudebuild init my-awesome-project
cd my-awesome-project
```

### 2. Create Issue Description
```bash
echo "Build a REST API for user management with JWT auth" > MAIN_ISSUE.md
```

### 3. Plan with BMAD Agents
```bash
claudebuild plan --issue MAIN_ISSUE.md
```

### 4. Review Generated Artifacts
- `PRD.md` - Product requirements
- `architecture.md` - Technical design
- `tasks.json` - Broken down tasks

### 5. Execute Build
```bash
claudebuild build --tasks tasks.json
```

### 6. Monitor Progress
- Check `STATUS_BOARD.md`
- View agent logs in `.claudebuild/logs/`
- Watch real-time output

## Advanced Usage

### Custom Agent Types
1. Create handler in `src/core/agents/handlers/`
2. Register in `src/core/agents/registry.js`
3. Add prompt in `mcp-server/prompts/`

### Tool Integration
1. Add tool to MCP server
2. Update `README_tools.md`
3. Add to agent prompts as needed

### Workflow Customization
1. Modify phase flow in orchestrator
2. Adjust story templates
3. Customize validation criteria

## Troubleshooting

### MCP Connection Issues
- Verify Claude Desktop config path
- Check MCP server logs
- Ensure node modules installed

### Agent Failures
- Check `.claudebuild/logs/`
- Verify agent type registered
- Review task file format

### Tool Permission Errors
- Check `config/tool_access_policy.json`
- Review `logs/tool_call_log.json`
- Ensure prompts include tool request format

## Best Practices

1. **Start Small**: Test with simple projects first
2. **Review Artifacts**: Check PRD and architecture before building
3. **Monitor Agents**: Watch STATUS_BOARD during execution
4. **Version Control**: Commit planning artifacts
5. **Iterate**: Refine prompts based on results

## Getting Help

### Resources
- Read the architecture: `claudebuild://architecture`
- Check agent roles: `claudebuild://context`
- Review examples in test files

### Common Commands
```bash
# Help
claudebuild --help
claudebuild <command> --help

# Status
claudebuild status --verbose
claudebuild agent list

# Logs
tail -f .claudebuild/logs/orchestrator.log
```

## Next Steps

1. **Try the Example**: Run the test tasks to see the system in action
2. **Customize Prompts**: Adjust agent behavior for your needs
3. **Add Tools**: Integrate additional MCP tools
4. **Scale Up**: Increase parallel agents for larger projects

Remember: ClaudeBuild is designed to evolve. Start simple, measure results, and incrementally enhance the system.