# ClaudeBuild Slash Commands

Slash commands are reusable prompts that orchestrate multi-agent workflows in ClaudeBuild. They transform complex development tasks into simple, repeatable operations.

## Core Commands

### 🧠 Planning & Architecture
- **`/plan`** - BMAD breakdown of requirements into tasks
- **`/spec`** - Detailed technical specifications
- **`/research`** - Web search and best practices gathering

### 🛠️ Development
- **`/build`** - Parallel agent implementation
- **`/test`** - Automated test generation and execution
- **`/refactor`** - Code improvement and modernization

### 🔍 Review & Quality
- **`/review`** - Multi-perspective code review
- **`/validate`** - Final checks before merge
- **`/audit`** - Security and compliance scanning

### 📦 Operations
- **`/deploy`** - CI/CD pipeline execution
- **`/rollback`** - Revert to previous version
- **`/monitor`** - Performance and error tracking

### 📚 Documentation
- **`/doc`** - Auto-generate documentation
- **`/changelog`** - Create release notes
- **`/diagram`** - Generate architecture diagrams

### 🔧 Utilities
- **`/fix`** - Automated bug fixing
- **`/optimize`** - Performance improvements
- **`/migrate`** - Database/API migrations

## Command Syntax

### Basic Usage
```
/command [options] [arguments]
```

### Common Options
- `--parallel <n>` - Run n agents concurrently
- `--agent <role>` - Specify agent type
- `--yolo` - Skip confirmations
- `--dry-run` - Preview without execution
- `--context <mcp>` - Add MCP server context

## Workflow Examples

### 1. Complete Feature Development
```bash
# Plan the feature
/plan "Add OAuth2 authentication with Google and GitHub"

# Generate detailed specs
/spec --from plans/auth-plan.md

# Build in parallel
/build --from tasks.json --parallel 4

# Review from multiple angles
/review --latest --hat "security,ux,performance"

# Validate and merge
/validate --pr 123 --auto-merge
```

### 2. Emergency Bug Fix
```bash
# Quick fix mode
/fix --issue 456 --priority critical

# Security review
/review --branch hotfix/issue-456 --hat security

# Fast-track deployment
/deploy --branch hotfix/issue-456 --env production
```

### 3. Codebase Modernization
```bash
# Research current best practices
/research "React 19 migration patterns"

# Plan the refactor
/refactor --analyze src/ --framework react

# Execute with progress tracking
/build --from refactor-tasks.json --progress

# Generate migration guide
/doc --type migration-guide
```

## Creating Custom Commands

### 1. Create Command File
```bash
touch commands/my-command.md
```

### 2. Define Command Structure
```markdown
# /my-command - Description

## Purpose
What this command accomplishes

## Process
1. Think ultra hard about requirements
2. Create TODOs for execution
3. Use sub-agents for parallel work
4. Validate results

## Context Required
- Access to GitHub API
- MCP server connections
- Previous command outputs
```

### 3. Register in ClaudeBuild
```bash
claudebuild command add my-command
```

## Best Practices

### 1. Command Design
- Single responsibility per command
- Clear, verb-based naming
- Comprehensive error handling
- Progress tracking built-in

### 2. Context Management
- Always include relevant MCP servers
- Reference previous outputs
- Maintain command history
- Use think ultra hard for complex logic

### 3. Parallelization
- Use sub-agents for independent tasks
- Respect dependency chains
- Handle conflicts gracefully
- Monitor resource usage

### 4. Output Standards
- Structured JSON for automation
- Markdown for human review
- GitHub integration for tracking
- Metrics for improvement

## Command Chaining

Commands can be chained for complex workflows:

```bash
# Full release pipeline
/plan "Version 2.0 features" \
  | /build --parallel 5 \
  | /review --hat all \
  | /test --coverage 90 \
  | /deploy --env staging \
  | /monitor --duration 24h
```

## MCP Integration

All commands have access to:
- **GitHub** - PRs, issues, releases
- **Slack** - Notifications, approvals
- **Jira** - Task tracking
- **Docs** - Internal knowledge base
- **Monitoring** - Metrics and logs
- **Custom** - Your MCP servers

## Tips for Effective Usage

1. **Start with /plan** - Always begin with clear requirements
2. **Use --parallel** - Maximize throughput with concurrent agents
3. **Review everything** - Multiple perspectives catch more issues
4. **Document patterns** - Turn successful flows into new commands
5. **Monitor metrics** - Track what works and improve

---

*These slash commands transform ClaudeBuild into a powerful orchestration system where complex multi-agent workflows become simple, repeatable operations.*