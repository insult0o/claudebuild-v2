# Automatic Authentication Setup

## Overview
ClaudeBuild is configured to automatically use GitHub credentials from environment variables, eliminating the need for manual authentication prompts.

## GitHub Access Configuration

### Method 1: MCP Server Environment (Recommended)
Configure in `~/.config/claude/config.json`:
```json
{
  "mcpServers": {
    "claudebuild": {
      "command": "node",
      "args": ["/home/insulto/claudebuild/mcp-server/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_actual_token_here"
      }
    }
  }
}
```

### Method 2: System Environment Variable
Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export GITHUB_TOKEN="ghp_your_actual_token_here"
```

### Method 3: ClaudeBuild Config
The system will also check for credentials in:
- `~/.claudebuild/credentials.json` (encrypted)
- Project-level `.env` file
- Global config store

## How It Works

1. **Agents automatically detect** GitHub operations needed
2. **Environment check cascade**:
   - First checks `process.env.GITHUB_TOKEN`
   - Then checks gh CLI authentication status
   - Finally checks ClaudeBuild credential store
3. **No prompts** - if token is found, operations proceed automatically
4. **Fallback behavior** - only prompts if no credentials found

## Token Requirements

Create a GitHub Personal Access Token with these scopes:
- `repo` - Full repository access
- `workflow` - Update GitHub Actions (if needed)
- `read:org` - Read org data (for private repos)

## Security Notes

- Tokens are never logged or displayed
- All GitHub operations use HTTPS
- Credentials stay in your environment
- No hardcoded secrets in code

## Usage Example

When agents need GitHub access, they'll automatically use the token:

```javascript
// In agent code - happens automatically
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// No manual intervention needed
const { data } = await octokit.repos.get({
  owner: 'user',
  repo: 'claudia'
});
```

## Troubleshooting

If GitHub operations fail:
1. Verify token is set: `echo $GITHUB_TOKEN`
2. Check token permissions on GitHub
3. Ensure token hasn't expired
4. Look in `.claudebuild/logs/` for detailed errors

With this setup, ClaudeBuild agents can seamlessly access GitHub repositories, read documentation, create PRs, and manage issues without any manual intervention.