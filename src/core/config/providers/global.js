const fs = require('fs');
const path = require('path');
const os = require('os');
const BaseConfigProvider = require('./base');

/**
 * Global configuration provider
 * Reads from ~/.claudebuild/config.json
 */
class GlobalConfigProvider extends BaseConfigProvider {
  constructor() {
    super('global');
    this.configDir = path.join(os.homedir(), '.claudebuild');
    this.configFile = path.join(this.configDir, 'config.json');
    this._cache = null;
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return {};
      }
      
      if (this._cache) {
        return this._cache;
      }

      const content = fs.readFileSync(this.configFile, 'utf8');
      this._cache = JSON.parse(content);
      return this._cache;
    } catch (error) {
      console.error(`Error loading global config: ${error.message}`);
      return {};
    }
  }

  get(key) {
    const config = this.loadConfig();
    return this.getNestedValue(config, key);
  }

  set(key, value) {
    const config = this.loadConfig();
    this.setNestedValue(config, key, value);
    this.save(config);
  }

  getAll() {
    return this.loadConfig();
  }

  save(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf8');
      this._cache = config;
    } catch (error) {
      throw new Error(`Failed to save global config: ${error.message}`);
    }
  }
}

module.exports = GlobalConfigProvider;