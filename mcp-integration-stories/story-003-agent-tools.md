# Story 003: Add MCP Tools to Agent Context

## Description
Expose MCP tools in the agent context so agents can use web_search, github_search, and other capabilities.

## Acceptance Criteria
- [ ] Add `tools` object to agent context
- [ ] Implement wrapper functions for common tools
- [ ] Add tool usage examples to agent handlers
- [ ] Update builder agent to use GitHub search
- [ ] Update planner agent to use web search
- [ ] Create integration tests

## Technical Details
- Modify agent context in `runtime/node.js` to include:
  ```javascript
  tools: {
    webSearch: (query) => mcpClient.callTool('web_search', { query }),
    githubSearch: (query) => mcpClient.callTool('github_search', { query }),
    readPdf: (url) => mcpClient.callTool('pdf_parser', { url })
  }
  ```
- Update agent handlers to demonstrate tool usage
- Add fallback behavior when tools unavailable

## Example Usage
```javascript
// In builder agent
const examples = await context.tools.githubSearch('React Router v6 examples');
const docs = await context.tools.webSearch('Express.js best practices 2024');
```