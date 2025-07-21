// ClaudeBuild Main Application Entry Point
const Logger = require('./cli/utils/logger');

Logger.info('ClaudeBuild application starting...');
Logger.warn('This file is for development mode only');
Logger.info('Use the CLI via: claudebuild <command>');

// Export main modules for programmatic use
module.exports = {
  Logger,
  Config: require('./cli/utils/config'),
  Validator: require('./cli/utils/validator')
};