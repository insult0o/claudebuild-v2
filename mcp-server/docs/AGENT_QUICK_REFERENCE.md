# ClaudeBuild v2 - Agent Quick Reference

> Fast access to essential information for all ClaudeBuild agents

## 🚀 Quick Links

### Primary Documentation
- **[GitHub Management Architecture](./GITHUB_MANAGEMENT_ARCHITECTURE.md)** - Complete GitHub workflow responsibilities
- **[System Architecture](../ARCHITECTURE.md)** - Overall system design
- **[Tool Usage Policy](../TOOL_CALL_POLICY.md)** - MCP tool usage guidelines
- **[Knowledge Sharing Protocol](../KNOWLEDGE_SHARING_PROTOCOL.md)** - Collaborative knowledge management

### Resource Endpoints (MCP)
```
claudebuild://github-management    # GitHub management guide
claudebuild://architecture         # System architecture
claudebuild://context             # Development context
claudebuild://status               # Current status board
claudebuild://conversations        # Complete conversation history
claudebuild://planning-conversation # Initial planning conversations
claudebuild://full-conversation    # Full v2 development conversation
claudebuild://conversation-updates # Recent conversation updates
```

## 🤖 Agent Responsibilities Matrix

| Agent | Primary GitHub Role | Key Responsibilities |
|-------|-------------------|---------------------|
| 🧠 **ClaudeBrain** | Context Setup | Intent logging, metadata creation |
| 🤖 **Orchestrator** | **PRIMARY: Repo Management** | Repository creation, sync integrity, branch coordination |
| 📘 **Planner** | Issue Management | Sub-issue creation, labeling, task breakdown |
| 🏗️ **Architect** | Specification Docs | Spec commits, architectural documentation |
| 🛠️ **Builder Agents** | Code Implementation | Local development in isolated worktrees |
| 🔍 **Review Agents** | Code Review | PR reviews, quality assurance, approval |
| ✅ **Manager** | **SECONDARY: PR Management** | PR creation, CI validation, merging |
| 🚀 **Deploy** | Release Management | Tagging, releases, deployment coordination |
| 🧠 **MCP Server** | Data & Analytics | Repository intelligence, credential management |

## 🔧 Essential Git Commands by Agent

### 🤖 Orchestrator Agent
```bash
# Repository setup
git init
git remote add origin https://github.com/user/project.git
git push -u origin main

# Worktree management  
git worktree add .worktrees/feature/auth-system feature/auth-system
git worktree list
git worktree remove .worktrees/feature/completed-task

# Sync operations
git fetch origin
git pull origin main
git push origin main
```

### 🛠️ Builder Agents
```bash
# Work in isolation
cd .worktrees/feature/your-task

# Commit with standards
git add .
git commit -m "✨ feat: implement authentication system

- Add JWT token generation and validation
- Implement secure password hashing
- Add comprehensive error handling

Closes: #3
Agent: builder-auth-001"

# Signal completion (don't push)
echo "TASK_COMPLETE" > .claudebuild/status
```

### ✅ Manager Agent
```bash
# Create PR (via GitHub API or CLI)
gh pr create --title "✨ Implement JWT Authentication" \
  --body "$(cat PR_TEMPLATE.md)" \
  --head feature/auth-system \
  --base main

# Merge after approval
gh pr merge 15 --squash --delete-branch
```

### 🚀 Deploy Agent
```bash
# Create release
git tag -a v1.0.0 -m "🚀 Release v1.0.0: Authentication System"
git push origin v1.0.0

# GitHub release
gh release create v1.0.0 --title "🚀 v1.0.0" --generate-notes
```

## 📋 Issue & PR Templates

### Issue Creation (Planner Agent)
```markdown
## Description
[Clear description of the feature/bug]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Assigned Agent
[Agent ID: builder-xxx-001]

## Dependencies
- Depends on: #[issue-number]
- Blocks: #[issue-number]

## Specification
[Link to SPEC/feature-name.md]

## Estimated Effort
[Small/Medium/Large]
```

### PR Template (Manager Agent)
```markdown
## 📋 Summary
[Brief description of changes]

## ✅ Changes Made
- Change 1
- Change 2
- Change 3

## 🧪 Testing
- Unit tests: [X]% coverage
- Integration tests: [Pass/Fail]
- Security scan: [Clean/Issues found]

## 📖 Documentation
- [ ] API docs updated
- [ ] README updated  
- [ ] Specification implemented

## 🔗 Related Issues
Closes #[issue-number]

## 👨‍💻 Agent Information
- Builder: [agent-id]
- Reviewer: [agent-id]
- Manager: [agent-id]

---
🤖 Generated with ClaudeBuild v2
```

## 🏷️ Commit Message Standards

### Emoji Types
```
✨ :sparkles:     - New feature
🐛 :bug:          - Bug fix
📚 :books:        - Documentation
🎨 :art:          - Code structure/format
⚡ :zap:          - Performance improvement
🔧 :wrench:       - Configuration
🧪 :test_tube:    - Tests
🔒 :lock:         - Security
🚀 :rocket:       - Deployment
♻️ :recycle:      - Refactoring
```

### Format Template
```
<emoji> <type>: <description>

- Detailed change 1
- Detailed change 2
- Detailed change 3

Closes: #<issue-number>
Agent: <agent-id>
```

## 🔒 Security Guidelines

### GitHub Token Management
- **Never commit tokens** to repository
- **Use environment variables** for credentials
- **Rotate tokens regularly** (30-day cycle)
- **Scope permissions minimally** per agent role

### Branch Protection
- **Require PR reviews** for main/develop branches
- **Require status checks** (CI, security scans)
- **Restrict force pushes** to protected branches
- **Require signed commits** for sensitive projects

## 🚨 Common Error Resolution

### Merge Conflicts
```bash
# Orchestrator handles conflicts
git fetch origin
git checkout feature/your-branch
git rebase origin/main
# Resolve conflicts manually
git add .
git rebase --continue
```

### Corrupted Worktree
```bash
# Remove and recreate
git worktree remove .worktrees/feature/broken
git worktree add .worktrees/feature/fixed feature/task-name
```

### Failed Deployment
```bash
# Rollback process
git tag -d v1.0.1  # Remove bad tag
git push origin :refs/tags/v1.0.1  # Remove from remote
gh release delete v1.0.1  # Delete release
```

## 📊 Performance Targets

### Repository Operations
- **Clone time**: < 30 seconds
- **Worktree creation**: < 5 seconds  
- **Sync operations**: < 10 seconds
- **PR creation**: < 15 seconds

### Agent Coordination
- **Issue creation**: < 30 seconds
- **Spec documentation**: < 2 minutes
- **Code review**: < 10 minutes
- **Merge approval**: < 5 minutes

## 🎯 Quality Metrics

### Code Quality
- **Test coverage**: > 80%
- **Lint compliance**: 100%
- **Security scan**: 0 critical issues
- **Documentation**: All public APIs documented

### Process Quality  
- **PR review time**: < 24 hours
- **Issue resolution**: < 7 days
- **Release frequency**: Weekly
- **Bug rate**: < 2% of features

## 📞 Agent Communication Patterns

### Status Updates
```json
{
  "agent": "builder-auth-001",
  "status": "in_progress", 
  "task": "#3",
  "progress": 75,
  "eta": "2024-01-15T16:00:00Z",
  "blockers": []
}
```

### Error Reporting
```json
{
  "agent": "builder-auth-001",
  "error": "compilation_failed",
  "task": "#3", 
  "details": "TypeScript compilation error in auth.ts:45",
  "action_needed": "architect_review"
}
```

### Completion Notification
```json
{
  "agent": "builder-auth-001",
  "status": "completed",
  "task": "#3",
  "artifacts": [
    "src/auth/jwt.ts",
    "tests/auth.test.ts",
    "docs/auth-api.md"
  ],
  "ready_for_review": true
}
```

## 🔍 Debugging & Monitoring

### Health Check Commands
```bash
# Repository health
git status
git log --oneline -10
git branch -av

# Worktree status
git worktree list
ls -la .worktrees/

# GitHub sync status  
git fetch origin
git status -uno
```

### Log Analysis
```bash
# Agent logs
tail -f .claudebuild/logs/agent-*.log

# GitHub webhook logs
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/user/repo/hooks/12345/deliveries
```

This quick reference provides agents with immediate access to essential GitHub management information, ensuring consistent and efficient collaboration across the ClaudeBuild v2 ecosystem.