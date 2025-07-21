const fs = require('fs').promises;
const path = require('path');

/**
 * Template engine for generating project files and structures
 */
class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.helpers = {
      camelCase: (str) => str.replace(/-([a-z])/g, g => g[1].toUpperCase()),
      pascalCase: (str) => {
        const camel = this.helpers.camelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
      },
      kebabCase: (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase(),
      snakeCase: (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase(),
      upperCase: (str) => str.toUpperCase(),
      lowerCase: (str) => str.toLowerCase(),
      year: () => new Date().getFullYear(),
      date: () => new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Register a template
   */
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Load templates from a directory
   */
  async loadTemplates(templateDir) {
    const entries = await fs.readdir(templateDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const templatePath = path.join(templateDir, entry.name);
        const template = await this.loadTemplate(templatePath);
        this.registerTemplate(entry.name, template);
      }
    }
  }

  /**
   * Load a single template
   */
  async loadTemplate(templatePath) {
    const configPath = path.join(templatePath, 'template.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    return {
      ...config,
      path: templatePath
    };
  }

  /**
   * Render a template with context
   */
  async render(templateName, outputPath, context) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Merge context with helpers
    const fullContext = {
      ...context,
      ...this.helpers
    };

    // Process the template
    await this.processTemplate(template, outputPath, fullContext);
  }

  /**
   * Process a template recursively
   */
  async processTemplate(template, outputPath, context) {
    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    // Process directories
    if (template.directories) {
      await this.createDirectories(template.directories, outputPath, context);
    }

    // Process files
    if (template.files) {
      await this.createFiles(template.files, outputPath, context, template.path);
    }

    // Process copies (static files)
    if (template.copy) {
      await this.copyFiles(template.copy, outputPath, template.path);
    }
  }

  /**
   * Create directory structure
   */
  async createDirectories(directories, basePath, context) {
    for (const dir of directories) {
      const dirPath = this.interpolate(dir, context);
      const fullPath = path.join(basePath, dirPath);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }

  /**
   * Create files from templates
   */
  async createFiles(files, basePath, context, templatePath) {
    for (const file of files) {
      const filePath = this.interpolate(file.path, context);
      const fullPath = path.join(basePath, filePath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Read template content
      let content;
      if (file.template) {
        const templateFile = path.join(templatePath, 'files', file.template);
        content = await fs.readFile(templateFile, 'utf8');
      } else if (file.content) {
        content = file.content;
      } else {
        content = '';
      }

      // Process content
      const processedContent = this.interpolate(content, context);
      
      // Write file
      await fs.writeFile(fullPath, processedContent);
      
      // Set permissions if specified
      if (file.mode) {
        await fs.chmod(fullPath, file.mode);
      }
    }
  }

  /**
   * Copy static files
   */
  async copyFiles(copies, basePath, templatePath) {
    for (const copy of copies) {
      const srcPath = path.join(templatePath, 'static', copy.from);
      const destPath = path.join(basePath, copy.to);
      
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      
      // Copy file
      await fs.copyFile(srcPath, destPath);
      
      // Set permissions if specified
      if (copy.mode) {
        await fs.chmod(destPath, copy.mode);
      }
    }
  }

  /**
   * Interpolate template variables
   */
  interpolate(template, context) {
    return template.replace(/\{\{(\s*[\w.()]+\s*)\}\}/g, (match, expression) => {
      const trimmed = expression.trim();
      
      // Handle function calls
      if (trimmed.includes('(') && trimmed.includes(')')) {
        const funcMatch = trimmed.match(/(\w+)\((.*)\)/);
        if (funcMatch) {
          const [, funcName, args] = funcMatch;
          const func = this.getNestedValue(context, funcName);
          
          if (typeof func === 'function') {
            // Parse arguments
            const parsedArgs = args
              .split(',')
              .map(arg => arg.trim())
              .filter(arg => arg)
              .map(arg => {
                // Remove quotes
                if ((arg.startsWith('"') && arg.endsWith('"')) ||
                    (arg.startsWith("'") && arg.endsWith("'"))) {
                  return arg.slice(1, -1);
                }
                // Try to get from context
                return this.getNestedValue(context, arg) || arg;
              });
            
            return func(...parsedArgs);
          }
        }
      }
      
      // Handle regular property access
      const value = this.getNestedValue(context, trimmed);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

module.exports = TemplateEngine;