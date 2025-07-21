/**
 * Base configuration provider interface
 */
class BaseConfigProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Get a configuration value by key
   * @param {string} key - Dot-notation key (e.g., 'agents.parallelLimit')
   * @returns {*} The value or undefined if not found
   */
  get(key) {
    throw new Error('get() must be implemented by subclass');
  }

  /**
   * Set a configuration value
   * @param {string} key - Dot-notation key
   * @param {*} value - The value to set
   */
  set(key, value) {
    throw new Error('set() must be implemented by subclass');
  }

  /**
   * Get all configuration values
   * @returns {object} All configuration values
   */
  getAll() {
    throw new Error('getAll() must be implemented by subclass');
  }

  /**
   * Check if provider has a specific key
   * @param {string} key - Dot-notation key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Helper to get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * Helper to set nested value in object using dot notation
   */
  setNestedValue(obj, key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, part) => {
      if (!current[part]) current[part] = {};
      return current[part];
    }, obj);
    target[lastKey] = value;
  }
}

module.exports = BaseConfigProvider;