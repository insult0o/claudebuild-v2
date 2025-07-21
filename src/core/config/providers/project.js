const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const BaseConfigProvider = require('./base');

/**
 * Project configuration provider
 * Reads from .claudebuild.yml in project root
 */
class ProjectConfigProvider extends BaseConfigProvider {
  constructor(projectPath = process.cwd()) {
    super('project');
    this.projectPath = projectPath;
    this.configFile = path.join(projectPath, '.claudebuild.yml');
    this._cache = null;
    this._lastModified = null;
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return {};
      }

      const stats = fs.statSync(this.configFile);
      
      // Check if cache is still valid
      if (this._cache && this._lastModified && stats.mtime.getTime() === this._lastModified) {
        return this._cache;
      }

      const content = fs.readFileSync(this.configFile, 'utf8');
      this._cache = yaml.load(content) || {};
      this._lastModified = stats.mtime.getTime();
      
      return this._cache;
    } catch (error) {
      console.error(`Error loading project config: ${error.message}`);
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
      const yamlContent = yaml.dump(config, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      fs.writeFileSync(this.configFile, yamlContent, 'utf8');
      this._cache = config;
      this._lastModified = Date.now();
    } catch (error) {
      throw new Error(`Failed to save project config: ${error.message}`);
    }
  }

  exists() {
    return fs.existsSync(this.configFile);
  }
}

module.exports = ProjectConfigProvider;