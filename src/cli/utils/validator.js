const fs = require('fs');
const path = require('path');

class Validator {
  static isValidProjectName(name) {
    const pattern = /^[a-zA-Z0-9-_]+$/;
    return pattern.test(name);
  }

  static isValidPath(filePath) {
    try {
      const resolvedPath = path.resolve(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  static isDirectory(filePath) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (error) {
      return false;
    }
  }

  static isClaudeBuildProject(dir = '.') {
    const configFile = path.join(dir, '.claudebuild.yml');
    const claudebuildDir = path.join(dir, '.claudebuild');
    return this.fileExists(configFile) || this.fileExists(claudebuildDir);
  }

  static validateProjectType(type) {
    const validTypes = ['fullstack', 'backend', 'frontend', 'cli', 'library', 'api'];
    return validTypes.includes(type.toLowerCase());
  }

  static validateWorkflowType(type) {
    const validTypes = ['greenfield', 'brownfield'];
    return validTypes.includes(type.toLowerCase());
  }

  static validateAgentName(name) {
    const validAgents = ['analyst', 'pm', 'architect', 'dev', 'qa', 'devops'];
    return validAgents.includes(name.toLowerCase());
  }

  static validateParallelLimit(limit) {
    const num = parseInt(limit);
    return !isNaN(num) && num > 0 && num <= 10;
  }

  static async checkDependencies() {
    const issues = [];
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 18) {
      issues.push(`Node.js version 18+ required (current: ${nodeVersion})`);
    }

    // Check Git
    try {
      const { execSync } = require('child_process');
      execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
      issues.push('Git is not installed or not in PATH');
    }

    // Check Claude Code (optional)
    try {
      const { execSync } = require('child_process');
      execSync('claude-code --version', { stdio: 'ignore' });
    } catch (error) {
      // Not a critical error, just a warning
    }

    return issues;
  }
}

module.exports = Validator;