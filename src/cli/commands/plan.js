const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const Validator = require('../utils/validator');
const ConfigManager = require('../../core/config');
const AgentManager = require('../../core/agents/manager');
const AgentRegistry = require('../../core/agents/registry');
const MessageBus = require('../../core/agents/message-bus');
const Prompt = require('../utils/prompt');
const chalk = require('chalk');

class PlanningOrchestrator {
  constructor(options) {
    this.options = options;
    this.config = ConfigManager.getInstance ? ConfigManager.getInstance() : ConfigManager;
    this.agentManager = require('../../core/agents/manager');
    this.messageBus = MessageBus;
    this.artifacts = {
      issue: null,
      prd: null,
      architecture: null,
      stories: [],
      tasks: []
    };
  }

  async execute() {
    try {
      // Initialize agent manager
      await this.agentManager.initialize();
      
      let iteration = 1;
      let approved = false;
      let refinementNotes = '';
      this.iteration = iteration;

      while (!approved) {
        Logger.info(`🚀 Starting BMAD planning phase (Iteration ${iteration})...`);
        Logger.newline();

        // Load issue/requirements
        await this.loadIssue(refinementNotes);

        // Phase 1: Requirements Analysis
        Logger.section('Phase 1: Requirements Analysis');
        await this.runPlannerAgent(refinementNotes);

        // Phase 2: Architecture Design
        Logger.section('Phase 2: Architecture Design');
        await this.runArchitectAgent(refinementNotes);

        // Phase 3: Story Creation
        Logger.section('Phase 3: Story Creation');
        await this.runScrumMasterAgent(refinementNotes);

        // Phase 4: Task Generation
        Logger.section('Phase 4: Task Generation');
        await this.generateTasks();

        // Save all artifacts
        await this.saveArtifacts();

        // Check if auto-approve or non-interactive mode
        if (this.options.autoApprove || this.options.noInteractive) {
          Logger.newline();
          Logger.info('📋 Auto-approving plan (--auto-approve flag used)');
          approved = true;
        } else {
          // Review and approval process
          approved = await this.reviewAndApprove();
          
          if (!approved) {
            refinementNotes = await this.getRefinementFeedback();
            iteration++;
            this.iteration = iteration;
            Logger.newline();
            Logger.info('♻️  Refining plan based on feedback...');
            Logger.newline();
          }
        }
      }

      Logger.newline();
      Logger.success('✅ Planning phase approved and complete!');
      Logger.info('Generated artifacts:');
      Logger.info('  • PRD.md - Product Requirements Document');
      Logger.info('  • architecture.md - Technical Architecture');
      Logger.info(`  • ${this.artifacts.stories.length} story files`);
      Logger.info('  • tasks.json - Executable task list');
      Logger.newline();
      Logger.info('Run `claudebuild build` to start development phase');

    } catch (error) {
      Logger.error('Planning phase failed:', error.message);
      throw error;
    }
  }

  async reviewAndApprove() {
    Logger.newline();
    Logger.section('📋 Planning Review');
    
    // Show summary of generated artifacts
    await this.showPlanSummary();
    
    Logger.newline();
    const viewDetails = await Prompt.confirm('Would you like to review the detailed plans?', true);
    
    if (viewDetails) {
      await this.showDetailedReview();
    }
    
    Logger.newline();
    Logger.info(chalk.bold('Planning Summary:'));
    Logger.info(`  • Total Stories: ${this.artifacts.stories.length}`);
    Logger.info(`  • Estimated Time: ${this.calculateTotalTime()}`);
    Logger.info(`  • Technology Stack: ${this.extractTechStack()}`);
    
    Logger.newline();
    const approved = await Prompt.confirm(
      chalk.bold.yellow('Do you approve this plan and want to proceed with building?'),
      true
    );
    
    return approved;
  }

  async showPlanSummary() {
    // Show PRD summary
    Prompt.showReview('PRD Summary', this.extractSummary(this.artifacts.prd, 300));
    
    // Show architecture summary
    Prompt.showReview('Architecture Summary', this.extractSummary(this.artifacts.architecture, 300));
    
    // Show stories overview
    const storiesOverview = this.artifacts.stories
      .map((story, i) => `  ${i + 1}. ${story.title} (${story.priority}, ${story.estimated_time})`)
      .join('\n');
    Prompt.showReview('Stories Overview', storiesOverview);
  }

  async showDetailedReview() {
    const options = [
      'View PRD.md',
      'View architecture.md',
      'View all stories',
      'View specific story',
      'View tasks.json',
      'Skip detailed review'
    ];
    
    let reviewing = true;
    while (reviewing) {
      Logger.newline();
      const choice = await Prompt.select('What would you like to review?', options);
      
      switch (choice) {
        case 'View PRD.md':
          Prompt.showReview('Full PRD', this.artifacts.prd);
          break;
          
        case 'View architecture.md':
          Prompt.showReview('Full Architecture', this.artifacts.architecture);
          break;
          
        case 'View all stories':
          for (let i = 0; i < this.artifacts.stories.length; i++) {
            Prompt.showReview(`Story ${i + 1}: ${this.artifacts.stories[i].title}`, 
                            this.artifacts.stories[i].content);
          }
          break;
          
        case 'View specific story':
          const storyNum = await Prompt.input('Enter story number');
          const index = parseInt(storyNum) - 1;
          if (index >= 0 && index < this.artifacts.stories.length) {
            Prompt.showReview(`Story ${storyNum}: ${this.artifacts.stories[index].title}`, 
                            this.artifacts.stories[index].content);
          }
          break;
          
        case 'View tasks.json':
          Prompt.showReview('Tasks Configuration', JSON.stringify(this.artifacts.tasks, null, 2));
          break;
          
        case 'Skip detailed review':
          reviewing = false;
          break;
      }
    }
  }

  async getRefinementFeedback() {
    Logger.newline();
    Logger.info(chalk.bold('Please provide refinement guidance:'));
    
    const feedbackType = await Prompt.select('What would you like to refine?', [
      'Add more requirements/context',
      'Change technical approach',
      'Adjust story breakdown',
      'Modify priorities/estimates',
      'General improvements'
    ]);
    
    Logger.newline();
    Logger.info('Enter your refinement notes (press Ctrl+D when done):');
    const feedback = await Prompt.multiline('');
    
    // Create structured refinement notes
    const refinementNotes = `
## Refinement Request
**Type**: ${feedbackType}
**User Feedback**:
${feedback}

**Previous Iteration Notes**:
- Ensure more thorough research using web_search tool
- Consider alternative approaches
- Break down complex stories further if needed
- Add more detailed acceptance criteria
`;

    // Optionally append to the original issue
    if (await Prompt.confirm('Would you like to add context to the original issue?', false)) {
      const additionalContext = await Prompt.multiline('Additional context:');
      this.artifacts.issue += `\n\n## Additional Context (Iteration ${this.refinementIteration || 1})\n${additionalContext}`;
      
      // Save updated issue
      if (this.options.issue) {
        await fs.writeFile(path.resolve(this.options.issue), this.artifacts.issue);
      }
    }
    
    return refinementNotes;
  }

  extractSummary(text, maxLength) {
    const lines = text.split('\n');
    let summary = '';
    for (const line of lines) {
      if (summary.length + line.length > maxLength) break;
      if (line.trim() && !line.startsWith('#')) {
        summary += line + '\n';
      }
    }
    return summary.trim() + '...';
  }

  calculateTotalTime() {
    return this.artifacts.stories
      .map(s => s.estimated_time || '0h')
      .reduce((total, time) => {
        const hours = parseInt(time) || 0;
        return total + hours;
      }, 0) + 'h';
  }

  extractTechStack() {
    const archContent = this.artifacts.architecture || '';
    const stackMatch = archContent.match(/## Technology Stack[\s\S]*?(?=##|$)/);
    if (stackMatch) {
      const stack = stackMatch[0]
        .split('\n')
        .filter(line => line.includes('-'))
        .map(line => line.split('-')[1]?.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');
      return stack || 'Not specified';
    }
    return 'Not specified';
  }

  async loadIssue(refinementNotes = '') {
    if (this.options.issue) {
      Logger.info(`📋 Loading issue from ${this.options.issue}`);
      const issuePath = path.resolve(this.options.issue);
      this.artifacts.issue = await fs.readFile(issuePath, 'utf-8');
    } else if (this.options.description) {
      Logger.info('📋 Using provided description');
      this.artifacts.issue = this.options.description;
    } else {
      // Try to find MAIN_ISSUE.md
      try {
        const issuePath = path.join(process.cwd(), 'MAIN_ISSUE.md');
        this.artifacts.issue = await fs.readFile(issuePath, 'utf-8');
        Logger.info('📋 Found MAIN_ISSUE.md');
      } catch (error) {
        throw new Error('No issue provided. Use --issue flag or create MAIN_ISSUE.md');
      }
    }
    
    // Add refinement notes if this is not the first iteration
    if (refinementNotes) {
      this.artifacts.issue = `${this.artifacts.issue}\n\n${refinementNotes}`;
    }
  }

  async runPlannerAgent(refinementNotes = '') {
    Logger.info('🤖 Launching Planner agent...');
    
    const task = {
      type: 'planning',
      phase: 'requirements',
      input: this.artifacts.issue,
      refinementNotes: refinementNotes,
      context: {
        project: this.options.project || 'unnamed-project',
        type: this.options.type,
        mcp: this.options.mcp,
        iteration: this.iteration || 1
      }
    };

    const result = await this.runAgent('planner', task);
    this.artifacts.prd = result.output;
    
    // Save PRD
    await fs.writeFile(
      path.join(process.cwd(), 'PRD.md'),
      this.artifacts.prd
    );
    
    Logger.success('✅ PRD.md created');
  }

  async runArchitectAgent(refinementNotes = '') {
    Logger.info('🏗️ Launching Architect agent...');
    
    const task = {
      type: 'architecture',
      phase: 'design',
      input: {
        issue: this.artifacts.issue,
        prd: this.artifacts.prd
      },
      refinementNotes: refinementNotes,
      context: {
        project: this.options.project,
        type: this.options.type,
        mcp: this.options.mcp,
        iteration: this.iteration || 1
      }
    };

    const result = await this.runAgent('architect', task);
    this.artifacts.architecture = result.output;
    
    // Save architecture
    await fs.writeFile(
      path.join(process.cwd(), 'architecture.md'),
      this.artifacts.architecture
    );
    
    Logger.success('✅ architecture.md created');
  }

  async runScrumMasterAgent(refinementNotes = '') {
    Logger.info('📋 Launching ScrumMaster agent...');
    
    const task = {
      type: 'story-creation',
      phase: 'planning',
      input: {
        issue: this.artifacts.issue,
        prd: this.artifacts.prd,
        architecture: this.artifacts.architecture
      },
      refinementNotes: refinementNotes,
      context: {
        project: this.options.project,
        type: this.options.type,
        mcp: this.options.mcp,
        iteration: this.iteration || 1
      }
    };

    const result = await this.runAgent('scrummaster', task);
    this.artifacts.stories = result.stories;
    
    // Save stories
    for (let i = 0; i < this.artifacts.stories.length; i++) {
      const story = this.artifacts.stories[i];
      await fs.writeFile(
        path.join(process.cwd(), `story-${String(i + 1).padStart(3, '0')}.md`),
        story.content
      );
    }
    
    Logger.success(`✅ Created ${this.artifacts.stories.length} story files`);
  }

  async generateTasks() {
    Logger.info('📝 Generating tasks.json...');
    
    const tasks = this.artifacts.stories.map((story, index) => ({
      id: `task-${String(index + 1).padStart(3, '0')}`,
      type: 'builder',
      agent: `builder-${String(index + 1).padStart(2, '0')}`,
      story: `story-${String(index + 1).padStart(3, '0')}.md`,
      description: story.title || `Implement story ${index + 1}`,
      dependencies: story.dependencies || [],
      priority: story.priority || 'medium',
      estimated_time: story.estimated_time || '2h',
      context: {
        architecture: 'architecture.md',
        prd: 'PRD.md'
      }
    }));

    this.artifacts.tasks = {
      project: this.options.project || path.basename(process.cwd()),
      created: new Date().toISOString(),
      planning_artifacts: {
        issue: this.options.issue || 'MAIN_ISSUE.md',
        prd: 'PRD.md',
        architecture: 'architecture.md',
        stories: this.artifacts.stories.map((_, i) => `story-${String(i + 1).padStart(3, '0')}.md`)
      },
      tasks: tasks,
      workflow: {
        parallel_limit: parseInt(this.options.parallel) || 4,
        auto_qa: true,
        auto_merge: false
      }
    };
  }

  async saveArtifacts() {
    // Save tasks.json
    await fs.writeFile(
      path.join(process.cwd(), 'tasks.json'),
      JSON.stringify(this.artifacts.tasks, null, 2)
    );
    
    // Create STATUS_BOARD.md
    const statusBoard = `# Project Status Board

## Overview
- **Project**: ${this.artifacts.tasks.project}
- **Created**: ${this.artifacts.tasks.created}
- **Total Stories**: ${this.artifacts.stories.length}
- **Status**: Planning Complete ✅

## Planning Artifacts
- ✅ MAIN_ISSUE.md
- ✅ PRD.md
- ✅ architecture.md
- ✅ ${this.artifacts.stories.length} story files
- ✅ tasks.json

## Next Steps
1. Review generated artifacts
2. Run \`claudebuild build\` to start development
3. Monitor progress in this file

## Story Status
${this.artifacts.stories.map((story, i) => 
  `- [ ] Story ${String(i + 1).padStart(3, '0')}: ${story.title || 'Pending'}`
).join('\n')}
`;

    await fs.writeFile(
      path.join(process.cwd(), 'STATUS_BOARD.md'),
      statusBoard
    );
  }

  async runAgent(type, task) {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if agent handler exists
        const agentHandler = AgentRegistry.getAgent(type);
        
        if (!agentHandler) {
          // Use MCP context if available
          if (this.options.mcp) {
            Logger.info(`Using MCP context for ${type} agent...`);
            // This would connect to MCP server for agent execution
            // For now, we'll simulate it
            resolve(await this.simulateAgent(type, task));
            return;
          }
          
          // Fall back to simulation for now
          Logger.warn(`No handler for ${type} agent, using simulation`);
          resolve(await this.simulateAgent(type, task));
          return;
        }

        const agentId = `${type}-${Date.now()}`;
        const agent = await this.agentManager.createAgent(agentId, {
          type: type,
          task: task
        });

        // Listen for completion
        agent.once('completed', (result) => {
          resolve(result);
        });

        agent.once('error', (error) => {
          reject(error);
        });

        // Start the agent
        await agent.start(task);

      } catch (error) {
        Logger.error(`Error in runAgent: ${error.message}`);
        if (error.stack) {
          Logger.debug(error.stack);
        }
        reject(error);
      }
    });
  }

  async simulateAgent(type, task) {
    // Simulate agent output for demonstration
    Logger.info(`Simulating ${type} agent output...`);
    
    switch (type) {
      case 'planner':
        return {
          output: `# Product Requirements Document (PRD)

## Project Overview
${task.input}

## Functional Requirements
1. Core functionality based on the issue description
2. User interface requirements
3. API requirements
4. Data storage requirements

## Non-Functional Requirements
1. Performance: Response time < 200ms
2. Security: Industry standard authentication
3. Scalability: Support 10k concurrent users
4. Reliability: 99.9% uptime

## Success Criteria
- All functional requirements implemented
- All tests passing
- Documentation complete
- Performance benchmarks met

Generated by Planner Agent`
        };

      case 'architect':
        return {
          output: `# System Architecture

## Overview
Technical architecture for implementing the requirements.

## Technology Stack
- Frontend: React/Next.js
- Backend: Node.js/Express
- Database: PostgreSQL
- Cache: Redis
- Queue: Bull/Redis

## Component Architecture
1. API Layer
2. Business Logic Layer
3. Data Access Layer
4. Frontend Components

## Design Patterns
- Repository Pattern for data access
- Service Pattern for business logic
- Observer Pattern for real-time updates

Generated by Architect Agent`
        };

      case 'scrummaster':
        return {
          stories: [
            {
              title: 'Setup project foundation',
              content: `# Story 001: Setup project foundation

## Description
Initialize the project with the chosen tech stack and basic structure.

## Acceptance Criteria
- [ ] Project initialized with package.json
- [ ] Basic folder structure created
- [ ] Development environment configured
- [ ] Linting and formatting setup

## Technical Notes
- Use the architecture defined in architecture.md
- Follow project conventions`,
              priority: 'high',
              estimated_time: '2h'
            },
            {
              title: 'Implement core API',
              content: `# Story 002: Implement core API

## Description
Create the core API endpoints as defined in the PRD.

## Acceptance Criteria
- [ ] API routes implemented
- [ ] Request validation added
- [ ] Error handling in place
- [ ] Basic tests written

## Technical Notes
- Follow RESTful conventions
- Implement proper error codes`,
              priority: 'high',
              estimated_time: '4h',
              dependencies: ['task-001']
            },
            {
              title: 'Create frontend components',
              content: `# Story 003: Create frontend components

## Description
Build the UI components for the user interface.

## Acceptance Criteria
- [ ] Component structure created
- [ ] Styling implemented
- [ ] Responsive design
- [ ] Accessibility standards met

## Technical Notes
- Use component library if specified
- Follow design system`,
              priority: 'medium',
              estimated_time: '3h',
              dependencies: ['task-001']
            }
          ]
        };

      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

async function planCommand(options) {
  try {
    // Check if in a project
    if (!Validator.isClaudeBuildProject()) {
      Logger.error('Not in a ClaudeBuild project! Run `claudebuild init` first.');
      return;
    }

    const orchestrator = new PlanningOrchestrator(options);
    await orchestrator.execute();

  } catch (error) {
    Logger.error('Planning failed:', error.message);
    if (error.stack) {
      Logger.debug('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

module.exports = planCommand;