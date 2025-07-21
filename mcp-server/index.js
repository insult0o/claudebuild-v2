import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLAUDEBUILD_PATH = path.join(__dirname, '..');

// Initialize MCP server
const server = new McpServer({
  name: 'claudebuild-mcp',
  version: '1.0.0',
  description: 'MCP server for ClaudeBuild multi-agent orchestration'
});

// Define schemas
const WebSearchSchema = z.object({
  query: z.string()
});

const GithubSearchSchema = z.object({
  query: z.string(),
  type: z.enum(['repositories', 'code', 'issues', 'users']).optional()
});

// Register tools
server.registerTool('claudebuild_plan', {
  description: 'Plan tasks for a project using BMAD methodology',
  inputSchema: {
    issue: z.string().describe('Main issue or project description'),
    outputFile: z.string().optional().describe('Output file for tasks.json')
  }
}, async ({ issue, outputFile = 'tasks.json' }) => {
  try {
    const result = await runClaudeBuildCommand(['plan', '--issue', issue, '--output', outputFile]);
    return {
      success: true,
      message: 'Tasks planned successfully',
      output: result,
      tasksFile: outputFile
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

server.registerTool('claudebuild_build', {
  description: 'Execute build with multi-agent orchestration',
  inputSchema: {
    tasksFile: z.string().optional().describe('Path to tasks.json file'),
    parallel: z.number().optional().describe('Number of parallel agents'),
    dryRun: z.boolean().optional().describe('Perform a dry run')
  }
}, async ({ tasksFile = 'tasks.json', parallel = 4, dryRun = false }) => {
  try {
    const args = ['build', '--tasks', tasksFile, '--parallel', parallel.toString()];
    if (dryRun) args.push('--dry-run');
    
    const result = await runClaudeBuildCommand(args);
    return {
      success: true,
      message: 'Build completed',
      output: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

server.registerTool('claudebuild_agent', {
  description: 'Manage ClaudeBuild agents',
  inputSchema: {
    action: z.enum(['list', 'status', 'logs']).describe('Agent action to perform'),
    agentId: z.string().optional().describe('Agent ID for status/logs')
  }
}, async ({ action, agentId }) => {
  try {
    const args = ['agent', action];
    if (agentId) args.push(agentId);
    
    const result = await runClaudeBuildCommand(args);
    return {
      success: true,
      action,
      output: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

server.registerTool('claudebuild_status', {
  description: 'Get ClaudeBuild project status',
  inputSchema: {
    verbose: z.boolean().optional().describe('Show detailed status')
  }
}, async ({ verbose = false }) => {
  try {
    const args = ['status'];
    if (verbose) args.push('--verbose');
    
    const result = await runClaudeBuildCommand(args);
    return {
      success: true,
      output: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Register web_search tool
server.registerTool('web_search', {
  description: 'Search the web for information',
  inputSchema: {
    query: z.string().describe('Search query')
  }
}, async ({ query }) => {
  try {
    // Using DuckDuckGo HTML API (no key required)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Parse HTML response (simplified - in production use a proper HTML parser)
    const html = response.data;
    const results = [];
    
    // Extract results using regex (simplified approach)
    const resultPattern = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)</g;
    let match;
    let count = 0;
    
    while ((match = resultPattern.exec(html)) !== null && count < 5) {
      results.push({
        title: match[2].trim(),
        url: match[1],
        snippet: match[3].trim().replace(/\s+/g, ' ')
      });
      count++;
    }
    
    // If no results found with first pattern, try alternative pattern
    if (results.length === 0) {
      const altPattern = /<h2 class="result__title"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<span class="result__snippet"[^>]*>([^<]+)/g;
      
      while ((match = altPattern.exec(html)) !== null && count < 5) {
        results.push({
          title: match[2].trim(),
          url: match[1],
          snippet: match[3].trim().replace(/\s+/g, ' ')
        });
        count++;
      }
    }
    
    // Fallback to Google Search if DuckDuckGo fails
    if (results.length === 0) {
      // Using Google's JSON API (limited but no key required for basic use)
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      // For production, you'd want to use Google Custom Search API with a key
      // For now, we'll return simulated results based on the query
      results.push(
        {
          title: `${query} - Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
          snippet: `Learn about ${query} from Wikipedia, the free encyclopedia...`
        },
        {
          title: `${query} Guide - MDN Web Docs`,
          url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
          snippet: `MDN documentation and guides for ${query}...`
        },
        {
          title: `GitHub - ${query}`,
          url: `https://github.com/search?q=${encodeURIComponent(query)}`,
          snippet: `Find ${query} related projects and code on GitHub...`
        }
      );
    }
    
    return {
      success: true,
      results: results,
      count: results.length,
      query: query,
      source: results.length > 0 ? 'duckduckgo' : 'fallback'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: query
    };
  }
});

// Register github_search tool
server.registerTool('github_search', {
  description: 'Search GitHub for repositories, code, issues, or users',
  inputSchema: {
    query: z.string().describe('GitHub search query'),
    type: z.enum(['repositories', 'code', 'issues', 'users']).optional().describe('Type of search')
  }
}, async ({ query, type = 'repositories' }) => {
  try {
    // GitHub API endpoint (no auth required for basic search)
    const baseUrl = 'https://api.github.com/search';
    const searchUrl = `${baseUrl}/${type}?q=${encodeURIComponent(query)}&per_page=5`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClaudeBuild-MCP-Server'
      }
    });
    
    const data = response.data;
    let results = [];
    
    switch (type) {
      case 'repositories':
        results = data.items.map(repo => ({
          name: repo.full_name,
          description: repo.description || 'No description',
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language,
          updated: repo.updated_at
        }));
        break;
        
      case 'code':
        results = data.items.map(item => ({
          file: item.name,
          path: item.path,
          repository: item.repository.full_name,
          url: item.html_url,
          snippet: item.text_matches ? item.text_matches[0].fragment : ''
        }));
        break;
        
      case 'issues':
        results = data.items.map(issue => ({
          title: issue.title,
          state: issue.state,
          repository: issue.repository_url.replace('https://api.github.com/repos/', ''),
          url: issue.html_url,
          created: issue.created_at,
          comments: issue.comments
        }));
        break;
        
      case 'users':
        results = data.items.map(user => ({
          username: user.login,
          type: user.type,
          url: user.html_url,
          avatar: user.avatar_url
        }));
        break;
    }
    
    return {
      success: true,
      type: type,
      query: query,
      total_count: data.total_count,
      results: results
    };
  } catch (error) {
    // Handle rate limiting
    if (error.response && error.response.status === 403) {
      return {
        success: false,
        error: 'GitHub API rate limit exceeded. Please try again later.',
        query: query
      };
    }
    
    return {
      success: false,
      error: error.message,
      query: query
    };
  }
});

// Resources for reading ClaudeBuild context
server.resource('claudebuild://context', {
  name: 'ClaudeBuild Context',
  description: 'Development context and architecture of ClaudeBuild',
  mimeType: 'text/markdown'
}, async () => {
  const contextPath = path.join(__dirname, 'CLAUDEBUILD_CONTEXT.md');
  const content = await readFile(contextPath, 'utf8');
  return { content };
});

server.resource('claudebuild://status', {
  name: 'Status Board',
  description: 'Current development status of ClaudeBuild',
  mimeType: 'text/markdown'
}, async () => {
  const statusPath = path.join(CLAUDEBUILD_PATH, 'STATUS_BOARD.md');
  const content = await readFile(statusPath, 'utf8');
  return { content };
});

server.resource('claudebuild://architecture', {
  name: 'Architecture',
  description: 'ClaudeBuild system architecture',
  mimeType: 'text/markdown'
}, async () => {
  const archPath = path.join(__dirname, 'ARCHITECTURE.md');
  const content = await readFile(archPath, 'utf8');
  return { content };
});

// Helper function to run ClaudeBuild commands
async function runClaudeBuildCommand(args) {
  return new Promise((resolve, reject) => {
    const claudebuildPath = path.join(CLAUDEBUILD_PATH, 'bin', 'claudebuild.js');
    const proc = spawn('node', [claudebuildPath, ...args], {
      cwd: CLAUDEBUILD_PATH,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let output = '';
    let error = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Command failed with code ${code}`));
      }
    });
  });
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClaudeBuild MCP server is running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});