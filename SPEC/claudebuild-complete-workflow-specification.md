# ClaudeBuild v2 Complete Workflow Specification: Local to GitHub.com Best Practices

## Executive Summary

This specification integrates GitHub 2025 best practices with ClaudeBuild v2's multi-agent architecture, ensuring proper workflow implementation from inception to closure. Every agent follows standardized local development and GitHub.com procedures for enterprise-grade development practices.

## 1. Agent-Integrated Git Flow Implementation

### Branch Strategy per Agent Role

#### 🧠 ClaudeBrain/Origin AI
- **Branch Pattern**: `brain/session-{timestamp}-{session-id}`
- **Purpose**: Initial intent capture and project setup
- **Merge Target**: `develop` (staging for orchestrator)

#### 🤖 Orchestrator Agent  
- **Branch Pattern**: `orchestrator/{feature-name}`
- **Purpose**: Primary GitHub repository management
- **Merge Target**: `main` (production deployment)
- **Responsibilities**:
  - Repository initialization with proper structure
  - Branch protection rule configuration
  - GitHub Actions workflow setup
  - Release management coordination

#### 📘 Planner Agent
- **Branch Pattern**: `planning/{epic-name}`
- **Purpose**: Task breakdown and issue management
- **Merge Target**: `develop`
- **GitHub Integration**:
  - Creates GitHub issues from task breakdown
  - Establishes milestone structure
  - Configures project board automation

#### 🏗️ Architect Agent
- **Branch Pattern**: `architecture/{component-name}`
- **Purpose**: Technical specifications and design
- **Merge Target**: `develop`
- **Deliverables**:
  - Technical specification documents in `SPEC/` directory
  - Architecture decision records (ADRs)
  - API documentation and schemas

#### 🛠️ Builder Agents (Multiple)
- **Branch Pattern**: `feature/{agent-id}-{task-name}`
- **Purpose**: Parallel feature implementation
- **Merge Target**: `develop`
- **Git Worktree Usage**:
  ```bash
  # Each builder agent works in isolated worktree
  git worktree add .worktrees/feature/{agent-id} feature/{agent-id}-{task-name}
  cd .worktrees/feature/{agent-id}
  # Agent performs implementation
  git add . && git commit -m "feat(component): implement feature"
  git push origin feature/{agent-id}-{task-name}
  ```

#### 🔍 Review Agents (QA, Security, UX, Docs)
- **Branch Pattern**: `review/{type}-{target-branch}`
- **Purpose**: Specialized code review and quality assurance
- **Merge Target**: Creates review reports, no direct merges
- **Process**:
  - Pull latest from target branches
  - Generate review reports in `reviews/` directory
  - Create GitHub issues for identified problems
  - Approve or reject merge requests

#### ✅ Manager Agent
- **Branch Pattern**: `integration/{milestone-name}`
- **Purpose**: Integration coordination and merge management
- **Merge Target**: `main` (after all validations)
- **Responsibilities**:
  - Validates all review approvals
  - Manages merge conflicts
  - Coordinates release preparation
  - Updates integration documentation

#### 🚀 Deploy Agent
- **Branch Pattern**: `release/{version}`
- **Purpose**: Release management and deployment
- **Merge Target**: `main` with version tags
- **Process**:
  - Creates release branches from `develop`
  - Manages semantic versioning
  - Coordinates deployment pipelines
  - Creates GitHub releases with automated changelogs

#### 📂 Doc/Archiver Agent
- **Branch Pattern**: `docs/{documentation-type}`
- **Purpose**: Documentation consolidation and maintenance
- **Merge Target**: `main` for documentation updates
- **Automation**:
  - Auto-generates API documentation
  - Updates README and user guides
  - Maintains documentation site via GitHub Pages

## 2. Commit Convention Integration

### ClaudeBuild Agent Commit Format
```
<agent-type>(<scope>): <description>

[optional body explaining what and why]

Agent: {agent-name}
Session: {session-id}
Quality: {quality-score}/100
Dependencies: [list of dependent commits/branches]

[optional footer(s)]
```

### Agent-Specific Commit Types
- **brain**: Initial intent and project setup
- **orchestrator**: Repository management and coordination
- **planning**: Task breakdown and project organization
- **architect**: Technical specifications and design
- **feat**: New feature implementation (Builder agents)
- **review**: Quality assurance and validation (Review agents)
- **integrate**: Merge coordination and conflict resolution (Manager)
- **release**: Version management and deployment (Deploy)
- **docs**: Documentation updates and maintenance (Doc/Archiver)

### Example Commits
```
brain(setup): initialize claudebuild workflow replication project

Captured user intent for multi-agent development platform with:
- Research-enhanced development methodology
- Knowledge capture and learning integration
- Production-ready implementation standards

Agent: claudebrain-001
Session: workflow-replication-2024-07-21
Quality: 100/100
```

```
feat(mcp-integration): implement enhanced MCP client with OAuth 2.1

- Add dynamic discovery service for MCP servers
- Implement context sharing between agents
- Apply circuit breaker pattern for resilience
- Integrate with KaibanJS task result passing

Agent: builder-mcp-001
Session: workflow-replication-2024-07-21
Quality: 95/100
Dependencies: [architect/agent-coordination, architect/github-workflow]
```

## 3. GitHub Repository Configuration for ClaudeBuild

### Repository Structure
```
claudebuild-v2/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── agent-task.md              # Agent-specific task template
│   │   ├── workflow-issue.md          # Workflow execution issues
│   │   ├── bug_report.md             # Standard bug reports
│   │   └── feature_request.md        # Feature enhancement requests
│   ├── PULL_REQUEST_TEMPLATE.md      # Enhanced PR template
│   ├── CODEOWNERS                    # Agent responsibility matrix
│   └── workflows/
│       ├── claudebuild-ci.yml        # Multi-agent CI pipeline
│       ├── agent-quality-gates.yml   # Agent-specific quality checks
│       ├── workflow-validation.yml   # Workflow execution validation
│       └── release-management.yml    # Automated release pipeline
├── src/
│   ├── enhanced-mcp/                 # MCP integration implementation
│   ├── agents/                       # Agent framework implementations
│   └── workflows/                    # Workflow coordination logic
├── SPEC/                             # Technical specifications (Architect output)
├── docs/                             # Documentation (Doc/Archiver output)
├── reviews/                          # Quality review reports (Review agents)
├── deployment/                       # Release management (Deploy agent)
├── mcp-server/                       # Knowledge capture (Learning system)
└── github-integration/               # GitHub workflow documentation
```

### Enhanced Issue Templates

#### Agent Task Template (.github/ISSUE_TEMPLATE/agent-task.md)
```markdown
---
name: Agent Task
about: Track specific agent task execution
title: '[AGENT] {agent-type}: {task-description}'
labels: agent-task, {agent-type}
assignees: ''
---

## Agent Information
- **Agent Type**: {agent-type}
- **Agent ID**: {agent-id}
- **Session**: {session-id}
- **Dependencies**: {list dependent tasks}

## Task Description
Brief description of what this agent needs to accomplish.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Quality score ≥ 95/100
- [ ] All dependencies resolved

## Agent-Specific Requirements
### For Builder Agents:
- [ ] Code implementation complete
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review approved

### For Review Agents:
- [ ] Review report generated
- [ ] Issues identified and documented
- [ ] Recommendations provided
- [ ] Approval/rejection decision made

### For Manager Agent:
- [ ] Integration validation complete
- [ ] Merge conflicts resolved
- [ ] Documentation updated
- [ ] Release readiness confirmed

## Workflow Integration
- **Branch**: {branch-name}
- **Merge Target**: {target-branch}
- **Estimated Time**: {time-estimate}
- **Priority**: {high/medium/low}
```

### CODEOWNERS for Agent Responsibilities
```
# ClaudeBuild v2 Agent Responsibility Matrix

# Global ownership
* @claudebuild-maintainers

# Agent Framework Core
/src/agents/ @orchestrator-agents @architect-agents
/src/enhanced-mcp/ @builder-agents
/src/workflows/ @manager-agents

# Technical Specifications
/SPEC/ @architect-agents @tech-leads

# Documentation
/docs/ @doc-archiver-agents @tech-writers
README.md @doc-archiver-agents @orchestrator-agents

# Quality Reviews
/reviews/ @review-agents @qa-team

# Deployment and Release
/deployment/ @deploy-agents @devops-team
/.github/workflows/ @orchestrator-agents @devops-team

# Knowledge and Learning Systems
/mcp-server/ @builder-agents @data-team

# GitHub Integration
/github-integration/ @orchestrator-agents
```

## 4. CI/CD Pipeline for Multi-Agent Workflow

### Agent Quality Gates Workflow
```yaml
name: ClaudeBuild Agent Quality Gates
on:
  push:
    branches: [main, develop, 'feature/**', 'architect/**', 'review/**']
  pull_request:
    branches: [main, develop]

jobs:
  agent-validation:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent-type: [brain, orchestrator, planner, architect, builder, review, manager, deploy, docs]
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Agent Context Validation
        run: |
          # Validate agent follows proper branch naming
          echo "Validating agent workflow compliance..."
          
      - name: Quality Score Validation
        run: |
          # Extract quality score from commit messages
          # Validate against 99% standard (95/100 minimum)
          echo "Validating quality scores..."
          
      - name: Agent-Specific Tests
        run: |
          case "${{ matrix.agent-type }}" in
            "builder")
              npm run test:implementation
              npm run test:integration
              ;;
            "review")
              npm run test:review-reports
              npm run validate:quality-scores
              ;;
            "architect")
              npm run validate:specifications
              npm run validate:documentation
              ;;
            *)
              npm run test:agent-framework
              ;;
          esac

  workflow-integration:
    needs: agent-validation
    runs-on: ubuntu-latest
    steps:
      - name: Validate Workflow Completion
        run: |
          # Check all required agents have completed their phases
          echo "Validating complete workflow execution..."
          
      - name: Knowledge Capture Validation
        run: |
          # Validate learning insights are captured
          echo "Validating knowledge capture..."
```

### Release Management Pipeline
```yaml
name: ClaudeBuild Release Management
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
        - patch
        - minor
        - major

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.CLAUDEBUILD_TOKEN }}
      
      - name: Agent Workflow Validation
        run: |
          # Validate all 9 agent phases completed
          echo "Validating complete agent workflow..."
          
      - name: Quality Gate Check
        run: |
          # Ensure overall quality ≥ 93/100
          echo "Validating quality gates..."
          
      - name: Knowledge Synthesis
        run: |
          # Generate final knowledge synthesis report
          echo "Generating knowledge synthesis..."
          
      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npx semantic-release
          
      - name: Deploy Agent Execution
        run: |
          # Execute deploy agent workflow
          echo "Executing deploy agent workflow..."
          
      - name: Documentation Update
        run: |
          # Execute doc/archiver agent workflow
          echo "Updating documentation..."
```

## 5. Agent Workflow State Management

### Workflow State Persistence
```json
{
  "workflow_id": "claudebuild-session-{timestamp}",
  "session_metadata": {
    "start_time": "2024-07-21T02:30:00Z",
    "methodology": "BMAD",
    "quality_standard": 99
  },
  "agent_states": {
    "brain": {
      "status": "completed",
      "branch": "brain/session-1753065941436-ho9to3",
      "quality_score": 100,
      "completion_time": "2024-07-21T02:35:00Z",
      "deliverables": ["project_metadata", "intent_documentation"],
      "next_agents": ["orchestrator"]
    },
    "orchestrator": {
      "status": "completed",
      "branch": "orchestrator/workflow-coordination",
      "quality_score": 100,
      "completion_time": "2024-07-21T02:45:00Z",
      "deliverables": ["repository_structure", "github_setup"],
      "next_agents": ["planner"]
    }
  },
  "quality_gates": {
    "overall_score": 93,
    "phase_appropriate": true,
    "gates_passed": ["architecture", "implementation", "review", "integration"],
    "gates_failed": []
  },
  "github_integration": {
    "repository_url": "https://github.com/insult0o/claudebuild-v2",
    "main_branch": "main",
    "active_branches": [],
    "pull_requests": [],
    "releases": ["v2.0.0-beta.1"]
  }
}
```

### Agent Handoff Protocol
```yaml
agent_handoff:
  trigger:
    - agent_completion: true
    - quality_validation: passed
    - deliverables_verified: true
  
  process:
    1. Current agent commits final changes
    2. Quality validation executed
    3. Next agent context prepared
    4. Agent state updated in workflow management
    5. GitHub issue updated with progress
    6. Next agent triggered with full context
  
  validation:
    - Branch protection rules enforced
    - CI/CD pipeline validates quality gates
    - Review agents validate deliverables
    - Manager agent coordinates integration
```

## 6. GitHub Integration Best Practices

### Pull Request Workflow for Agents
```markdown
## Agent Pull Request Template

### Agent Information
- **Agent Type**: {agent-type}
- **Agent ID**: {agent-id}
- **Session**: {session-id}
- **Quality Score**: {score}/100

### Changes Summary
Brief description of agent deliverables and implementations.

### Agent Deliverables
- [ ] Primary deliverable 1
- [ ] Primary deliverable 2
- [ ] Quality validations completed
- [ ] Integration tests passing

### Workflow Integration
- **Dependencies Satisfied**: [list resolved dependencies]
- **Next Agents Ready**: [list agents that can proceed]
- **Knowledge Captured**: [learning insights documented]

### Quality Validation
- [ ] Code quality ≥ 95/100 (for implementation agents)
- [ ] Documentation complete and accurate
- [ ] Security review passed (where applicable)
- [ ] Performance benchmarks met

### Review Requirements
- **Required Reviewers**: [agent-specific reviewers]
- **Specialized Reviews**: [security/performance/etc.]
- **Merge Strategy**: [squash/merge/rebase]
```

### GitHub Actions for Agent Coordination
```yaml
name: Agent Coordination
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  agent-workflow-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Extract Agent Information
        run: |
          # Parse agent type and session from PR
          echo "Extracting agent workflow context..."
          
      - name: Validate Agent Dependencies
        run: |
          # Check if all prerequisite agents completed
          echo "Validating agent dependencies..."
          
      - name: Quality Gate Enforcement
        run: |
          # Validate quality scores and standards
          echo "Enforcing quality gates..."
          
      - name: Update Workflow State
        run: |
          # Update centralized workflow state
          echo "Updating workflow state..."
          
      - name: Trigger Next Agents
        if: success()
        run: |
          # Automatically trigger next agents in sequence
          echo "Triggering next agents..."
```

## 7. Complete Workflow Implementation

### Workflow Execution Checklist
```markdown
## ClaudeBuild Complete Workflow Checklist

### Pre-Execution Setup
- [ ] Repository initialized with proper structure
- [ ] Branch protection rules configured
- [ ] CI/CD pipeline activated
- [ ] Agent framework deployed
- [ ] Quality gates configured (99% standard)

### Agent Execution Sequence
- [ ] 🧠 **ClaudeBrain**: Intent capture and project setup
- [ ] 🤖 **Orchestrator**: Repository management and coordination
- [ ] 📘 **Planner**: Task breakdown and issue management
- [ ] 🏗️ **Architect**: Technical specifications and research
- [ ] 🛠️ **Builder Agents**: Parallel implementation (x4)
- [ ] 🔍 **Review Agents**: Quality validation (QA, Security, UX, Docs)
- [ ] ✅ **Manager**: Integration coordination and merge management
- [ ] 🚀 **Deploy**: Release management and deployment
- [ ] 📂 **Doc/Archiver**: Documentation consolidation

### Quality Validation
- [ ] Overall quality score ≥ 93/100
- [ ] All agent-specific quality gates passed
- [ ] Security review completed (≥ 92/100)
- [ ] Code quality validated (≥ 95/100)
- [ ] Documentation complete (≥ 78/100)

### GitHub Integration
- [ ] All agent branches properly created and managed
- [ ] Pull requests follow agent-specific templates
- [ ] Code reviews completed by appropriate reviewers
- [ ] CI/CD pipeline validates all changes
- [ ] Release management executed properly

### Knowledge Capture
- [ ] Learning insights documented throughout workflow
- [ ] Experience database updated with patterns
- [ ] Knowledge graph expanded with new relationships
- [ ] Organizational intelligence preserved for future use

### Final Validation
- [ ] Complete workflow state documented
- [ ] All artifacts properly archived
- [ ] GitHub repository production-ready
- [ ] Community adoption materials prepared
```

This comprehensive specification ensures that ClaudeBuild v2 follows enterprise-grade development practices while maintaining the multi-agent coordination that makes it unique. Every aspect from local development to GitHub deployment is standardized and automated for consistent, high-quality outcomes.