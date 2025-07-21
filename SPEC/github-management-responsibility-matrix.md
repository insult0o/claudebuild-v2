# GitHub Management Responsibility Matrix - ClaudeBuild v2

## Overview
This document defines the complete GitHub repository management responsibilities across all ClaudeBuild v2 agents, ensuring proper coordination of issues, branches, commits, PRs, and repository maintenance.

## 🔧 Core GitHub & Repository Management Responsibilities

### 🧠 ClaudeBrain / Origin AI
**GitHub Role**: Intent & Metadata Setup
- ✅ Logs user prompts into system memory
- ✅ Creates initial metadata (project name, description, tags)
- ✅ May predefine GitHub repository structure (repo.json, .gitignore, LICENSE)
- ❌ Does not directly interact with GitHub

### 🤖 Orchestrator Agent ✅ (PRIMARY RESPONSIBLE)
**GitHub Role**: Repository Creation & Sync Management
- ✅ **Creates the GitHub repository** (if new)
- ✅ **Initializes Git** (git init) and sets up remote origin
- ✅ **Connects local project to GitHub**
- ✅ **Keeps local + GitHub sync integrity**
- ✅ **Creates the initial issue** (MAIN ISSUE) and labels it
- ✅ **Triggers branch creation** using git worktree for Builder Agents
- ✅ **Pushes initial commits** and architecture templates
- ✅ **Delegates follow-up steps** to other agents
- ✅ **Global coordination** of all GitHub operations

### 📘 Planner Agent
**GitHub Role**: Issue Management
- ✅ **Generates sub-issues on GitHub** from tasks.json
- ✅ **Adds labels, priorities, dependencies** to issues
- ✅ **Links issues to specific Builder Agent IDs**
- ❌ Does not commit or push code

### 🏗️ Architect Agent
**GitHub Role**: Specification Documentation
- ✅ **Links specs to their sub-issues**
- ✅ **Can add documents/files** to the repo (e.g., SPEC/<task>.md)
- ✅ **Commits structured specs locally**
- ⚠️ **Orchestrator decides when to push** these

### 🛠️ Builder Agents (xN)
**GitHub Role**: Local Development & Commits
Each builder:
- ✅ **Clones the repo** (via git worktree)
- ✅ **Creates a branch** like feature/<task-name>
- ✅ **Works locally, commits changes** (atomic commits encouraged)
- ✅ **Signals completion** back to Orchestrator
- ❌ **Do not push or open PRs directly** (controlled by Manager)

### 🔍 Review Agents (QA, Security, UX, Docs)
**GitHub Role**: Code Review & Quality Assurance
- ✅ **Review code in branches** via GitHub PR interface
- ✅ **Comment, suggest, or approve**
- ✅ **Uses /review --hat=QA** etc. to trigger formal reviews
- ✅ **Can open GitHub discussions** if needed
- ❌ **Do not merge**

### ✅ Manager Agent ✅ (SECONDARY RESPONSIBLE)
**GitHub Role**: PR Management & Integration
- ✅ **Creates PRs for each finished subtask**
- ✅ **Triggers GitHub Actions / CI** to validate
- ✅ **Runs linter, security checks, test coverage**
- ✅ **Posts PR summary and result** back to MCP
- ✅ **Merges PRs to main or dev** upon approval
- ✅ **Cleans up branches and worktrees**

### 🚀 Deploy Agent
**GitHub Role**: Release Management
- ✅ **Creates release tags** (e.g. v1.0.0)
- ✅ **Publishes artifacts** (Docker images, release zips, etc.)
- ✅ **Updates CHANGELOG.md** and release notes in GitHub
- ✅ **Can trigger GitHub Pages** or deploy pipelines (if configured)

### 📂 Doc/Archiver Agent
**GitHub Role**: Documentation & Archive Management
- ✅ **Generates docs per module**
- ✅ **Summarizes flow & outcomes**
- ✅ **Archives PRD + plans + logs**
- ✅ **Maintains documentation consistency**

### 🧠 MCP Server
**GitHub Role**: Context & History Storage
Stores and indexes:
- ✅ **Commits**
- ✅ **PR metadata**
- ✅ **Review history**
- ✅ **Task-to-commit mappings**
- ✅ **Worktree status**
- ✅ **GitHub tokens/credentials** (securely)
- ✅ **Makes everything searchable** for other agents
- ✅ **Provides versioned repo trees** for contextual lookups

## ✅ Complete Responsibility Matrix

| Task | Responsible Agent | Backup/Support |
|------|------------------|----------------|
| **Repo Init / Push / Sync** | 🤖 Orchestrator Agent | 🧠 MCP Server |
| **Issue Creation** | 📘 Planner Agent | 🤖 Orchestrator Agent |
| **Spec commits** | 🏗️ Architect Agent | 🤖 Orchestrator Agent |
| **Coding & commits** | 🛠️ Builder Agents | 🤖 Orchestrator Agent |
| **Code Review** | 🔍 Review Agents | ✅ Manager Agent |
| **PR Creation & Merging** | ✅ Manager Agent | 🤖 Orchestrator Agent |
| **Deployment & Tags** | 🚀 Deploy Agent | ✅ Manager Agent |
| **Documentation** | 📂 Doc/Archiver Agent | 🏗️ Architect Agent |
| **Memory/Logs/Context** | 🧠 MCP Server | All Agents |
| **Global Control** | 🤖 Orchestrator Agent | ✅ Manager Agent |

## 🔄 GitHub Workflow Sequence

### 1. Project Initialization
```bash
🧠 ClaudeBrain → 🤖 Orchestrator → GitHub Repo Creation
```

### 2. Issue & Branch Management
```bash
📘 Planner → GitHub Issues → 🤖 Orchestrator → Git Worktrees
```

### 3. Development Cycle
```bash
🏗️ Architect → Specs → 🛠️ Builders → Local Commits → 🔍 Reviewers
```

### 4. Integration & Deployment
```bash
✅ Manager → PRs & Merging → 🚀 Deploy → Releases → 📂 Doc/Archiver
```

### 5. Knowledge Persistence
```bash
🧠 MCP Server ← All Agents (continuous logging and context storage)
```

## 🔐 Security & Access Control

### GitHub Token Management
- **🧠 MCP Server**: Stores GitHub tokens securely
- **🤖 Orchestrator Agent**: Has full repository access
- **✅ Manager Agent**: Has PR and merge permissions
- **🛠️ Builder Agents**: Read access + push to feature branches only
- **🔍 Review Agents**: Read access + comment permissions
- **🚀 Deploy Agent**: Release and tag creation permissions

### Branch Protection Rules
- **main/master**: Requires PR review and CI passing
- **feature/***: Builder agents can push directly
- **release/***: Deploy agent manages these branches
- **hotfix/***: Manager agent handles emergency fixes

## 🎯 Success Criteria

### Repository State Management
- ✅ **Consistent sync** between local and GitHub
- ✅ **No merge conflicts** from parallel development
- ✅ **Complete audit trail** of all changes
- ✅ **Proper branching strategy** maintained

### Issue Tracking
- ✅ **All work tracked** through GitHub issues
- ✅ **Clear dependencies** and progress visibility
- ✅ **Automated status updates** from agents

### Quality Assurance
- ✅ **All code reviewed** before merging
- ✅ **CI/CD pipelines** validate all changes
- ✅ **Documentation** kept up to date
- ✅ **Release management** properly coordinated

## 🚨 Emergency Procedures

### Repository Corruption
1. **🤖 Orchestrator Agent**: Detects and reports issue
2. **🧠 MCP Server**: Provides backup context and history
3. **✅ Manager Agent**: Coordinates recovery process
4. **All Agents**: Suspend operations until resolution

### Merge Conflicts
1. **✅ Manager Agent**: Detects conflicts during PR creation
2. **🛠️ Builder Agents**: Rebase and resolve conflicts
3. **🔍 Review Agents**: Re-review resolved conflicts
4. **✅ Manager Agent**: Re-attempt merge after resolution

### CI/CD Failures
1. **✅ Manager Agent**: Receives failure notifications
2. **🔍 Review Agents**: Analyze failure causes
3. **🛠️ Builder Agents**: Fix issues and recommit
4. **🚀 Deploy Agent**: Handles rollback if needed

---

**Updated**: 2024-07-21T04:45:00Z  
**Version**: 2.1  
**Status**: Production Ready  
**Compliance**: GitHub Enterprise & Organization Standards