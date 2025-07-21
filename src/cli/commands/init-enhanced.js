const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const Logger = require('../utils/logger');
const Validator = require('../utils/validator');
const ProjectGenerator = require('../../core/templates/generator');

async function initProject() {
  Logger.info('Initializing new ClaudeBuild project...');
  
  // Check if already in a project
  if (Validator.isClaudeBuildProject()) {
    Logger.error('Already in a ClaudeBuild project!');
    return;
  }

  // Initialize generator
  const generator = new ProjectGenerator();
  try {
    await generator.initialize();
  } catch (error) {
    Logger.error('Failed to load project templates');
    Logger.debug(error.message);
    return;
  }

  // Get available project types
  const projectTypes = generator.getAvailableTypes();

  // Gather project information
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: path.basename(process.cwd()),
      validate: (input) => {
        if (!Validator.isValidProjectName(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'type',
      message: 'Project type:',
      choices: projectTypes.map(type => {
        const info = generator.getTemplateInfo(type);
        return {
          name: info ? info.name : type,
          value: type,
          short: type
        };
      })
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: (answers) => `A ${answers.type} project built with ClaudeBuild`
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'ClaudeBuild User'
    },
    {
      type: 'list',
      name: 'license',
      message: 'License:',
      choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
      default: 'MIT'
    }
  ]);

  // Add framework-specific questions
  if (answers.type === 'fullstack' || answers.type === 'frontend') {
    const frameworkAnswer = await inquirer.prompt({
      type: 'list',
      name: 'framework',
      message: 'Frontend framework:',
      choices: ['React', 'Vue', 'Angular', 'Svelte', 'None'],
      default: 'React'
    });
    answers.framework = frameworkAnswer.framework;
  }

  if (answers.type === 'backend' || answers.type === 'api') {
    const stackAnswer = await inquirer.prompt({
      type: 'list',
      name: 'stack',
      message: 'Backend stack:',
      choices: ['Node.js/Express', 'Node.js/Fastify', 'Python/FastAPI', 'Python/Django', 'Go/Gin'],
      default: 'Node.js/Express'
    });
    answers.stack = stackAnswer.stack;
  }

  const spinner = Logger.spinner('Creating project structure...');

  try {
    // Generate project using templates
    const projectPath = await generator.generate(
      answers.type,
      answers.name,
      process.cwd(),
      answers
    );

    // Create ClaudeBuild configuration
    const ConfigManager = require('../../core/config');
    const defaultConfig = ConfigManager.providers.default.getAll();
    
    const config = {
      project: {
        name: answers.name,
        type: answers.type,
        description: answers.description,
        version: defaultConfig.project.version,
        created: new Date().toISOString()
      },
      agents: defaultConfig.agents,
      workflows: {
        ...defaultConfig.workflows,
        default: `greenfield-${answers.type}`
      },
      integrations: defaultConfig.integrations,
      ui: defaultConfig.ui
    };

    const yaml = require('js-yaml');
    fs.writeFileSync(
      path.join(projectPath, '.claudebuild.yml'),
      yaml.dump(config)
    );

    // Create ClaudeBuild directories
    const claudebuildDirs = [
      '.claudebuild/agents',
      '.claudebuild/artifacts',
      '.claudebuild/logs',
      '.claudebuild/checkpoints'
    ];

    claudebuildDirs.forEach(dir => {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    });

    // Create STATUS_BOARD.md
    fs.writeFileSync(
      path.join(projectPath, '.claudebuild/STATUS_BOARD.md'),
      `# ${answers.name} Status Board

## Project Overview
**Project**: ${answers.name}
**Type**: ${answers.type}
**Status**: Planning
**Created**: ${new Date().toISOString()}

## Current Phase
📋 Planning - Ready to run \`claudebuild plan\`

## Notes
- Project initialized with ClaudeBuild
- Project type: ${answers.type}
- Run \`claudebuild plan\` to start the planning phase
`
    );

    spinner.succeed('Project initialized successfully!');
    
    Logger.newline();
    Logger.success(`Created ${answers.type} project: ${answers.name}`);
    Logger.newline();
    Logger.info('Project structure created with:');
    if (answers.framework) {
      Logger.info(`  • Frontend: ${answers.framework}`);
    }
    if (answers.stack) {
      Logger.info(`  • Backend: ${answers.stack}`);
    }
    Logger.info(`  • License: ${answers.license}`);
    Logger.newline();
    Logger.info('Next steps:');
    Logger.info(`  1. cd ${answers.name}`);
    Logger.info('  2. Review the generated README.md');
    Logger.info('  3. Run `claudebuild plan` to start planning');
    Logger.info('  4. Run `claudebuild build` to start development');
    
  } catch (error) {
    spinner.fail('Failed to initialize project');
    Logger.error(error.message);
    Logger.debug(error.stack);
  }
}

module.exports = { initProject };