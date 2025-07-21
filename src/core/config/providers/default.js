const BaseConfigProvider = require('./base');

/**
 * Default configuration provider
 * Provides fallback values for all settings
 */
class DefaultConfigProvider extends BaseConfigProvider {
  constructor() {
    super('default');
    this.defaults = {
      project: {
        name: '',
        type: 'fullstack',
        version: '1.0.0',
        description: ''
      },
      agents: {
        parallelLimit: 4,
        timeout: 300000, // 5 minutes
        retryAttempts: 3,
        defaultModel: 'claude-3-opus-20240229'
      },
      workflows: {
        default: 'greenfield-fullstack',
        autoSave: true,
        gitIntegration: true
      },
      integrations: {
        claudeCode: {
          enabled: true,
          apiKey: null
        },
        github: {
          enabled: false,
          token: null
        },
        mcp: {
          enabled: false,
          tools: []
        }
      },
      environments: {
        development: {
          verboseLogging: true,
          dryRun: false,
          errorReporting: false
        },
        production: {
          verboseLogging: false,
          dryRun: false,
          errorReporting: true
        }
      },
      ui: {
        showBanner: true,
        colorOutput: true,
        progressBars: true,
        dashboardPort: 3000
      },
      security: {
        encryptCredentials: true,
        credentialStore: 'system' // 'system' | 'file' | 'none'
      }
    };
  }

  get(key) {
    return this.getNestedValue(this.defaults, key);
  }

  set(key, value) {
    // Defaults are read-only
    throw new Error('Cannot modify default configuration');
  }

  getAll() {
    return JSON.parse(JSON.stringify(this.defaults));
  }
}

module.exports = DefaultConfigProvider;