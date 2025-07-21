# Story 003: Project Scaffolding

## Story Details
- **ID**: STORY-003
- **Epic**: Epic 1 - Project Initialization and Planning
- **Priority**: P0 (Must Have)
- **Estimated Effort**: 3 points
- **Status**: Draft
- **Dependencies**: STORY-001 (CLI Framework) ✅, STORY-002 (Configuration System) ✅

## User Story
As a developer, I want ClaudeBuild to automatically generate appropriate project structures and boilerplate code for different project types so that I can start development immediately with best practices built-in.

## Acceptance Criteria
- [ ] Enhanced `init` command creates complete project structure
- [ ] Support for multiple project types (fullstack, backend, frontend, cli, library, api)
- [ ] Each project type has appropriate directory structure
- [ ] Generate starter files with boilerplate code
- [ ] Create development environment files (.env, .gitignore, etc.)
- [ ] Initialize package managers (npm, pip, go.mod, etc.)
- [ ] Setup testing framework for each project type
- [ ] Generate README with project information
- [ ] Optional: Download and configure popular frameworks

## Technical Requirements

### Project Type Templates

#### Fullstack Project
```
project-name/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── README.md
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── tests/
│   ├── package.json
│   └── README.md
├── shared/
│   └── types/
├── docker-compose.yml
├── .claudebuild.yml
└── README.md
```

#### Backend Project
```
project-name/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── index.js
├── tests/
│   ├── unit/
│   └── integration/
├── config/
├── scripts/
├── package.json
├── .env.example
├── .claudebuild.yml
└── README.md
```

#### CLI Project
```
project-name/
├── src/
│   ├── commands/
│   ├── utils/
│   └── index.js
├── bin/
│   └── cli.js
├── tests/
├── package.json
├── .claudebuild.yml
└── README.md
```

### Implementation Tasks

#### Task 1: Create Template System
- [ ] Create template registry for project types
- [ ] Build template engine for file generation
- [ ] Support variable substitution in templates
- [ ] Create template loader
- [ ] Add template validation

#### Task 2: Implement Project Templates
- [ ] Create fullstack project template
- [ ] Create backend project template
- [ ] Create frontend project template
- [ ] Create CLI project template
- [ ] Create library project template
- [ ] Create API project template

#### Task 3: Enhance Init Command
- [ ] Add framework selection prompts
- [ ] Add language selection for some types
- [ ] Generate appropriate package.json/requirements.txt
- [ ] Create starter code files
- [ ] Setup test frameworks

#### Task 4: Development Environment Setup
- [ ] Generate .env.example files
- [ ] Create comprehensive .gitignore
- [ ] Setup linting configuration (ESLint, Prettier)
- [ ] Add Docker support (optional)
- [ ] Create development scripts

#### Task 5: Documentation Generation
- [ ] Generate project README
- [ ] Create API documentation template
- [ ] Add contribution guidelines
- [ ] Include ClaudeBuild usage guide
- [ ] Add architecture diagrams (mermaid)

## Code Examples

### Template Engine
```javascript
class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.helpers = {
      camelCase: (str) => str.replace(/-([a-z])/g, g => g[1].toUpperCase()),
      pascalCase: (str) => this.helpers.camelCase(str).replace(/^[a-z]/, g => g.toUpperCase()),
      kebabCase: (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase()
    };
  }

  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  render(templateName, context) {
    const template = this.templates.get(templateName);
    if (!template) throw new Error(`Template not found: ${templateName}`);
    
    return this.processTemplate(template, context);
  }

  processTemplate(template, context) {
    // Handle directory structure
    if (template.structure) {
      return this.generateStructure(template.structure, context);
    }
    
    // Handle file content
    if (template.content) {
      return this.renderContent(template.content, context);
    }
  }
}
```

### Project Generator
```javascript
class ProjectGenerator {
  async generate(projectType, projectName, options) {
    const template = await this.loadTemplate(projectType);
    const context = {
      projectName,
      projectType,
      ...options,
      year: new Date().getFullYear(),
      claudebuildVersion: require('../package.json').version
    };
    
    // Generate directory structure
    await this.createDirectories(template.directories, context);
    
    // Generate files
    await this.createFiles(template.files, context);
    
    // Run post-generation hooks
    await this.runHooks(template.hooks, context);
  }
}
```

### Enhanced Init Command
```javascript
async function initProject() {
  // ... existing prompts ...
  
  // Add framework selection
  if (answers.type === 'fullstack' || answers.type === 'frontend') {
    const frameworkAnswer = await inquirer.prompt({
      type: 'list',
      name: 'framework',
      message: 'Select framework:',
      choices: getFrameworkChoices(answers.type)
    });
    answers.framework = frameworkAnswer.framework;
  }
  
  // Add language selection for backend
  if (answers.type === 'backend' || answers.type === 'api') {
    const languageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'language',
      message: 'Select language:',
      choices: ['JavaScript', 'TypeScript', 'Python', 'Go']
    });
    answers.language = languageAnswer.language;
  }
  
  // Generate project
  const generator = new ProjectGenerator();
  await generator.generate(answers.type, answers.name, answers);
}
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Templates for all 6 project types
- [ ] Unit tests for template engine
- [ ] Integration tests for project generation
- [ ] Generated projects can run immediately
- [ ] Documentation updated
- [ ] Templates are customizable
- [ ] Works on all platforms

## Notes
- Consider using popular boilerplates as inspiration
- Make templates easily extensible for future additions
- Ensure generated code follows best practices
- Include helpful comments in generated code
- Consider adding interactive mode for customization

---
**Story created by**: SM Agent
**Date**: 2024-07-20
**Ready for development**: Yes