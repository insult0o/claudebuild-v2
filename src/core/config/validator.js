/**
 * Configuration validator
 * Validates configuration values and schemas
 */
class ConfigValidator {
  constructor() {
    this.rules = {
      'project.type': {
        type: 'enum',
        values: ['fullstack', 'backend', 'frontend', 'cli', 'library', 'api']
      },
      'agents.parallelLimit': {
        type: 'number',
        min: 1,
        max: 10
      },
      'agents.timeout': {
        type: 'number',
        min: 1000,
        max: 3600000 // 1 hour max
      },
      'agents.retryAttempts': {
        type: 'number',
        min: 0,
        max: 5
      },
      'ui.dashboardPort': {
        type: 'number',
        min: 1024,
        max: 65535
      },
      'security.credentialStore': {
        type: 'enum',
        values: ['system', 'file', 'none']
      }
    };
  }

  /**
   * Validate a single configuration value
   * @param {string} key - The configuration key
   * @param {*} value - The value to validate
   * @returns {object} Validation result { valid: boolean, error?: string }
   */
  validate(key, value) {
    const rule = this.rules[key];
    
    if (!rule) {
      // No specific rule, allow any value
      return { valid: true };
    }

    // Type validation
    if (rule.type === 'enum') {
      if (!rule.values.includes(value)) {
        return {
          valid: false,
          error: `${key} must be one of: ${rule.values.join(', ')}`
        };
      }
    } else if (rule.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          valid: false,
          error: `${key} must be a number`
        };
      }
      
      if (rule.min !== undefined && value < rule.min) {
        return {
          valid: false,
          error: `${key} must be at least ${rule.min}`
        };
      }
      
      if (rule.max !== undefined && value > rule.max) {
        return {
          valid: false,
          error: `${key} must be at most ${rule.max}`
        };
      }
    } else if (rule.type === 'boolean') {
      if (typeof value !== 'boolean') {
        return {
          valid: false,
          error: `${key} must be true or false`
        };
      }
    } else if (rule.type === 'string') {
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `${key} must be a string`
        };
      }
      
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        return {
          valid: false,
          error: `${key} must match pattern: ${rule.pattern}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate an entire configuration object
   * @param {object} config - The configuration object
   * @returns {object} Validation result { valid: boolean, errors: string[] }
   */
  validateConfig(config) {
    const errors = [];
    
    // Check required fields
    const required = [
      'project.name',
      'project.type'
    ];
    
    for (const key of required) {
      const value = this.getNestedValue(config, key);
      if (value === undefined || value === null || value === '') {
        errors.push(`${key} is required`);
      }
    }

    // Validate all rules
    this.validateObject(config, '', errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Recursively validate an object
   */
  validateObject(obj, path, errors) {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Check if there's a rule for this path
      if (this.rules[fullPath]) {
        const result = this.validate(fullPath, value);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
      
      // Recurse into nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.validateObject(value, fullPath, errors);
      }
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * Add a custom validation rule
   * @param {string} key - The configuration key
   * @param {object} rule - The validation rule
   */
  addRule(key, rule) {
    this.rules[key] = rule;
  }
}

module.exports = ConfigValidator;