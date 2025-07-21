/**
 * BMAD Agent Templates
 * Role-based agent configurations for the BMAD methodology
 */

const planner = require('./planner');
const architect = require('./architect');
const builder = require('./builder');
const reviewer = require('./reviewer');
const manager = require('./manager');
const qa = require('./qa');

// Additional specialized roles
const securityExpert = {
  id: 'security',
  name: 'Security Expert',
  description: 'Security analysis and vulnerability assessment specialist',
  systemPrompt: `You are a Security Expert focused on identifying and mitigating security risks...`,
  capabilities: ['threat-modeling', 'vulnerability-assessment', 'security-testing']
};

const devOps = {
  id: 'devops',
  name: 'DevOps Engineer',
  description: 'CI/CD pipeline and infrastructure specialist',
  systemPrompt: `You are a DevOps Engineer responsible for deployment pipelines and infrastructure...`,
  capabilities: ['ci-cd', 'infrastructure', 'monitoring', 'deployment']
};

const documentor = {
  id: 'documentor',
  name: 'Documentation Specialist',
  description: 'Technical documentation and knowledge management expert',
  systemPrompt: `You are a Documentation Specialist creating clear, comprehensive documentation...`,
  capabilities: ['api-docs', 'user-guides', 'architecture-docs', 'readme-creation']
};

/**
 * Get all available agent templates
 */
function getAllTemplates() {
  return {
    planner,
    architect,
    builder,
    reviewer,
    manager,
    qa,
    security: securityExpert,
    devops,
    documentor
  };
}

/**
 * Get template by role
 */
function getTemplate(role) {
  const templates = getAllTemplates();
  return templates[role] || null;
}

/**
 * Get templates by capability
 */
function getTemplatesByCapability(capability) {
  const templates = getAllTemplates();
  return Object.values(templates).filter(template =>
    template.capabilities.includes(capability)
  );
}

/**
 * Create custom agent from template
 */
function createAgent(role, customizations = {}) {
  const template = getTemplate(role);
  if (!template) {
    throw new Error(`Unknown agent role: ${role}`);
  }

  return {
    ...template,
    ...customizations,
    systemPrompt: customizations.systemPrompt 
      ? `${template.systemPrompt}\n\n${customizations.systemPrompt}`
      : template.systemPrompt
  };
}

module.exports = {
  // Individual templates
  planner,
  architect,
  builder,
  reviewer,
  manager,
  qa,
  security: securityExpert,
  devops,
  documentor,

  // Utility functions
  getAllTemplates,
  getTemplate,
  getTemplatesByCapability,
  createAgent,

  // Template categories
  categories: {
    planning: ['planner', 'architect'],
    development: ['builder', 'devops'],
    quality: ['reviewer', 'qa', 'security'],
    management: ['manager', 'documentor']
  }
};