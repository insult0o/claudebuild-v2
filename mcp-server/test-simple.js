import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'test-server',
  version: '1.0.0'
});

// Test with simple schema
server.registerTool('test_tool', {
  description: 'A simple test tool',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  }
}, async ({ message }) => {
  return { result: `You said: ${message}` };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test server running...');
}

main().catch(console.error);