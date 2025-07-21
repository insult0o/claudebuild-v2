const Logger = require('../utils/logger');
const ConfigManager = require('../../core/config');
const Table = require('cli-table3');
const chalk = require('chalk');

async function configCommand(action, key, value, options) {
  const validActions = ['get', 'set', 'list', 'validate', 'env'];
  
  if (!validActions.includes(action)) {
    Logger.error(`Invalid action: ${action}`);
    Logger.info(`Valid actions: ${validActions.join(', ')}`);
    return;
  }

  try {
    switch (action) {
      case 'get':
        await handleGet(key, options);
        break;
        
      case 'set':
        await handleSet(key, value, options);
        break;
        
      case 'list':
        await handleList(options);
        break;
        
      case 'validate':
        await handleValidate();
        break;
        
      case 'env':
        await handleEnvironment(key, options);
        break;
    }
  } catch (error) {
    Logger.error(`Config error: ${error.message}`);
  }
}

async function handleGet(key, options) {
  if (!key) {
    Logger.error('Key required for get action');
    Logger.info('Usage: claudebuild config get <key>');
    return;
  }

  const value = ConfigManager.get(key, { showSensitive: options.showSecrets });
  
  if (value === undefined) {
    Logger.warn(`Configuration key not found: ${key}`);
    return;
  }

  // Format output
  if (typeof value === 'object') {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(value);
  }
}

async function handleSet(key, value, options) {
  if (!key || value === undefined) {
    Logger.error('Key and value required for set action');
    Logger.info('Usage: claudebuild config set <key> <value>');
    return;
  }

  // Parse value if it looks like JSON
  let parsedValue = value;
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Keep as string if not valid JSON
    }
  } else if (value === 'true') {
    parsedValue = true;
  } else if (value === 'false') {
    parsedValue = false;
  } else if (!isNaN(value)) {
    parsedValue = Number(value);
  }

  // Set the value
  ConfigManager.set(key, parsedValue, {
    global: options.global,
    secure: options.secure
  });

  Logger.success(`Set ${key} = ${options.secure ? '***' : value}`);
  
  if (options.global) {
    Logger.info('Value saved to global configuration');
  } else {
    Logger.info('Value saved to project configuration');
  }
}

async function handleList(options) {
  const config = ConfigManager.getAll({ 
    showSensitive: options.showSecrets 
  });

  if (options.json) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  // Create a nice table display
  console.log(chalk.bold('\nCurrent Configuration:\n'));
  
  // Show environment
  console.log(chalk.gray('Environment:'), ConfigManager.getEnvironment());
  console.log();

  // Flatten config for table display
  const table = new Table({
    head: ['Key', 'Value', 'Source'],
    style: { head: ['cyan'] }
  });

  const flatConfig = flattenObject(config);
  
  Object.keys(flatConfig).sort().forEach(key => {
    // Skip environment-specific configs in main list
    if (key.startsWith('environments.')) return;
    
    const value = flatConfig[key];
    const source = getValueSource(key);
    
    table.push([
      key,
      formatValue(value),
      chalk.gray(source)
    ]);
  });

  console.log(table.toString());
}

async function handleValidate() {
  Logger.info('Validating configuration...');
  
  const result = ConfigManager.validate();
  
  if (result.valid) {
    Logger.success('Configuration is valid!');
  } else {
    Logger.error('Configuration validation failed:');
    result.errors.forEach(error => {
      Logger.error(`  • ${error}`);
    });
  }
}

async function handleEnvironment(env, options) {
  if (!env) {
    // Show current environment
    const current = ConfigManager.getEnvironment();
    console.log(`Current environment: ${current}`);
    return;
  }

  // Set environment
  try {
    ConfigManager.setEnvironment(env);
    Logger.success(`Switched to ${env} environment`);
  } catch (error) {
    Logger.error(error.message);
  }
}

// Helper functions
function flattenObject(obj, prefix = '') {
  const flat = {};
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flat, flattenObject(obj[key], fullKey));
    } else {
      flat[fullKey] = obj[key];
    }
  });
  
  return flat;
}

function getValueSource(key) {
  // Check each provider to see where the value comes from
  if (process.env[`CLAUDEBUILD_${key.replace(/\./g, '_').toUpperCase()}`]) {
    return 'env';
  }
  
  if (ConfigManager.providers.project.get(key) !== undefined) {
    return 'project';
  }
  
  if (ConfigManager.providers.global.get(key) !== undefined) {
    return 'global';
  }
  
  return 'default';
}

function formatValue(value) {
  if (value === null) return chalk.gray('null');
  if (value === undefined) return chalk.gray('undefined');
  if (typeof value === 'boolean') return chalk.yellow(value);
  if (typeof value === 'number') return chalk.green(value);
  if (Array.isArray(value)) return chalk.blue(`[${value.length} items]`);
  if (value === '***') return chalk.red('***');
  
  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + '...' : str;
}

module.exports = configCommand;