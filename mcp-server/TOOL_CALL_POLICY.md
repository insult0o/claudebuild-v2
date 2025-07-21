# MCP Tool Access Control in ClaudeBuild

## Overview
ClaudeBuild implements a user-governed permission system for MCP tool access. This ensures human oversight while maintaining agent autonomy.

## Available MCP Tools

### 🔍 `web_search`
- **Purpose**: Search the web for documentation, examples, best practices
- **Risk Level**: Medium (external data access)
- **Common Uses**: API docs, library research, pattern examples

### 📄 `pdf_parser`
- **Purpose**: Extract text and structure from PDF documents
- **Risk Level**: Low (read-only operation)
- **Common Uses**: Requirements docs, technical specs, design documents

### ✅ `code_validator`
- **Purpose**: Validate code syntax, linting, type checking
- **Risk Level**: Low (static analysis only)
- **Common Uses**: Pre-commit validation, quality checks

### 🧪 `unit_test_runner` (Future)
- **Purpose**: Execute test suites
- **Risk Level**: Medium (code execution)
- **Common Uses**: Test validation, TDD workflow

## Permission Flow

1. **Agent Request**
   ```json
   {
     "intent": "request_tool",
     "tool": "web_search",
     "reason": "I need examples of React router usage to complete story-003."
   }
   ```

2. **User Prompt**
   ```
   🧠 Agent: Builder-02 wants to use web_search
   ❓ Reason: "I need examples of React router usage to complete story-003."
   
   Do you allow this tool use?
   🔘 Yes (once)
   🔘 Yes (always for this session)
   🔘 No
   🔘 No (skip this tool)
   ```

3. **Decision Effects**
   - **Yes (once)**: Allows single use, future requests require approval
   - **Yes (always for session)**: Grants permanent access for all agents this session
   - **No**: Denies request, agent continues without tool
   - **No (skip)**: Denies and instructs agent to skip the step

## Configuration

### Policy File Location
`config/tool_access_policy.json`

### Structure
```json
{
  "tool_access_policy": {
    "default": "ask",
    "tools": {
      "web_search": {
        "policy": "ask",
        "session_override": false
      },
      "pdf_parser": {
        "policy": "ask", 
        "session_override": false
      },
      "code_validator": {
        "policy": "ask",
        "session_override": false
      }
    }
  },
  "session_decisions": {
    "web_search": null,
    "pdf_parser": null,
    "code_validator": null
  }
}
```

## Logging

All tool requests and decisions are logged to:
`logs/tool_call_log.json`

### Log Entry Format
```json
{
  "timestamp": "2024-07-20T15:30:00Z",
  "agent": "Builder-02",
  "tool": "web_search",
  "reason": "Need React router examples",
  "decision": "yes_once",
  "session_id": "session-123"
}
```

## Agent Prompt Integration

All agents include this instruction:
> You have access to MCP tools such as `web_search`, `pdf_parser`, and `code_validator`.
> However, **you must always request permission from the user before using any tool**.
> Submit a tool access request stating which tool you want and why you need it.
> Await user approval before proceeding.

## Security Benefits

1. **Human Oversight**: Critical tool usage requires approval
2. **Audit Trail**: All requests and decisions logged
3. **Flexible Control**: Per-session or per-use granularity
4. **Safe Defaults**: "Ask first" policy prevents unauthorized access
5. **Context Awareness**: Agents must justify tool usage

## Future Enhancements

- **Role-based defaults**: QA agents auto-approved for validators
- **Time-based sessions**: Approvals expire after X hours
- **Quota limits**: Max uses per tool per session
- **Emergency override**: Admin bypass for critical operations