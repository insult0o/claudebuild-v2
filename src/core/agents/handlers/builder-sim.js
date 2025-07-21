const fs = require('fs').promises;
const path = require('path');
const Logger = require('../../../cli/utils/logger');

/**
 * Builder Agent Handler
 * Responsible for implementing stories and building features
 */
class BuilderAgentHandler {
  constructor() {
    this.name = 'builder';
    this.description = 'Story implementation and feature building';
  }

  async execute(context) {
    context.log('Builder Agent: Starting story implementation...');
    
    const { input } = context.task;
    const { story } = input;
    
    try {
      // Read the story file
      const storyContent = await context.readFile(story);
      context.log(`Loaded story: ${story}`);
      
      // Parse story to understand what needs to be built
      const storyDetails = this.parseStory(storyContent);
      
      // For now, simulate building
      context.updateStatus('analyzing story');
      context.updateProgress(20);
      
      await this.delay(2000);
      
      context.updateStatus('implementing features');
      context.updateProgress(50);
      
      await this.delay(3000);
      
      context.updateStatus('writing code');
      context.updateProgress(80);
      
      await this.delay(2000);
      
      context.updateStatus('completed');
      context.updateProgress(100);
      
      context.log('Builder Agent: Implementation complete');
      
      return {
        status: 'completed',
        story: story,
        implemented: true,
        files: [],
        message: `Story ${story} implementation complete`,
        metadata: {
          agent: this.name,
          timestamp: new Date().toISOString(),
          storyDetails: storyDetails
        }
      };
      
    } catch (error) {
      context.log(`Builder Agent failed: ${error.message}`);
      throw error;
    }
  }
  
  parseStory(content) {
    // Extract key information from story
    const lines = content.split('\n');
    const title = lines.find(l => l.startsWith('# Story'))?.replace('# Story ', '') || 'Unknown';
    const description = lines.find(l => l.startsWith('## Description'))?.replace('## Description', '').trim() || '';
    
    return {
      title,
      description,
      tasks: this.extractTasks(content)
    };
  }
  
  extractTasks(content) {
    const tasks = [];
    const lines = content.split('\n');
    let inAcceptanceCriteria = false;
    
    for (const line of lines) {
      if (line.includes('## Acceptance Criteria')) {
        inAcceptanceCriteria = true;
        continue;
      }
      if (inAcceptanceCriteria && line.startsWith('- [ ]')) {
        tasks.push(line.replace('- [ ]', '').trim());
      }
      if (inAcceptanceCriteria && line.startsWith('##')) {
        break;
      }
    }
    
    return tasks;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BuilderAgentHandler();