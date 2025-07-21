# /build - Parallel Agent Builder Command

## Purpose
Spawns multiple Builder Agents to implement tasks in parallel using git worktrees.

## Usage
```
/build --from tasks.json --parallel 3
/build --task "implement-auth" --agent dev
/build --all --skip-deps
```

## Process

### 1. Task Loading
- Read tasks from `tasks.json` or specified file
- Analyze dependencies
- Create execution plan

### 2. Worktree Setup
For each task:
```bash
git worktree add -b feature/{task-id} .worktrees/{task-id}
```

### 3. Agent Spawning
- Launch agents in parallel (respecting --parallel limit)
- Each agent gets:
  - Task specification
  - Relevant context files
  - Access to MCP tools
  - Isolated workspace

### 4. Implementation Flow
Each agent:
1. Creates TODOs from spec
2. Implements step by step
3. Runs tests after each component
4. Commits changes incrementally
5. Creates PR when complete

### 5. Progress Tracking
- Update `STATUS_BOARD.md` in real-time
- Log all agent actions
- Track completion percentage
- Handle errors gracefully

## Options
- `--from` - Task file to read from
- `--parallel` - Number of concurrent agents (default: 3)
- `--task` - Single task ID to build
- `--all` - Build all pending tasks
- `--skip-deps` - Ignore dependency order
- `--no-test` - Skip test execution
- `--yolo` - Skip all confirmations

## Context Injection
Each agent receives:
- `CLAUDE.md` - Project overview
- Task-specific spec file
- Relevant MCP connections
- Previous agent outputs (if dependent)

## Error Handling
- Auto-retry failed tasks
- Create error reports
- Fallback to sequential if conflicts
- Alert on blocking issues

## Example
```bash
# Build all tasks with 5 parallel agents
/build --from tasks.json --parallel 5

# Build specific task
/build --task auth-001 --agent senior-dev

# YOLO mode - no confirmations
/build --all --yolo --parallel 10
```