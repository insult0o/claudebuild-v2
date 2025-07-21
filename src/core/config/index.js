const EnvConfigProvider = require('./providers/env');
const ProjectConfigProvider = require('./providers/project');
const GlobalConfigProvider = require('./providers/global');
const DefaultConfigProvider = require('./providers/default');
const SecureStorage = require('./secure-storage');
const Validator = require('./validator');

/**
 * Main configuration manager
 * Handles configuration hierarchy and value resolution
 */
class ConfigManager {
  constructor() {
    this.providers = {
      env: new EnvConfigProvider(),
      project: new ProjectConfigProvider(),
      global: new GlobalConfigProvider(),
      default: new DefaultConfigProvider()
    };

    // Configuration hierarchy (highest to lowest priority)
    this.hierarchy = [
      this.providers.env,
      this.providers.project,
      this.providers.global,
      this.providers.default
    ];

    this.secureStorage = SecureStorage;
    this.validator = new Validator();
    this._environment = process.env.CLAUDEBUILD_ENV || 'development';
  }

  /**
   * Get a configuration value
   * @param {string} key - Dot-notation key
   * @param {object} options - Options
   * @returns {*} The configuration value
   */
  get(key, options = {}) {
    // Check for environment-specific key first
    if (options.env || this._environment !== 'development') {
      const env = options.env || this._environment;
      const envKey = `environments.${env}.${key}`;
      
      for (const provider of this.hierarchy) {
        const value = provider.get(envKey);
        if (value !== undefined) {
          return this.resolveValue(value, options);
        }
      }
    }

    // Check standard key
    for (const provider of this.hierarchy) {
      const value = provider.get(key);
      if (value !== undefined) {
        return this.resolveValue(value, options);
      }
    }

    return undefined;
  }

  /**
   * Set a configuration value
   * @param {string} key - Dot-notation key
   * @param {*} value - The value to set
   * @param {object} options - Options (global, secure)
   */
  set(key, value, options = {}) {
    // Validate the value
    const validation = this.validator.validate(key, value);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.error}`);
    }

    // Handle secure values
    if (options.secure || this.isSecureKey(key)) {
      this.secureStorage.set(key, value);
      // Store a reference in config
      value = `secure:${key}`;
    }

    // Determine which provider to use
    const provider = options.global 
      ? this.providers.global 
      : this.providers.project;

    provider.set(key, value);
  }

  /**
   * Get all configuration values
   * @param {object} options - Options
   * @returns {object} All configuration values
   */
  getAll(options = {}) {
    // Start with defaults
    let config = this.providers.default.getAll();

    // Merge in reverse order (lowest to highest priority)
    const providers = [...this.hierarchy].reverse();
    for (const provider of providers) {
      if (provider === this.providers.default) continue;
      const providerConfig = provider.getAll();
      config = this.deepMerge(config, providerConfig);
    }

    // Apply environment overrides
    if (this._environment !== 'development') {
      const envConfig = config.environments?.[this._environment] || {};
      config = this.deepMerge(config, envConfig);
    }

    // Hide sensitive values unless requested
    if (!options.showSensitive) {
      config = this.hideSensitiveValues(config);
    }

    return config;
  }

  /**
   * Validate the current configuration
   * @returns {object} Validation result
   */
  validate() {
    const config = this.getAll();
    return this.validator.validateConfig(config);
  }

  /**
   * Get the current environment
   * @returns {string} The current environment
   */
  getEnvironment() {
    return this._environment;
  }

  /**
   * Set the current environment
   * @param {string} env - The environment name
   */
  setEnvironment(env) {
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(env)) {
      throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
    }
    this._environment = env;
  }

  /**
   * Resolve special value formats
   */
  resolveValue(value, options) {
    if (typeof value !== 'string') {
      return value;
    }

    // Handle env: references
    if (value.startsWith('env:')) {
      const envVar = value.substring(4);
      return process.env[envVar] || null;
    }

    // Handle secure: references
    if (value.startsWith('secure:')) {
      const key = value.substring(7);
      return options.showSensitive ? this.secureStorage.get(key) : '***';
    }

    return value;
  }

  /**
   * Check if a key should be stored securely
   */
  isSecureKey(key) {
    const secureKeys = [
      'apiKey', 'token', 'password', 'secret',
      'credential', 'private', 'auth'
    ];
    const keyLower = key.toLowerCase();
    return secureKeys.some(secure => keyLower.includes(secure));
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is a plain object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Hide sensitive values in config object
   */
  hideSensitiveValues(config, path = '') {
    if (!this.isObject(config)) {
      return config;
    }

    const hidden = {};
    
    Object.keys(config).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (this.isSecureKey(fullPath)) {
        hidden[key] = '***';
      } else if (this.isObject(config[key])) {
        hidden[key] = this.hideSensitiveValues(config[key], fullPath);
      } else if (typeof config[key] === 'string' && config[key].startsWith('secure:')) {
        hidden[key] = '***';
      } else {
        hidden[key] = config[key];
      }
    });
    
    return hidden;
  }
}

// Export singleton instance
module.exports = new ConfigManager();