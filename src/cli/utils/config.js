const fs = require('fs');
const path = require('path');
const os = require('os');

class Config {
  constructor() {
    this.configDir = path.join(os.homedir(), '.claudebuild');
    this.configFile = path.join(this.configDir, 'config.json');
    this.projectConfigFile = '.claudebuild.yml';
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  getGlobalConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading global config:', error);
    }
    return this.getDefaultConfig();
  }

  setGlobalConfig(config) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
  }

  getProjectConfig() {
    try {
      if (fs.existsSync(this.projectConfigFile)) {
        const yaml = require('js-yaml');
        return yaml.load(fs.readFileSync(this.projectConfigFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading project config:', error);
    }
    return null;
  }

  getDefaultConfig() {
    return {
      version: '1.0.0',
      agents: {
        parallelLimit: 4,
        timeout: 300000, // 5 minutes
        retryAttempts: 3
      },
      workflows: {
        default: 'greenfield-fullstack'
      },
      integrations: {
        claudeCode: true,
        mcpTools: false,
        gitAutoCommit: false
      },
      ui: {
        showBanner: true,
        colorOutput: true,
        verboseLogging: false
      }
    };
  }

  get(key) {
    const config = this.getGlobalConfig();
    return key.split('.').reduce((obj, k) => obj?.[k], config);
  }

  set(key, value) {
    const config = this.getGlobalConfig();
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {};
      return obj[k];
    }, config);
    target[lastKey] = value;
    this.setGlobalConfig(config);
  }
}

module.exports = new Config();