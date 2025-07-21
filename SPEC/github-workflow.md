# GitHub Workflow Management Specification

## Overview
This specification details the complete GitHub workflow management for ClaudeBuild v2, implementing our distributed responsibility model where each agent has specific GitHub-related duties under the coordination of the Orchestrator and Manager agents.

## 1. Agent Responsibility Matrix

### 1.1 Complete Responsibility Matrix

| Agent | GitHub Role | Key Actions | Repository Operations |
|-------|-------------|-------------|----------------------|
| 🧠 **ClaudeBrain** | Intent & Metadata Setup | Logs prompts, creates metadata, predefined structure | Pre-repository planning |
| 🤖 **Orchestrator** | ✅ **PRIMARY: Repo Creation & Sync** | Creates repo, git init, sync integrity, global coordination | `git init`, remote setup, worktree management, initial commits |
| 📘 **Planner** | Issue Management | Sub-issue creation from tasks.json, labeling, dependencies | GitHub Issues API, links to Builder IDs |
| 🏗️ **Architect** | Specification Documentation | Links specs to issues, commits SPEC/ files locally | Local commits of SPEC/ files, Orchestrator pushes |
| 🛠️ **Builder Agents (xN)** | Local Development & Commits | git worktree isolation, feature branches, atomic commits | Feature development, local commits only |
| 🔍 **Review Agents (QA/Security/UX/Docs)** | Code Review & Quality | PR reviews, /review --hat=QA, approval/concerns | GitHub PR review API, discussions |
| ✅ **Manager** | ✅ **SECONDARY: PR Management** | Creates PRs, CI validation, merging, cleanup | Pull request lifecycle, branch cleanup |
| 🚀 **Deploy** | Release Management | Release tags, artifacts, CHANGELOG.md updates | Release creation, tagging, deployment |
| 📂 **Doc/Archiver** | Documentation & Archive | Module docs, flow summaries, archives PRD/plans | Documentation consistency |
| 🧠 **MCP Server** | Context & History Storage | Commits/PR metadata, credentials, search | Audit, search, analytics, versioned trees |

### 1.2 GitHub Operation Mapping

#### Repository Level Operations
```javascript
// 🤖 Orchestrator Agent - Primary Responsible
const repositoryOps = {
  create: async (repoConfig) => {
    // Create GitHub repository
    const repo = await github.repos.createForAuthenticatedUser(repoConfig);
    
    // Initialize local git
    await exec('git init');
    await exec(`git remote add origin ${repo.clone_url}`);
    
    // Setup initial structure  
    await this.createInitialStructure();
    
    // Initial commit and push
    await exec('git add .');
    await exec('git commit -m "🎯 Initial repository setup\\n\\nSetup by ClaudeBuild Orchestrator Agent"');
    await exec('git push -u origin main');
    
    return repo;
  },
  
  syncIntegrity: async () => {
    // Ensure local and remote are synchronized
    await exec('git fetch origin');
    const status = await exec('git status --porcelain');
    
    if (status.length > 0) {
      await this.resolveConflicts();
    }
  }
};
```

#### Issue Management Operations  
```javascript
// 📘 Planner Agent - Responsible
const issueOps = {
  createSubIssue: async (taskConfig) => {
    const issue = await github.issues.create({
      title: taskConfig.title,
      body: this.formatIssueBody(taskConfig),
      labels: this.generateLabels(taskConfig),
      assignees: [taskConfig.assignedAgent],
      milestone: taskConfig.milestone
    });
    
    // Link to main issue
    await this.linkToMainIssue(issue.number, taskConfig.mainIssue);
    
    return issue;
  },
  
  updateProgress: async (issueNumber, progress) => {
    await github.issues.createComment({
      issue_number: issueNumber,
      body: `📊 Progress Update: ${progress.percentage}% complete\\n\\n${progress.details}`
    });
  }
};
```

#### Branch and Worktree Operations
```javascript
// 🤖 Orchestrator Agent - Worktree Management
const worktreeOps = {
  createAgentWorktree: async (agentId, taskId) => {
    const branchName = `feature/${taskId}`;
    const worktreePath = `.worktrees/${agentId}`;
    
    // Create feature branch
    await exec(`git checkout -b ${branchName}`);
    
    // Create isolated worktree
    await exec(`git worktree add ${worktreePath} ${branchName}`);
    
    // Setup agent environment
    await this.setupAgentEnvironment(worktreePath, agentId);
    
    return { branchName, worktreePath };
  },
  
  cleanupWorktree: async (agentId) => {
    const worktreePath = `.worktrees/${agentId}`;
    
    // Remove worktree
    await exec(`git worktree remove ${worktreePath}`);
    
    // Clean up branch if merged
    const merged = await this.isBranchMerged(agentId);
    if (merged) {
      await exec(`git branch -d feature/${agentId}`);
    }
  }
};

// 🛠️ Builder Agents - Local Development
const builderOps = {
  commitWork: async (agentId, workDescription) => {
    // Work in isolated worktree
    const worktreePath = `.worktrees/${agentId}`;
    process.chdir(worktreePath);
    
    // Commit changes
    await exec('git add .');
    await exec(`git commit -m "${this.formatCommitMessage(workDescription, agentId)}"`);
    
    // Signal completion (don't push yet)
    await this.signalCompletion(agentId);
  }
};
```

#### Pull Request Management
```javascript
// ✅ Manager Agent - PR Lifecycle
const prOps = {
  createPR: async (agentId, taskConfig) => {
    const pr = await github.pulls.create({
      title: `✨ ${taskConfig.title}`,
      head: `feature/${taskConfig.id}`,
      base: 'main',
      body: this.formatPRBody(taskConfig, agentId),
      draft: false
    });
    
    // Trigger CI/CD
    await this.triggerCI(pr.number);
    
    // Request reviews
    await this.requestReviews(pr.number, taskConfig.reviewers);
    
    return pr;
  },
  
  mergePR: async (prNumber, mergeStrategy = 'squash') => {
    // Validate CI status
    const checks = await this.validateCIStatus(prNumber);
    if (!checks.passed) {
      throw new Error('CI checks must pass before merge');
    }
    
    // Merge PR
    const merge = await github.pulls.merge({
      pull_number: prNumber,
      merge_method: mergeStrategy
    });
    
    // Cleanup branch
    await this.cleanupFeatureBranch(prNumber);
    
    return merge;
  }
};
```

## 2. Git Worktree Isolation Patterns

### 2.1 Worktree Architecture
```
project-root/
├── .git/                        # Main repository
├── .worktrees/                  # Agent isolation directory
│   ├── builder-auth/            # Authentication feature agent
│   │   ├── src/                 # Agent's view of source
│   │   ├── tests/               # Agent's tests
│   │   └── .claudebuild/        # Agent-specific config
│   ├── builder-ui/              # UI development agent
│   │   ├── components/          # UI components
│   │   └── stories/             # Storybook stories
│   └── builder-api/             # API development agent
│       ├── routes/              # API routes
│       └── middleware/          # API middleware
├── main codebase files...       # Shared codebase
└── .claudebuild/
    ├── agents/                  # Agent configurations
    ├── coordination/            # Coordination state
    └── integration/             # Integration queue
```

### 2.2 Isolation Implementation
```javascript
class WorktreeIsolation {
  async createIsolatedEnvironment(agentId, taskConfig) {
    // Create dedicated worktree
    const worktree = await this.createWorktree(agentId, taskConfig);
    
    // Setup agent-specific configuration
    await this.setupAgentConfig(worktree.path, agentId);
    
    // Install dependencies if needed
    await this.setupDependencies(worktree.path);
    
    // Create task context files
    await this.createTaskContext(worktree.path, taskConfig);
    
    return worktree;
  }
  
  async setupAgentConfig(worktreePath, agentId) {
    const agentConfig = {
      agentId,
      isolation: true,
      allowedPaths: this.calculateAllowedPaths(agentId),
      restrictedOperations: this.getRestrictions(agentId),
      toolAccess: this.getToolPermissions(agentId)
    };
    
    await fs.writeFile(
      path.join(worktreePath, '.claudebuild', 'agent.json'),
      JSON.stringify(agentConfig, null, 2)
    );
  }
}
```

### 2.3 Conflict Prevention
```javascript
class ConflictPrevention {
  async analyzeTaskConflicts(tasks) {
    const conflicts = [];
    
    // File-level conflict detection
    for (const taskA of tasks) {
      for (const taskB of tasks) {
        if (taskA.id !== taskB.id) {
          const overlap = this.detectFileOverlap(taskA, taskB);
          if (overlap.length > 0) {
            conflicts.push({
              type: 'file_conflict',
              tasks: [taskA.id, taskB.id],
              files: overlap,
              resolution: 'sequential_execution'
            });
          }
        }
      }
    }
    
    return this.resolveConflicts(conflicts);
  }
  
  async scheduleConflictFreeExecution(tasks, conflicts) {
    // Create execution groups avoiding conflicts
    const executionPlan = this.createExecutionPlan(tasks, conflicts);
    
    return {
      parallelGroups: executionPlan.parallel,
      sequentialSteps: executionPlan.sequential,
      totalEstimatedTime: executionPlan.estimatedTime
    };
  }
}
```

## 3. Branch and PR Workflows

### 3.1 Branch Naming Strategy
```javascript
const branchNamingConvention = {
  feature: 'feature/{task-id}',              // Builder agents
  bugfix: 'bugfix/{issue-number}',           // Bug fix work
  architecture: 'arch/{spec-name}',          // Architecture work
  documentation: 'docs/{doc-category}',      // Documentation updates
  release: 'release/{version}',              // Release preparation
  hotfix: 'hotfix/{critical-issue}'         // Emergency fixes
};

// Examples:
// feature/task-003-auth-system
// arch/database-design
// docs/api-specification
// release/v2.1.0
```

### 3.2 Commit Message Standards
```javascript
// Commit message format per agent type
const commitFormats = {
  architect: (spec, details) => `📋 arch: ${spec}\n\n${details}\n\nSpecification: SPEC/${spec}.md\nAgent: architect-001`,
  
  builder: (feature, details, taskId) => `✨ feat: ${feature}\n\n${details}\n\nCloses: #${taskId}\nAgent: builder-${taskId}`,
  
  qa: (validation, details) => `✅ test: ${validation}\n\n${details}\n\nAgent: qa-validation-001`,
  
  manager: (integration, details) => `🔀 merge: ${integration}\n\n${details}\n\nAgent: manager-001`
};
```

### 3.3 PR Templates
```markdown
## 📋 Pull Request Template (Manager Agent)

### Summary
[Brief description of changes]

### ✅ Changes Made
- Change 1: Description
- Change 2: Description  
- Change 3: Description

### 🧪 Testing
- [ ] Unit tests: X% coverage
- [ ] Integration tests: Pass/Fail
- [ ] Security scan: Clean/Issues found
- [ ] Performance tests: Pass/Fail

### 📖 Documentation
- [ ] API docs updated
- [ ] README updated
- [ ] Specification implemented
- [ ] Comments added for complex logic

### 🔗 Related Issues
Closes #[issue-number]
Relates to #[issue-number]

### 👨‍💻 Agent Information
- **Builder**: [agent-id]
- **Reviewer**: [agent-id] 
- **Manager**: [agent-id]

### 🔍 Review Checklist
- [ ] Code follows project standards
- [ ] Tests cover new functionality
- [ ] Documentation is complete
- [ ] Security considerations addressed
- [ ] Performance impact assessed

---
🤖 Generated with ClaudeBuild v2
```

## 4. Integration Coordination

### 4.1 Integration Queue Management
```javascript
class IntegrationCoordinator {
  constructor() {
    this.integrationQueue = [];
    this.mergeStrategies = new Map();
    this.conflictResolvers = new Map();
  }
  
  async queueForIntegration(agentId, artifacts) {
    // Validate integration readiness
    const validation = await this.validateIntegration(agentId, artifacts);
    
    if (!validation.ready) {
      throw new Error(`Integration not ready: ${validation.issues.join(', ')}`);
    }
    
    // Add to queue with priority
    this.integrationQueue.push({
      agentId,
      artifacts,
      priority: this.calculatePriority(artifacts),
      timestamp: Date.now(),
      dependencies: this.extractDependencies(artifacts)
    });
    
    // Process queue
    await this.processIntegrationQueue();
  }
  
  async processIntegrationQueue() {
    // Sort by dependencies and priority
    const sorted = this.topologicalSort(this.integrationQueue);
    
    for (const item of sorted) {
      try {
        await this.integrateItem(item);
        this.integrationQueue = this.integrationQueue.filter(i => i !== item);
      } catch (error) {
        await this.handleIntegrationError(item, error);
      }
    }
  }
}
```

### 4.2 Merge Strategies
```javascript
const mergeStrategies = {
  // Fast-forward for clean linear history
  fastForward: async (branch) => {
    await exec(`git merge --ff-only ${branch}`);
  },
  
  // Squash for feature completion
  squash: async (branch, message) => {
    await exec(`git merge --squash ${branch}`);
    await exec(`git commit -m "${message}"`);
  },
  
  // Merge commit for complex features
  mergeCommit: async (branch, message) => {
    await exec(`git merge --no-ff -m "${message}" ${branch}`);
  },
  
  // Rebase for clean history
  rebase: async (branch) => {
    await exec(`git rebase ${branch}`);
  }
};
```

## 5. Release Management

### 5.1 Release Workflow (Deploy Agent)
```javascript
class ReleaseManager {
  async createRelease(version, changes) {
    // Create release tag
    await exec(`git tag -a v${version} -m "🚀 Release v${version}"`);
    
    // Push tag
    await exec(`git push origin v${version}`);
    
    // Create GitHub release
    const release = await github.repos.createRelease({
      tag_name: `v${version}`,
      name: `🚀 ClaudeBuild v${version}`,
      body: this.generateReleaseNotes(changes),
      draft: false,
      prerelease: this.isPrerelease(version)
    });
    
    // Upload artifacts if available
    await this.uploadReleaseArtifacts(release.id);
    
    return release;
  }
  
  generateReleaseNotes(changes) {
    return `
## 🎯 What's New

${changes.features.map(f => `- ✨ ${f}`).join('\n')}

## 🐛 Bug Fixes

${changes.fixes.map(f => `- 🐛 ${f}`).join('\n')}

## 👥 Contributors

${changes.contributors.map(c => `- ${c.name} (@${c.github})`).join('\n')}

## 📊 Statistics

- Commits: ${changes.stats.commits}
- Files changed: ${changes.stats.files}
- Lines added: ${changes.stats.additions}
- Lines removed: ${changes.stats.deletions}

---
🤖 Generated with ClaudeBuild v2
    `.trim();
  }
}
```

## 6. Security and Permissions

### 6.1 GitHub Token Management
```javascript
// Secure token management per agent role
const tokenPermissions = {
  orchestrator: ['repo', 'admin:repo_hook', 'workflow'],
  planner: ['repo:status', 'issues:write'],
  architect: ['contents:write', 'pull_requests:read'],
  builder: ['contents:read'],
  reviewer: ['pull_requests:write', 'issues:write'],
  manager: ['repo', 'pull_requests:write'],
  deploy: ['repo', 'packages:write']
};

class SecurityManager {
  async rotateTokens() {
    // Rotate tokens every 30 days
    for (const [agent, permissions] of Object.entries(tokenPermissions)) {
      const newToken = await this.generateToken(agent, permissions);
      await this.updateAgentCredentials(agent, newToken);
    }
  }
  
  async auditPermissions() {
    // Regular permission audits
    const audit = await this.scanTokenUsage();
    return audit;
  }
}
```

### 6.2 Branch Protection Rules
```yaml
# GitHub branch protection configuration
main:
  required_status_checks:
    - claudebuild-ci
    - security-scan
    - test-coverage
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  restrictions:
    users: ['orchestrator-agent', 'manager-agent']
    teams: ['claudebuild-agents']

develop:
  required_status_checks:
    - claudebuild-ci
  required_pull_request_reviews:
    required_approving_review_count: 1
```

## 7. Monitoring and Analytics

### 7.1 Repository Health Metrics
```javascript
class RepositoryAnalytics {
  async collectMetrics() {
    return {
      commits: await this.getCommitStats(),
      pullRequests: await this.getPRStats(),
      issues: await this.getIssueStats(),
      contributors: await this.getContributorStats(),
      codeQuality: await this.getQualityMetrics(),
      performance: await this.getPerformanceMetrics()
    };
  }
  
  async generateHealthReport() {
    const metrics = await this.collectMetrics();
    
    return {
      overall: this.calculateHealthScore(metrics),
      trends: this.analyzeTrends(metrics),
      recommendations: this.generateRecommendations(metrics),
      alerts: this.identifyAlerts(metrics)
    };
  }
}
```

### 7.2 Agent Performance Tracking
```javascript
// Track agent GitHub activity
const agentMetrics = {
  commitFrequency: 'commits per hour',
  prSuccessRate: 'successful PR merges / total PRs',
  reviewTurnover: 'average time from PR to merge',
  conflictRate: 'merge conflicts / total merges',
  codeQuality: 'quality metrics from scans'
};
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Implement Orchestrator repository management
- [ ] Setup Planner issue management
- [ ] Create Architect specification workflow
- [ ] Test basic agent handoffs

### Phase 2: Isolation
- [ ] Implement git worktree management
- [ ] Create Builder agent isolation
- [ ] Setup conflict prevention
- [ ] Test parallel execution

### Phase 3: Integration
- [ ] Implement Manager PR workflow
- [ ] Create Review agent integration
- [ ] Setup Deploy agent release process
- [ ] Test end-to-end workflow

### Phase 4: Enhancement
- [ ] Add monitoring and analytics
- [ ] Implement security management
- [ ] Create performance optimization
- [ ] Add learning and adaptation

---

**Created by**: 🏗️ Architect Agent  
**Status**: Complete  
**Dependencies**: SPEC/agent-coordination.md  
**Next**: Implementation by Builder Agents  
**Related Issues**: #2 - Implement GitHub Management Specifications