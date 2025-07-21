const BaseConfigProvider = require('./base');

/**
 * Environment variable configuration provider
 * Reads CLAUDEBUILD_* environment variables
 */
class EnvConfigProvider extends BaseConfigProvider {
  constructor() {
    super('environment');
    this.prefix = 'CLAUDEBUILD_';
  }

  get(key) {
    // Convert dot notation to underscore: agents.parallelLimit -> AGENTS_PARALLEL_LIMIT
    const envKey = this.prefix + key.split('.').map(part => part.replace(/([A-Z])/g, '_$1').toUpperCase()).join('_');
    const value = process.env[envKey];
    
    if (value === undefined) {
      return undefined;
    }

    // Try to parse JSON values
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, return as string
      // Convert 'true'/'false' strings to boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      
      // Try to parse as number
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') return num;
      
      return value;
    }
  }

  set(key, value) {
    const envKey = this.prefix + key.replace(/\./g, '_').toUpperCase();
    process.env[envKey] = typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  getAll() {
    const config = {};
    const prefixLength = this.prefix.length;
    
    Object.keys(process.env)
      .filter(key => key.startsWith(this.prefix))
      .forEach(envKey => {
        // Convert CLAUDEBUILD_AGENTS_PARALLEL_LIMIT to agents.parallelLimit
        const configKey = envKey
          .substring(prefixLength)
          .toLowerCase()
          .replace(/_([a-z])/g, (_, letter) => '.' + letter)
          .replace(/_/g, '');
        
        this.setNestedValue(config, configKey, this.get(configKey));
      });
    
    return config;
  }
}

module.exports = EnvConfigProvider;