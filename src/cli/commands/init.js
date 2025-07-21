const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const Logger = require('../utils/logger');
const Validator = require('../utils/validator');

async function initProject() {
  Logger.info('Initializing new ClaudeBuild project...');
  
  // Check if already in a project
  if (Validator.isClaudeBuildProject()) {
    Logger.error('Already in a ClaudeBuild project!');
    return;
  }

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
      choices: [
        { name: 'Full-Stack Application', value: 'fullstack' },
        { name: 'Backend Service', value: 'backend' },
        { name: 'Frontend Application', value: 'frontend' },
        { name: 'CLI Tool', value: 'cli' },
        { name: 'Library/Package', value: 'library' },
        { name: 'REST API', value: 'api' }
      ]
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A new ClaudeBuild project'
    },
    {
      type: 'confirm',
      name: 'useGit',
      message: 'Initialize git repository?',
      default: true
    }
  ]);

  const spinner = Logger.spinner('Creating project structure...');

  try {
    // Create directories
    const dirs = [
      '.claudebuild/agents',
      '.claudebuild/artifacts',
      '.claudebuild/logs',
      '.claudebuild/checkpoints',
      'docs',
      'src',
      'tests'
    ];

    dirs.forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
    });

    // Create configuration file using the config system defaults
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
    fs.writeFileSync('.claudebuild.yml', yaml.dump(config));

    // Create MAIN_ISSUE.md
    fs.writeFileSync('docs/MAIN_ISSUE.md', `# ${answers.name}

## Project Description
${answers.description}

## Project Type
${answers.type}

## Requirements
[Add your project requirements here]

## Success Criteria
[Define what success looks like for this project]
`);

    // Create STATUS_BOARD.md
    fs.writeFileSync('.claudebuild/STATUS_BOARD.md', `# ${answers.name} Status Board

## Project Overview
**Project**: ${answers.name}
**Type**: ${answers.type}
**Status**: Planning
**Created**: ${new Date().toISOString()}

## Current Phase
📋 Planning - Ready to run \`claudebuild plan\`

## Notes
- Project initialized with ClaudeBuild
- Run \`claudebuild plan\` to start the planning phase
`);

    // Initialize git if requested
    if (answers.useGit) {
      const { execSync } = require('child_process');
      execSync('git init', { stdio: 'ignore' });
      
      // Create .gitignore
      fs.writeFileSync('.gitignore', `node_modules/
.env
.claudebuild/logs/
.claudebuild/checkpoints/
dist/
*.log
.DS_Store
`);
    }

    spinner.succeed('Project initialized successfully!');
    
    Logger.newline();
    Logger.success(`Created ClaudeBuild project: ${answers.name}`);
    Logger.info('Next steps:');
    Logger.info('  1. Run `claudebuild plan` to start planning phase');
    Logger.info('  2. Run `claudebuild build` to start development');
    Logger.info('  3. Run `claudebuild dashboard` to monitor progress');
    
  } catch (error) {
    spinner.fail('Failed to initialize project');
    Logger.error(error.message);
  }
}

module.exports = { initProject };