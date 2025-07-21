# Story 002: Configuration System

## Story Details
- **ID**: STORY-002
- **Epic**: Epic 1 - Project Initialization and Planning
- **Priority**: P0 (Must Have)
- **Estimated Effort**: 2 points
- **Status**: Draft
- **Dependencies**: STORY-001 (CLI Framework) ✅

## User Story
As a developer, I want to configure ClaudeBuild settings at both global and project levels so that I can customize agent behavior, integrations, and workflow preferences.

## Acceptance Criteria
- [ ] Global configuration stored in ~/.claudebuild/config.json
- [ ] Project configuration in .claudebuild.yml (YAML format)
- [ ] Environment variables override config values
- [ ] Configuration validation with helpful error messages
- [ ] Default values for all settings
- [ ] CLI commands to get/set config values
- [ ] Support for different environments (dev, prod)
- [ ] Secure storage for sensitive values (API keys)

## Technical Requirements

### Configuration Hierarchy (highest to lowest priority)
1. Environment variables (CLAUDEBUILD_*)
2. Project config (.claudebuild.yml)
3. Global config (~/.claudebuild/config.json)
4. Default values

### Configuration Schema
```yaml
# .claudebuild.yml
project:
  name: string
  type: fullstack|backend|frontend|cli|library|api
  description: string
  version: string

agents:
  parallelLimit: 1-10
  timeout: milliseconds
  retryAttempts: number
  defaultModel: string

workflows:
  default: string
  autoSave: boolean
  gitIntegration: boolean

integrations:
  claudeCode:
    enabled: boolean
    apiKey: env:CLAUDE_API_KEY
  github:
    enabled: boolean
    token: env:GITHUB_TOKEN
  mcp:
    enabled: boolean
    tools: []

environments:
  development:
    verboseLogging: true
    dryRun: false
  production:
    verboseLogging: false
    errorReporting: true

ui:
  showBanner: boolean
  colorOutput: boolean
  progressBars: boolean
  dashboardPort: number
```

### Implementation Tasks

#### Task 1: Enhance Config Manager
- [ ] Extend existing config.js with full hierarchy support
- [ ] Add YAML loading for project config
- [ ] Implement environment variable parsing
- [ ] Add config schema validation
- [ ] Create config merger for hierarchy

#### Task 2: Secure Credential Storage
- [ ] Implement encryption for sensitive values
- [ ] Create keychain integration (macOS)
- [ ] Add credential helper for Linux/Windows
- [ ] Support reading from env vars
- [ ] Never log sensitive values

#### Task 3: CLI Config Commands
- [ ] Add `claudebuild config get <key>` command
- [ ] Add `claudebuild config set <key> <value>` command
- [ ] Add `claudebuild config list` command
- [ ] Add `claudebuild config validate` command
- [ ] Add `--global` and `--project` flags

#### Task 4: Environment Support
- [ ] Implement environment detection
- [ ] Add `--env` flag to all commands
- [ ] Create environment-specific overrides
- [ ] Support .env file loading
- [ ] Add development/production presets

#### Task 5: Configuration Templates
- [ ] Create config init wizard
- [ ] Add preset templates (simple, advanced, enterprise)
- [ ] Generate .claudebuild.yml on init
- [ ] Add config migration tool
- [ ] Document all config options

## Code Examples

### Enhanced Config Manager
```javascript
class ConfigManager {
  constructor() {
    this.hierarchy = [
      new EnvConfigProvider(),
      new ProjectConfigProvider(),
      new GlobalConfigProvider(),
      new DefaultConfigProvider()
    ];
  }

  get(key, options = {}) {
    for (const provider of this.hierarchy) {
      const value = provider.get(key);
      if (value !== undefined) {
        return this.resolveValue(value, options);
      }
    }
    return undefined;
  }

  set(key, value, options = {}) {
    const provider = options.global 
      ? this.globalProvider 
      : this.projectProvider;
    provider.set(key, value);
  }

  resolveValue(value, options) {
    // Handle env: references
    if (typeof value === 'string' && value.startsWith('env:')) {
      const envVar = value.substring(4);
      return process.env[envVar];
    }
    // Handle secure: references
    if (typeof value === 'string' && value.startsWith('secure:')) {
      return this.secureStorage.get(value.substring(7));
    }
    return value;
  }
}
```

### Config Command Implementation
```javascript
// src/cli/commands/config.js
async function configCommand(action, key, value, options) {
  const config = require('../core/config');
  
  switch (action) {
    case 'get':
      const val = config.get(key);
      if (val !== undefined) {
        console.log(val);
      } else {
        Logger.error(`Config key not found: ${key}`);
      }
      break;
      
    case 'set':
      config.set(key, value, { global: options.global });
      Logger.success(`Set ${key} = ${value}`);
      break;
      
    case 'list':
      const all = config.getAll({ 
        showSensitive: false,
        environment: options.env 
      });
      console.log(JSON.stringify(all, null, 2));
      break;
  }
}
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for config hierarchy
- [ ] Integration tests for CLI commands
- [ ] Secure storage tested on all platforms
- [ ] Environment switching works correctly
- [ ] Documentation updated
- [ ] No sensitive data in logs
- [ ] Config validation prevents invalid states

## Notes
- Consider using `dotenv` for .env file support
- Use `keytar` for cross-platform credential storage
- Validate config on every load to catch errors early
- Provide clear migration path for config changes

---
**Story created by**: SM Agent
**Date**: 2024-07-20
**Ready for development**: Yes