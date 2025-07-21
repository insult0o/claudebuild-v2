# Tool Discovery Cache

## Purpose
This document automatically captures valuable information discovered by agents through tool usage, creating a shared knowledge base for future agents.

## Structure
Each discovery is tagged with:
- Agent ID
- Tool used
- Query/context
- Key findings
- Timestamp

## Discoveries

### Web Search Results

#### React Best Practices (2024)
- **Agent**: builder-001
- **Query**: "React hooks best practices 2024"
- **Key Findings**:
  - Use `useMemo` and `useCallback` sparingly - only for expensive computations
  - Custom hooks should start with 'use' prefix
  - Avoid inline object/array creation in dependencies
- **Source**: https://react.dev/learn/best-practices
- **Date**: 2024-07-20

#### GitHub API Rate Limits
- **Agent**: planner-002  
- **Query**: "GitHub API rate limit handling"
- **Key Findings**:
  - Authenticated requests: 5000/hour
  - Check X-RateLimit headers
  - Use conditional requests with ETags
- **Source**: https://docs.github.com/en/rest/rate-limit
- **Date**: 2024-07-20

### PDF Extractions

#### System Requirements Template
- **Agent**: architect-001
- **File**: requirements-template.pdf
- **Key Sections**:
  - Functional Requirements checklist
  - Non-functional Requirements matrix
  - Acceptance Criteria format
- **Extracted Template**: See `/templates/requirements-template.md`
- **Date**: 2024-07-20

### Code Validation Patterns

#### Common JavaScript Issues
- **Agent**: qa-003
- **Files Validated**: 150+ files
- **Recurring Issues**:
  - Missing null checks (30% of errors)
  - Unhandled promise rejections (25%)
  - Implicit type coercion (20%)
- **Recommended ESLint Rules**: See `/config/eslint-recommended.json`
- **Date**: 2024-07-20

## Usage Guidelines

1. **Agents should check this cache** before making similar tool calls
2. **Auto-append new discoveries** after tool usage
3. **Reference cache entries** in story files and PRDs
4. **Periodic cleanup** of outdated entries (>6 months)

## Integration

Agents can reference cached discoveries:
```markdown
Per TOOL_DISCOVERY_CACHE.md#react-best-practices-2024, avoiding inline objects...
```

This cache grows organically as agents work, building institutional knowledge.