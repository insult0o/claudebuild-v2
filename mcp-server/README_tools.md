# ClaudeBuild MCP Tools Reference

## Overview
This document provides detailed specifications for all MCP tools available in ClaudeBuild. Each tool requires user permission before use (see TOOL_CALL_POLICY.md).

## Available Tools

### 🔍 web_search

**Purpose**: Search the web for documentation, examples, and best practices

**Input Schema**:
```typescript
{
  query: string;        // Search query
  num_results?: number; // Number of results (default: 5)
  language?: string;    // Language code (default: "en")
}
```

**Output Schema**:
```typescript
{
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance_score: number;
  }>;
  query: string;
  timestamp: string;
}
```

**Example Call**:
```javascript
await use_tool('web_search', {
  query: 'React Router v6 nested routes example',
  num_results: 3
});
```

**Common Use Cases**:
- API documentation lookup
- Best practices research  
- Library usage examples
- Error message solutions
- Security vulnerability checks

---

### 📄 pdf_parser

**Purpose**: Extract text and structure from PDF documents

**Input Schema**:
```typescript
{
  file_path: string;     // Path to PDF file
  pages?: number[];      // Specific pages to extract (optional)
  extract_images?: bool; // Extract embedded images (default: false)
  extract_tables?: bool; // Extract table data (default: true)
}
```

**Output Schema**:
```typescript
{
  text: string;          // Extracted text content
  metadata: {
    title: string;
    author: string;
    pages: number;
    created: string;
  };
  tables: Array<{        // If extract_tables: true
    page: number;
    data: string[][];
  }>;
  images: Array<{        // If extract_images: true  
    page: number;
    path: string;
  }>;
}
```

**Example Call**:
```javascript
await use_tool('pdf_parser', {
  file_path: './docs/requirements.pdf',
  pages: [1, 2, 3],
  extract_tables: true
});
```

**Common Use Cases**:
- Requirements document parsing
- Technical specification import
- Design document analysis
- Legacy documentation conversion

---

### ✅ code_validator

**Purpose**: Validate code syntax, run linters, and check types

**Input Schema**:
```typescript
{
  file_paths: string[];   // Files to validate
  language: string;       // Programming language
  rules?: {              // Optional custom rules
    [key: string]: any;
  };
  fix?: boolean;         // Auto-fix issues (default: false)
}
```

**Output Schema**:
```typescript
{
  valid: boolean;
  issues: Array<{
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    rule: string;
  }>;
  stats: {
    files_checked: number;
    errors: number;
    warnings: number;
  };
}
```

**Example Call**:
```javascript
await use_tool('code_validator', {
  file_paths: ['./src/auth.js', './src/api.js'],
  language: 'javascript',
  fix: false
});
```

**Common Use Cases**:
- Pre-commit validation
- Code quality checks
- Style guide enforcement
- Type safety verification
- Security pattern detection

---

### 🧪 unit_test_runner (Planned)

**Purpose**: Execute unit tests and report results

**Input Schema**:
```typescript
{
  test_files?: string[];  // Specific test files (optional)
  pattern?: string;       // File pattern (e.g., "*.test.js")
  coverage?: boolean;     // Generate coverage report
  watch?: boolean;        // Watch mode (default: false)
}
```

**Output Schema**:
```typescript
{
  passed: boolean;
  results: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  failures: Array<{
    test: string;
    error: string;
    file: string;
  }>;
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}
```

---

### 🔧 git_helper (Planned)

**Purpose**: Git operations and analysis

**Input Schema**:
```typescript
{
  action: 'diff' | 'log' | 'status' | 'branch';
  options?: {
    [key: string]: any;
  };
}
```

---

## Tool Request Protocol

All agents must request permission before tool use:

```json
{
  "intent": "request_tool",
  "tool": "web_search",
  "reason": "I need to find the latest React best practices for hooks"
}
```

## Best Practices

1. **Justify Usage**: Always provide clear reasoning
2. **Batch Requests**: Group related searches when possible
3. **Cache Results**: Avoid redundant calls
4. **Handle Failures**: Tools may fail or be denied
5. **Respect Limits**: Don't spam tools unnecessarily

## Error Handling

Tools may return errors:
```typescript
{
  error: true;
  message: string;
  code: 'PERMISSION_DENIED' | 'TOOL_ERROR' | 'INVALID_INPUT';
}
```

Agents should gracefully handle tool unavailability and continue their work when possible.

## Available Documentation

- `ARCHITECTURE.md` - System architecture overview
- `IMPLEMENTATION_DETAILS.md` - Technical implementation details
- `INTEGRATION_GUIDE.md` - Integration instructions
- `TOOL_CALL_POLICY.md` - Tool usage policies
- `TOOL_DISCOVERY_CACHE.md` - Tool discovery system
- `GITHUB_MANAGEMENT_ARCHITECTURE.md` - Complete GitHub management and synchronization architecture

## Future Tools

- **database_query**: Query project databases
- **api_tester**: Test API endpoints
- **performance_profiler**: Profile code performance
- **security_scanner**: Scan for vulnerabilities
- **dependency_checker**: Analyze dependencies