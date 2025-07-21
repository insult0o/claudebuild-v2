# Story 002: Implement Tool Access Policy System

## Description
Create the user-governed tool access policy system that controls which MCP tools agents can use.

## Acceptance Criteria
- [ ] Create ToolAccessPolicy class with ask|allow|deny options
- [ ] Implement policy storage in configuration
- [ ] Add policy check before each tool invocation
- [ ] Create UI/CLI for users to set policies
- [ ] Implement session-level permissions
- [ ] Log all tool access requests and decisions

## Technical Details
- Create `src/core/agents/mcp/policy.js` for policy management
- Store policies in `.claudebuild/config/tool-policy.json`
- Integrate with ConfigManager for persistence
- Add hooks in MCP client for policy checks

## Example Policy Format
```json
{
  "default": "ask",
  "tools": {
    "web_search": "allow",
    "github_search": "ask",
    "file_system": "deny"
  },
  "session": {
    "web_search": "allow_session"
  }
}
```