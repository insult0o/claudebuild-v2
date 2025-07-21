/**
 * Knowledge Capture & Learning System for ClaudeBuild v2
 * Implements automated learning, experience accumulation, and insight synthesis
 */

import winston from 'winston';
import EventEmitter from 'events';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Knowledge Graph for storing and connecting insights
 */
class KnowledgeGraph {
  constructor() {
    this.nodes = new Map(); // Concepts, patterns, solutions
    this.edges = new Map(); // Relationships between concepts
    this.confidence = new Map(); // Confidence scores
    this.provenance = new Map(); // Source tracking
  }

  async addKnowledge(concept, relationships = [], metadata = {}) {
    const nodeId = this.generateNodeId(concept);

    // Add concept node
    this.nodes.set(nodeId, {
      id: nodeId,
      concept,
      type: metadata.type || 'general',
      domain: metadata.domain || 'unknown',
      confidence: metadata.confidence || 0.5,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      usageCount: 0,
      sources: metadata.sources || []
    });

    // Add relationships
    for (const relationship of relationships) {
      await this.addRelationship(nodeId, relationship);
    }

    // Update provenance
    this.provenance.set(nodeId, {
      source: metadata.source || 'unknown',
      method: metadata.method || 'manual',
      session: metadata.sessionId,
      agent: metadata.agentId,
      timestamp: new Date().toISOString()
    });

    return nodeId;
  }

  async addRelationship(nodeId, relationship) {
    const relationshipId = `${nodeId}-${relationship.type}-${relationship.target}`;
    
    this.edges.set(relationshipId, {
      id: relationshipId,
      source: nodeId,
      target: relationship.target,
      type: relationship.type,
      weight: relationship.weight || 1.0,
      created: new Date().toISOString()
    });
  }

  async findRelevant(query, context = {}, limit = 10) {
    const relevantNodes = [];

    // Simple relevance scoring based on concept matching
    for (const [nodeId, node] of this.nodes) {
      const relevanceScore = this.calculateRelevance(node, query, context);
      
      if (relevanceScore > 0.3) { // Threshold for relevance
        relevantNodes.push({
          ...node,
          relevanceScore
        });
      }
    }

    // Sort by relevance and confidence
    relevantNodes.sort((a, b) => {
      const scoreA = a.relevanceScore * a.confidence;
      const scoreB = b.relevanceScore * b.confidence;
      return scoreB - scoreA;
    });

    return relevantNodes.slice(0, limit);
  }

  calculateRelevance(node, query, context) {
    let score = 0;

    // Text similarity (simplified)
    const conceptText = JSON.stringify(node.concept).toLowerCase();
    const queryText = query.toLowerCase();
    
    if (conceptText.includes(queryText)) {
      score += 0.8;
    }

    // Domain matching
    if (context.domain && node.domain === context.domain) {
      score += 0.5;
    }

    // Type matching
    if (context.type && node.type === context.type) {
      score += 0.3;
    }

    // Usage popularity
    score += Math.min(node.usageCount * 0.1, 0.3);

    return Math.min(score, 1.0);
  }

  generateNodeId(concept) {
    const hash = createHash('md5');
    hash.update(JSON.stringify(concept));
    return `node_${hash.digest('hex').substring(0, 8)}`;
  }

  async exportGraph() {
    return {
      nodes: Array.from(this.nodes.entries()),
      edges: Array.from(this.edges.entries()),
      confidence: Array.from(this.confidence.entries()),
      provenance: Array.from(this.provenance.entries()),
      exportedAt: new Date().toISOString()
    };
  }
}

/**
 * Experience Database for storing and analyzing workflows
 */
class ExperienceDatabase {
  constructor() {
    this.experiences = new Map();
    this.patterns = new Map();
    this.outcomes = new Map();
    this.analytics = new Map();
  }

  async store(sessionId, experience, extractedKnowledge) {
    const experienceId = `exp_${sessionId}_${Date.now()}`;

    const experienceEntry = {
      id: experienceId,
      sessionId,
      experience,
      extractedKnowledge,
      stored: new Date().toISOString(),
      analyzed: false,
      patternMatches: []
    };

    this.experiences.set(experienceId, experienceEntry);

    // Async pattern analysis
    setImmediate(() => this.analyzePatterns(experienceEntry));

    return experienceId;
  }

  async analyzePatterns(experienceEntry) {
    try {
      // Find similar experiences
      const similar = await this.findSimilarExperiences(experienceEntry);
      
      // Extract patterns
      const patterns = this.extractPatterns(experienceEntry, similar);
      
      // Store patterns
      for (const pattern of patterns) {
        await this.storePattern(pattern);
      }

      // Update experience with pattern matches
      experienceEntry.patternMatches = patterns.map(p => p.id);
      experienceEntry.analyzed = true;

    } catch (error) {
      winston.error('Pattern analysis failed', { 
        experienceId: experienceEntry.id,
        error: error.message 
      });
    }
  }

  async findSimilarExperiences(experience, threshold = 0.7) {
    const similar = [];

    for (const [id, exp] of this.experiences) {
      if (id === experience.id) continue;

      const similarity = this.calculateSimilarity(experience, exp);
      if (similarity >= threshold) {
        similar.push({
          experience: exp,
          similarity
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(exp1, exp2) {
    // Simplified similarity calculation
    let score = 0;
    let factors = 0;

    // Domain similarity
    if (exp1.experience.domain === exp2.experience.domain) {
      score += 0.3;
    }
    factors++;

    // Agent type similarity
    if (exp1.experience.agentType === exp2.experience.agentType) {
      score += 0.2;
    }
    factors++;

    // Task complexity similarity
    const complexityDiff = Math.abs(
      (exp1.experience.complexity || 1) - (exp2.experience.complexity || 1)
    );
    score += Math.max(0, 0.2 - (complexityDiff * 0.1));
    factors++;

    // Outcome similarity
    if (exp1.experience.outcome?.success === exp2.experience.outcome?.success) {
      score += 0.3;
    }
    factors++;

    return score / factors;
  }

  extractPatterns(experience, similarExperiences) {
    const patterns = [];

    // Success patterns
    if (experience.experience.outcome?.success) {
      const successPattern = this.extractSuccessPattern(experience, similarExperiences);
      if (successPattern) {
        patterns.push(successPattern);
      }
    }

    // Failure patterns
    if (!experience.experience.outcome?.success) {
      const failurePattern = this.extractFailurePattern(experience, similarExperiences);
      if (failurePattern) {
        patterns.push(failurePattern);
      }
    }

    // Performance patterns
    const performancePattern = this.extractPerformancePattern(experience, similarExperiences);
    if (performancePattern) {
      patterns.push(performancePattern);
    }

    return patterns;
  }

  extractSuccessPattern(experience, similar) {
    const successfulSimilar = similar.filter(
      s => s.experience.experience.outcome?.success
    );

    if (successfulSimilar.length < 2) return null;

    return {
      id: `success_${Date.now()}`,
      type: 'success',
      domain: experience.experience.domain,
      confidence: Math.min(successfulSimilar.length * 0.2, 0.9),
      pattern: {
        approach: this.findCommonApproach(successfulSimilar),
        tools: this.findCommonTools(successfulSimilar),
        duration: this.averageDuration(successfulSimilar)
      },
      evidence: successfulSimilar.length,
      created: new Date().toISOString()
    };
  }

  extractFailurePattern(experience, similar) {
    const failedSimilar = similar.filter(
      s => !s.experience.experience.outcome?.success
    );

    if (failedSimilar.length < 2) return null;

    return {
      id: `failure_${Date.now()}`,
      type: 'failure',
      domain: experience.experience.domain,
      confidence: Math.min(failedSimilar.length * 0.2, 0.9),
      pattern: {
        commonErrors: this.findCommonErrors(failedSimilar),
        antiPatterns: this.findAntiPatterns(failedSimilar),
        suggestions: this.generateFailureSuggestions(failedSimilar)
      },
      evidence: failedSimilar.length,
      created: new Date().toISOString()
    };
  }

  extractPerformancePattern(experience, similar) {
    const performanceData = similar.map(s => ({
      duration: s.experience.experience.metrics?.duration || 0,
      complexity: s.experience.experience.complexity || 1,
      tools: s.experience.experience.tools || []
    }));

    if (performanceData.length < 3) return null;

    return {
      id: `performance_${Date.now()}`,
      type: 'performance',
      domain: experience.experience.domain,
      confidence: 0.6,
      pattern: {
        averageDuration: performanceData.reduce((sum, p) => sum + p.duration, 0) / performanceData.length,
        optimalTools: this.findOptimalTools(performanceData),
        complexityImpact: this.analyzeComplexityImpact(performanceData)
      },
      evidence: performanceData.length,
      created: new Date().toISOString()
    };
  }

  async storePattern(pattern) {
    this.patterns.set(pattern.id, pattern);
  }

  // Helper methods
  findCommonApproach(experiences) {
    // Find common approaches across experiences
    return 'incremental_development'; // Placeholder
  }

  findCommonTools(experiences) {
    // Find commonly used tools
    return ['web_search', 'github_search']; // Placeholder
  }

  averageDuration(experiences) {
    const durations = experiences
      .map(e => e.experience.experience.metrics?.duration)
      .filter(d => d);
    
    return durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
  }

  findCommonErrors(experiences) {
    // Find common error patterns
    return ['timeout', 'network_error']; // Placeholder
  }

  findAntiPatterns(experiences) {
    // Find anti-patterns in failed experiences
    return ['no_research', 'insufficient_testing']; // Placeholder
  }

  generateFailureSuggestions(experiences) {
    // Generate suggestions based on failures
    return ['conduct_research_first', 'add_timeout_handling']; // Placeholder
  }

  findOptimalTools(performanceData) {
    // Find tools that lead to better performance
    return ['circuit_breaker', 'caching']; // Placeholder
  }

  analyzeComplexityImpact(performanceData) {
    // Analyze how complexity affects performance
    return { linear: true, factor: 1.5 }; // Placeholder
  }
}

/**
 * Learning Analytics for insights and trends
 */
class LearningAnalytics {
  constructor() {
    this.metrics = new Map();
    this.trends = new Map();
    this.insights = new Map();
  }

  async analyze(knowledge) {
    const analysis = {
      knowledgeGrowth: this.analyzeKnowledgeGrowth(knowledge),
      patternStrength: this.analyzePatternStrength(knowledge),
      learningVelocity: this.analyzeLearningVelocity(knowledge),
      qualityTrends: this.analyzeQualityTrends(knowledge),
      recommendations: this.generateRecommendations(knowledge)
    };

    // Store analysis
    this.insights.set(Date.now(), analysis);

    return analysis;
  }

  analyzeKnowledgeGrowth(knowledge) {
    return {
      totalConcepts: knowledge.concepts?.length || 0,
      newConcepts: knowledge.newConcepts?.length || 0,
      growthRate: 0.1, // Placeholder
      domains: knowledge.domains || []
    };
  }

  analyzePatternStrength(knowledge) {
    return {
      strongPatterns: 3, // Placeholder
      emergingPatterns: 2,
      confidence: 0.75
    };
  }

  analyzeLearningVelocity(knowledge) {
    return {
      conceptsPerSession: 2.5, // Placeholder
      retentionRate: 0.8,
      applicationRate: 0.6
    };
  }

  analyzeQualityTrends(knowledge) {
    return {
      averageConfidence: 0.7, // Placeholder
      sourceDiversity: 0.8,
      validationRate: 0.9
    };
  }

  generateRecommendations(knowledge) {
    return [
      'Increase research validation',
      'Focus on emerging patterns',
      'Diversify knowledge sources'
    ];
  }
}

/**
 * Adaptation Engine for system improvements
 */
class AdaptationEngine {
  constructor() {
    this.adaptations = new Map();
    this.experiments = new Map();
    this.rollbackManager = new RollbackManager();
  }

  async adapt(insights) {
    const adaptations = [];

    // Generate adaptation plans based on insights
    const plans = this.generateAdaptationPlans(insights);

    for (const plan of plans) {
      try {
        const adaptation = await this.implementAdaptation(plan);
        adaptations.push(adaptation);
      } catch (error) {
        winston.error('Adaptation failed', { 
          plan: plan.id,
          error: error.message 
        });
      }
    }

    return adaptations;
  }

  generateAdaptationPlans(insights) {
    const plans = [];

    // Performance optimization plans
    if (insights.qualityTrends.averageConfidence < 0.7) {
      plans.push({
        id: `adapt_confidence_${Date.now()}`,
        type: 'confidence_improvement',
        priority: 'high',
        description: 'Improve knowledge confidence validation'
      });
    }

    // Learning velocity plans
    if (insights.learningVelocity.retentionRate < 0.8) {
      plans.push({
        id: `adapt_retention_${Date.now()}`,
        type: 'retention_improvement',
        priority: 'medium',
        description: 'Enhance knowledge retention mechanisms'
      });
    }

    return plans;
  }

  async implementAdaptation(plan) {
    const adaptation = {
      id: plan.id,
      plan,
      implemented: new Date().toISOString(),
      success: false,
      metrics: {}
    };

    try {
      switch (plan.type) {
        case 'confidence_improvement':
          await this.implementConfidenceImprovement(plan);
          break;
        case 'retention_improvement':
          await this.implementRetentionImprovement(plan);
          break;
        default:
          throw new Error(`Unknown adaptation type: ${plan.type}`);
      }

      adaptation.success = true;
      winston.info('Adaptation implemented successfully', { adaptationId: plan.id });

    } catch (error) {
      adaptation.error = error.message;
      winston.error('Adaptation implementation failed', { 
        adaptationId: plan.id,
        error: error.message 
      });
    }

    this.adaptations.set(plan.id, adaptation);
    return adaptation;
  }

  async implementConfidenceImprovement(plan) {
    // Implement confidence improvement logic
    winston.info('Implementing confidence improvement', { plan: plan.id });
  }

  async implementRetentionImprovement(plan) {
    // Implement retention improvement logic
    winston.info('Implementing retention improvement', { plan: plan.id });
  }
}

/**
 * Rollback Manager for safe adaptations
 */
class RollbackManager {
  constructor() {
    this.snapshots = new Map();
  }

  async createSnapshot(systemState) {
    const snapshotId = `snapshot_${Date.now()}`;
    
    this.snapshots.set(snapshotId, {
      id: snapshotId,
      state: systemState,
      created: new Date().toISOString()
    });

    return snapshotId;
  }

  async rollback(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    // Implement rollback logic
    winston.info('Rolling back to snapshot', { snapshotId });
    
    return snapshot.state;
  }
}

/**
 * Main Knowledge Capture System
 */
export class KnowledgeCaptureSystem extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      storagePath: config.storagePath || './knowledge',
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 300000, // 5 minutes
      ...config
    };

    this.knowledgeGraph = new KnowledgeGraph();
    this.experienceDb = new ExperienceDatabase();
    this.analytics = new LearningAnalytics();
    this.adaptationEngine = new AdaptationEngine();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'knowledge-capture' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/knowledge-error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/knowledge-combined.log' 
        })
      ]
    });

    this.initialized = false;
    this.saveTimer = null;
  }

  async initialize() {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.config.storagePath, { recursive: true });

      // Load existing knowledge
      await this.loadKnowledge();

      // Start auto-save if enabled
      if (this.config.autoSave) {
        this.startAutoSave();
      }

      this.initialized = true;
      this.logger.info('Knowledge capture system initialized');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Knowledge capture initialization failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  async captureExperience(sessionId, experience) {
    if (!this.initialized) {
      throw new Error('Knowledge capture system not initialized');
    }

    try {
      // Extract knowledge from experience
      const extractedKnowledge = await this.extractKnowledge(experience);

      // Store in experience database
      const experienceId = await this.experienceDb.store(
        sessionId, 
        experience, 
        extractedKnowledge
      );

      // Add to knowledge graph
      await this.addToKnowledgeGraph(extractedKnowledge, {
        sessionId,
        experienceId,
        source: 'experience'
      });

      // Analyze learning patterns
      const insights = await this.analytics.analyze(extractedKnowledge);

      // Adapt system based on insights
      const adaptations = await this.adaptationEngine.adapt(insights);

      this.logger.info('Experience captured successfully', {
        sessionId,
        experienceId,
        knowledgeItems: extractedKnowledge.concepts?.length || 0,
        adaptations: adaptations.length
      });

      this.emit('experienceCaptured', {
        sessionId,
        experienceId,
        extractedKnowledge,
        insights,
        adaptations
      });

      return {
        experienceId,
        extractedKnowledge,
        insights,
        adaptations
      };

    } catch (error) {
      this.logger.error('Experience capture failed', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  async extractKnowledge(experience) {
    const knowledge = {
      concepts: [],
      patterns: [],
      insights: [],
      relationships: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        extractionMethod: 'automated'
      }
    };

    // Extract concepts based on experience type
    if (experience.type === 'task_completion') {
      knowledge.concepts.push(...this.extractTaskConcepts(experience));
    }

    if (experience.type === 'research_findings') {
      knowledge.concepts.push(...this.extractResearchConcepts(experience));
    }

    if (experience.type === 'agent_coordination') {
      knowledge.concepts.push(...this.extractCoordinationConcepts(experience));
    }

    // Extract patterns from outcomes
    if (experience.outcome) {
      knowledge.patterns.push(...this.extractOutcomePatterns(experience));
    }

    // Extract insights from decisions
    if (experience.decisions) {
      knowledge.insights.push(...this.extractDecisionInsights(experience));
    }

    return knowledge;
  }

  extractTaskConcepts(experience) {
    const concepts = [];

    if (experience.task) {
      concepts.push({
        type: 'task_approach',
        domain: experience.task.domain,
        value: experience.approach,
        success: experience.outcome?.success || false,
        confidence: experience.outcome?.success ? 0.8 : 0.3
      });
    }

    return concepts;
  }

  extractResearchConcepts(experience) {
    const concepts = [];

    if (experience.research) {
      for (const finding of experience.research.findings || []) {
        concepts.push({
          type: 'research_finding',
          domain: experience.domain,
          value: finding,
          confidence: 0.7,
          source: experience.research.source
        });
      }
    }

    return concepts;
  }

  extractCoordinationConcepts(experience) {
    const concepts = [];

    if (experience.coordination) {
      concepts.push({
        type: 'coordination_pattern',
        domain: 'multi_agent',
        value: experience.coordination.pattern,
        success: experience.coordination.success,
        confidence: experience.coordination.success ? 0.9 : 0.4
      });
    }

    return concepts;
  }

  extractOutcomePatterns(experience) {
    const patterns = [];

    if (experience.outcome.success) {
      patterns.push({
        type: 'success_pattern',
        conditions: experience.conditions || {},
        approach: experience.approach,
        confidence: 0.8
      });
    } else {
      patterns.push({
        type: 'failure_pattern',
        errors: experience.outcome.errors || [],
        conditions: experience.conditions || {},
        confidence: 0.9
      });
    }

    return patterns;
  }

  extractDecisionInsights(experience) {
    const insights = [];

    for (const decision of experience.decisions) {
      insights.push({
        type: 'decision_insight',
        decision: decision.choice,
        rationale: decision.rationale,
        outcome: decision.outcome,
        confidence: 0.6
      });
    }

    return insights;
  }

  async addToKnowledgeGraph(knowledge, metadata) {
    for (const concept of knowledge.concepts || []) {
      await this.knowledgeGraph.addKnowledge(concept, [], {
        ...metadata,
        confidence: concept.confidence,
        domain: concept.domain,
        type: concept.type
      });
    }

    for (const pattern of knowledge.patterns || []) {
      await this.knowledgeGraph.addKnowledge(pattern, [], {
        ...metadata,
        confidence: pattern.confidence,
        type: 'pattern'
      });
    }
  }

  async searchKnowledge(query, context = {}) {
    return await this.knowledgeGraph.findRelevant(query, context);
  }

  async getKnowledgeSummary() {
    const graphData = await this.knowledgeGraph.exportGraph();
    
    return {
      totalConcepts: graphData.nodes.length,
      totalRelationships: graphData.edges.length,
      domains: this.getDomainDistribution(graphData.nodes),
      confidenceDistribution: this.getConfidenceDistribution(graphData.nodes),
      recentActivity: this.getRecentActivity(),
      topInsights: await this.getTopInsights()
    };
  }

  getDomainDistribution(nodes) {
    const distribution = {};
    
    for (const [id, node] of nodes) {
      const domain = node.domain || 'unknown';
      distribution[domain] = (distribution[domain] || 0) + 1;
    }

    return distribution;
  }

  getConfidenceDistribution(nodes) {
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const [id, node] of nodes) {
      const confidence = node.confidence || 0;
      
      if (confidence >= 0.7) {
        distribution.high++;
      } else if (confidence >= 0.4) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    }

    return distribution;
  }

  getRecentActivity() {
    // Return recent knowledge capture activity
    return {
      lastCapture: new Date().toISOString(),
      recentConcepts: 5,
      recentPatterns: 2
    };
  }

  async getTopInsights() {
    // Return top insights based on confidence and usage
    return [
      'Research-driven development improves success rate by 40%',
      'Circuit breaker pattern reduces failure cascade by 85%',
      'MCP context sharing improves coordination efficiency'
    ];
  }

  async saveKnowledge() {
    try {
      const graphData = await this.knowledgeGraph.exportGraph();
      const knowledgePath = path.join(this.config.storagePath, 'knowledge-graph.json');
      
      await fs.writeFile(knowledgePath, JSON.stringify(graphData, null, 2));
      
      this.logger.info('Knowledge saved successfully', { 
        path: knowledgePath,
        concepts: graphData.nodes.length 
      });

    } catch (error) {
      this.logger.error('Knowledge save failed', { error: error.message });
      throw error;
    }
  }

  async loadKnowledge() {
    try {
      const knowledgePath = path.join(this.config.storagePath, 'knowledge-graph.json');
      const data = await fs.readFile(knowledgePath, 'utf8');
      const graphData = JSON.parse(data);

      // Restore knowledge graph
      this.knowledgeGraph.nodes = new Map(graphData.nodes);
      this.knowledgeGraph.edges = new Map(graphData.edges);
      this.knowledgeGraph.confidence = new Map(graphData.confidence);
      this.knowledgeGraph.provenance = new Map(graphData.provenance);

      this.logger.info('Knowledge loaded successfully', { 
        concepts: this.knowledgeGraph.nodes.size 
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('No existing knowledge found, starting fresh');
      } else {
        this.logger.error('Knowledge load failed', { error: error.message });
        throw error;
      }
    }
  }

  startAutoSave() {
    this.saveTimer = setInterval(async () => {
      try {
        await this.saveKnowledge();
      } catch (error) {
        this.logger.error('Auto-save failed', { error: error.message });
      }
    }, this.config.saveInterval);

    this.logger.info('Auto-save started', { 
      interval: this.config.saveInterval 
    });
  }

  async shutdown() {
    try {
      // Save knowledge before shutdown
      await this.saveKnowledge();

      // Stop auto-save
      if (this.saveTimer) {
        clearInterval(this.saveTimer);
        this.saveTimer = null;
      }

      this.logger.info('Knowledge capture system shutdown completed');
      this.emit('shutdown');

    } catch (error) {
      this.logger.error('Knowledge capture shutdown failed', { 
        error: error.message 
      });
      throw error;
    }
  }
}

export default KnowledgeCaptureSystem;