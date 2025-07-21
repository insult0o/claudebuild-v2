# Story 001: Implement MCP Client in Agent Runtime

## Description
Add MCP client capabilities to the agent runtime so agents can connect to and use MCP servers.

## Acceptance Criteria
- [ ] Install @modelcontextprotocol/sdk in agent runtime
- [ ] Create MCPClient class that can connect to MCP servers
- [ ] Add MCP client instance to agent context
- [ ] Implement connection pooling for efficiency
- [ ] Add error handling and retry logic
- [ ] Create unit tests for MCP client

## Technical Details
- Modify `src/core/agents/runtime/node.js` to initialize MCP client
- Create `src/core/agents/mcp/client.js` for MCP client implementation
- Use stdio transport to connect to MCP servers
- Handle authentication if required

## Dependencies
- MCP server must be running and accessible
- Need to configure MCP server paths in agent config