const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const Logger = require('../../cli/utils/logger');
const TemplateEngine = require('./engine');

/**
 * Project generator using templates
 */
class ProjectGenerator {
  constructor() {
    this.engine = new TemplateEngine();
    this.templatesDir = path.join(__dirname, 'project-types');
  }

  /**
   * Initialize the generator by loading templates
   */
  async initialize() {
    await this.engine.loadTemplates(this.templatesDir);
  }

  /**
   * Generate a project from template
   */
  async generate(projectType, projectName, outputPath, options = {}) {
    // Validate project type
    if (!this.engine.templates.has(projectType)) {
      throw new Error(`Unknown project type: ${projectType}`);
    }

    // Prepare context
    const context = {
      projectName,
      projectType,
      ...options,
      year: new Date().getFullYear(),
      author: options.author || 'ClaudeBuild User',
      description: options.description || `A ${projectType} project built with ClaudeBuild`,
      license: options.license || 'MIT',
      claudebuildVersion: require('../../../package.json').version
    };

    // Generate project structure
    const projectPath = path.join(outputPath, projectName);
    await this.engine.render(projectType, projectPath, context);

    // Run post-generation tasks
    await this.runPostGeneration(projectType, projectPath, context);

    return projectPath;
  }

  /**
   * Run post-generation tasks
   */
  async runPostGeneration(projectType, projectPath, context) {
    const template = this.engine.templates.get(projectType);
    
    if (!template.postGenerate) {
      return;
    }

    const spinner = Logger.spinner('Running post-generation tasks...');

    try {
      for (const task of template.postGenerate) {
        spinner.text = task.message || 'Running task...';
        
        switch (task.type) {
          case 'npm':
            await this.runNpmTask(task, projectPath);
            break;
            
          case 'git':
            await this.runGitTask(task, projectPath);
            break;
            
          case 'command':
            await this.runCommandTask(task, projectPath);
            break;
            
          case 'function':
            await this.runFunctionTask(task, projectPath, context);
            break;
        }
      }
      
      spinner.succeed('Post-generation tasks completed');
    } catch (error) {
      spinner.fail('Post-generation task failed');
      throw error;
    }
  }

  /**
   * Run npm-related tasks
   */
  async runNpmTask(task, projectPath) {
    const cwd = task.cwd ? path.join(projectPath, task.cwd) : projectPath;
    
    switch (task.action) {
      case 'install':
        execSync('npm install', { cwd, stdio: 'ignore' });
        break;
        
      case 'init':
        if (!await this.fileExists(path.join(cwd, 'package.json'))) {
          execSync('npm init -y', { cwd, stdio: 'ignore' });
        }
        break;
        
      case 'add':
        if (task.packages) {
          const cmd = `npm install ${task.dev ? '--save-dev' : '--save'} ${task.packages.join(' ')}`;
          execSync(cmd, { cwd, stdio: 'ignore' });
        }
        break;
    }
  }

  /**
   * Run git-related tasks
   */
  async runGitTask(task, projectPath) {
    switch (task.action) {
      case 'init':
        if (!await this.fileExists(path.join(projectPath, '.git'))) {
          execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        }
        break;
        
      case 'add':
        execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
        break;
        
      case 'commit':
        try {
          execSync(`git commit -m "${task.message || 'Initial commit'}"`, { 
            cwd: projectPath, 
            stdio: 'ignore' 
          });
        } catch (error) {
          // Ignore if nothing to commit
        }
        break;
    }
  }

  /**
   * Run custom command tasks
   */
  async runCommandTask(task, projectPath) {
    const cwd = task.cwd ? path.join(projectPath, task.cwd) : projectPath;
    execSync(task.command, { cwd, stdio: 'ignore' });
  }

  /**
   * Run function tasks
   */
  async runFunctionTask(task, projectPath, context) {
    // This would be used for custom JavaScript functions
    // For now, we'll skip implementation
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available project types
   */
  getAvailableTypes() {
    return Array.from(this.engine.templates.keys());
  }

  /**
   * Get template info
   */
  getTemplateInfo(projectType) {
    const template = this.engine.templates.get(projectType);
    if (!template) {
      return null;
    }
    
    return {
      name: template.name,
      description: template.description,
      options: template.options || []
    };
  }
}

module.exports = ProjectGenerator;