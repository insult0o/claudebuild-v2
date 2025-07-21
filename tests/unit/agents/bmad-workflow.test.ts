/**
 * BMAD Workflow Unit Tests - ClaudeBuild v2.1.0
 * 
 * Tests the unique Breakthrough Method for Agile AI-Driven Development
 * workflow that no competitor possesses.
 * 
 * Competitive Advantage: This tests ClaudeBuild's unique methodology
 * that Claudia, Crystal, Claude Squad, and others lack.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BMADWorkflowEngine } from '@/enhanced-mcp/bmad-workflow-engine';
import { AgentCoordinator } from '@/enhanced-mcp/agent-coordinator';
import { QualityGateValidator } from '@/enhanced-mcp/quality-gate-validator';

describe('BMAD Workflow Engine - Unique ClaudeBuild Feature', () => {
  let workflowEngine: BMADWorkflowEngine;
  let agentCoordinator: AgentCoordinator;
  let qualityGateValidator: QualityGateValidator;

  beforeEach(() => {
    workflowEngine = new BMADWorkflowEngine();
    agentCoordinator = new AgentCoordinator();
    qualityGateValidator = new QualityGateValidator();
  });

  describe('Phase 1: Strategic Planning', () => {
    test('should capture user intent and create project metadata', async () => {
      // Arrange
      const userIntent = {
        description: 'Build superior multi-agent platform',
        requirements: ['BMAD methodology', 'MCP integration', 'GUI dashboard'],
        qualityStandard: 99
      };

      // Act
      const result = await workflowEngine.executeStrategicPlanning(userIntent);

      // Assert
      expect(result.phase).toBe('strategic-planning');
      expect(result.status).toBe('completed');
      expect(result.deliverables).toContain('PRD.md');
      expect(result.deliverables).toContain('tasks.json');
      expect(result.qualityScore).toBeGreaterThanOrEqual(95);
      expect(result.learningObjectives).toBeDefined();
      expect(result.competitiveAnalysis).toBeDefined();
    });

    test('should validate quality gate before proceeding to architecture', async () => {
      // Arrange
      const strategicOutput = {
        qualityScore: 94, // Below 95% threshold
        deliverables: ['PRD.md'],
        completeness: 0.9
      };

      // Act
      const gateResult = await qualityGateValidator.validateStrategicPhase(strategicOutput);

      // Assert
      expect(gateResult.passed).toBe(false);
      expect(gateResult.reason).toContain('Quality score below minimum threshold');
      expect(gateResult.recommendations).toContain('Enhance PRD completeness');
    });

    test('should enable architecture phase when quality gate passes', async () => {
      // Arrange
      const strategicOutput = {
        qualityScore: 97,
        deliverables: ['PRD.md', 'tasks.json', 'competitive-analysis.md'],
        completeness: 1.0
      };

      // Act
      const gateResult = await qualityGateValidator.validateStrategicPhase(strategicOutput);
      const nextPhase = await workflowEngine.getNextPhase('strategic-planning');

      // Assert
      expect(gateResult.passed).toBe(true);
      expect(nextPhase).toBe('technical-architecture');
      expect(workflowEngine.canProceedToPhase('technical-architecture')).toBe(true);
    });
  });

  describe('Phase 2: Technical Architecture', () => {
    test('should generate comprehensive technical specifications', async () => {
      // Arrange
      const architecturalRequirements = {
        complexity: 'high',
        scalability: 'enterprise',
        frameworks: ['React', 'Tauri', 'Node.js'],
        uniqueFeatures: ['BMAD workflow', 'MCP governance', 'agent orchestration']
      };

      // Act
      const result = await workflowEngine.executeArchitecturalPhase(architecturalRequirements);

      // Assert
      expect(result.specifications).toContain('system-architecture.md');
      expect(result.specifications).toContain('agent-coordination.md');
      expect(result.specifications).toContain('mcp-integration.md');
      expect(result.researchFindings).toBeDefined();
      expect(result.competitiveAdvantages).toHaveLength(5); // 5 unique advantages identified
      expect(result.qualityScore).toBeGreaterThanOrEqual(90);
    });

    test('should integrate research findings into architecture', async () => {
      // Arrange
      const researchFindings = {
        frameworks: ['KaibanJS for multi-agent', 'MCP 2024/2025 standards'],
        bestPractices: ['Circuit breaker patterns', 'Event-driven coordination'],
        competitorAnalysis: ['Claudia limitations', 'Crystal weaknesses']
      };

      // Act
      const result = await workflowEngine.integrateResearchIntoArchitecture(researchFindings);

      // Assert
      expect(result.enhancedSpecifications).toBeDefined();
      expect(result.implementationGuidance).toContain('KaibanJS');
      expect(result.competitiveAdvantages).toContain('Superior MCP integration');
      expect(result.qualityImprovement).toBeGreaterThanOrEqual(0.4); // 40% improvement from research
    });
  });

  describe('Phase 3: Parallel Implementation', () => {
    test('should coordinate multiple builder agents simultaneously', async () => {
      // Arrange
      const builderAgents = [
        { id: 'builder-gui-001', type: 'gui', workTree: 'feature/gui-dashboard' },
        { id: 'builder-mcp-001', type: 'mcp', workTree: 'feature/mcp-integration' },
        { id: 'builder-testing-001', type: 'testing', workTree: 'feature/test-suite' }
      ];

      // Act
      const coordination = await agentCoordinator.coordinateParallelExecution(builderAgents);

      // Assert
      expect(coordination.conflictFree).toBe(true);
      expect(coordination.isolatedWorktrees).toBe(true);
      expect(coordination.dependencyResolution).toBeDefined();
      expect(coordination.agentStatuses).toHaveLength(3);
      expect(coordination.communicationChannels).toBeDefined();
    });

    test('should handle agent dependencies correctly', async () => {
      // Arrange
      const agentWithDependencies = {
        id: 'builder-integration-001',
        dependencies: ['builder-gui-001', 'builder-mcp-001'],
        canStartWhen: 'all_dependencies_completed'
      };

      // Act
      const dependencyStatus = await agentCoordinator.checkDependencies(agentWithDependencies);

      // Assert
      expect(dependencyStatus.canProceed).toBeDefined();
      expect(dependencyStatus.waitingFor).toBeDefined();
      expect(dependencyStatus.estimatedWait).toBeDefined();
    });

    test('should detect and resolve coordination bottlenecks', async () => {
      // Arrange
      const workflowState = {
        runningAgents: 5,
        completedAgents: 2,
        blockedAgents: 1,
        averageTaskTime: 3600000 // 1 hour in ms
      };

      // Act
      const bottleneckAnalysis = await agentCoordinator.analyzeBottlenecks(workflowState);

      // Assert
      expect(bottleneckAnalysis.bottlenecksDetected).toBeDefined();
      expect(bottleneckAnalysis.recommendations).toBeDefined();
      expect(bottleneckAnalysis.optimizationSuggestions).toBeDefined();
    });
  });

  describe('Phase 4: Quality Assurance', () => {
    test('should execute comprehensive multi-agent review', async () => {
      // Arrange
      const reviewTargets = {
        codeQuality: 'src/',
        security: 'all',
        userExperience: 'gui/',
        documentation: 'docs/'
      };

      // Act
      const reviewResults = await workflowEngine.executeQualityAssurance(reviewTargets);

      // Assert
      expect(reviewResults.qaReview.score).toBeGreaterThanOrEqual(95);
      expect(reviewResults.securityReview.score).toBeGreaterThanOrEqual(92);
      expect(reviewResults.uxReview.score).toBeGreaterThanOrEqual(80);
      expect(reviewResults.docsReview.score).toBeGreaterThanOrEqual(78);
      expect(reviewResults.overallScore).toBeGreaterThanOrEqual(85);
    });

    test('should enforce 99% quality standard', async () => {
      // Arrange
      const subStandardWork = {
        qualityScore: 88,
        completeness: 0.9,
        issues: ['Performance bottleneck', 'Security vulnerability']
      };

      // Act
      const qualityGateResult = await qualityGateValidator.enforce99PercentStandard(subStandardWork);

      // Assert
      expect(qualityGateResult.passed).toBe(false);
      expect(qualityGateResult.action).toBe('return_for_improvement');
      expect(qualityGateResult.requiredImprovements).toBeDefined();
      expect(qualityGateResult.targetQuality).toBe(99);
    });
  });

  describe('Phase 5: Integration & Deployment', () => {
    test('should coordinate seamless integration', async () => {
      // Arrange
      const completedComponents = [
        { id: 'gui-dashboard', branch: 'feature/gui', qualityScore: 96 },
        { id: 'mcp-integration', branch: 'feature/mcp', qualityScore: 95 },
        { id: 'test-suite', branch: 'feature/testing', qualityScore: 98 }
      ];

      // Act
      const integrationResult = await workflowEngine.executeIntegration(completedComponents);

      // Assert
      expect(integrationResult.mergeConflicts).toHaveLength(0);
      expect(integrationResult.integrationTests.passed).toBe(true);
      expect(integrationResult.overallQuality).toBeGreaterThanOrEqual(93);
      expect(integrationResult.deploymentReady).toBe(true);
    });

    test('should generate comprehensive deployment package', async () => {
      // Arrange
      const deploymentRequirements = {
        version: '2.1.0',
        environment: 'production',
        qualityValidated: true
      };

      // Act
      const deploymentPackage = await workflowEngine.generateDeploymentPackage(deploymentRequirements);

      // Assert
      expect(deploymentPackage.version).toBe('2.1.0');
      expect(deploymentPackage.artifacts).toContain('claudebuild-gui');
      expect(deploymentPackage.artifacts).toContain('claudebuild-cli');
      expect(deploymentPackage.documentation).toBeDefined();
      expect(deploymentPackage.releaseNotes).toBeDefined();
      expect(deploymentPackage.qualityCertification).toBeDefined();
    });
  });

  describe('Continuous Learning Integration', () => {
    test('should capture knowledge throughout workflow execution', async () => {
      // Arrange
      const workflowExecution = {
        phases: ['strategic', 'architecture', 'implementation'],
        insights: ['Research findings', 'Pattern discoveries', 'Quality improvements'],
        experiences: ['Agent coordination patterns', 'Bottleneck resolution']
      };

      // Act
      const knowledgeCapture = await workflowEngine.captureWorkflowKnowledge(workflowExecution);

      // Assert
      expect(knowledgeCapture.patterns).toBeDefined();
      expect(knowledgeCapture.insights).toBeDefined();
      expect(knowledgeCapture.improvements).toBeDefined();
      expect(knowledgeCapture.organizationalIntelligence).toBeDefined();
    });

    test('should apply learned knowledge to improve future workflows', async () => {
      // Arrange
      const previousLearnings = {
        patterns: ['Parallel coordination patterns', 'Quality gate optimizations'],
        insights: ['Research integration effectiveness', 'Agent specialization benefits'],
        improvements: ['40% quality improvement from research integration']
      };

      // Act
      const workflowOptimizations = await workflowEngine.applyLearningsToWorkflow(previousLearnings);

      // Assert
      expect(workflowOptimizations.enhancedPhases).toBeDefined();
      expect(workflowOptimizations.optimizedCoordination).toBeDefined();
      expect(workflowOptimizations.predictedImprovements).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('Competitive Advantage Validation', () => {
    test('should validate unique BMAD methodology implementation', () => {
      // This test validates features that NO competitor has
      const bmdFeatures = workflowEngine.getBMADFeatures();

      expect(bmdFeatures).toContain('structured_ai_driven_phases');
      expect(bmdFeatures).toContain('quality_gate_enforcement');
      expect(bmdFeatures).toContain('research_enhanced_development');
      expect(bmdFeatures).toContain('continuous_learning_integration');
      expect(bmdFeatures).toContain('multi_agent_orchestration');
    });

    test('should demonstrate superiority over competitor approaches', () => {
      const competitorComparison = workflowEngine.compareWithCompetitors();

      // ClaudeBuild vs Claudia
      expect(competitorComparison.vs_claudia.advantages).toContain('BMAD methodology');
      expect(competitorComparison.vs_claudia.advantages).toContain('Advanced MCP governance');

      // ClaudeBuild vs Crystal  
      expect(competitorComparison.vs_crystal.advantages).toContain('Multi-agent orchestration');
      expect(competitorComparison.vs_crystal.advantages).toContain('Workflow methodology');

      // ClaudeBuild vs Claude Squad
      expect(competitorComparison.vs_claude_squad.advantages).toContain('Rich GUI interface');
      expect(competitorComparison.vs_claude_squad.advantages).toContain('Structured development process');
    });
  });
});

// Performance benchmarks to exceed competitor standards
describe('BMAD Workflow Performance', () => {
  test('should execute phases within performance targets', async () => {
    const performanceMetrics = await workflowEngine.measurePerformance();

    expect(performanceMetrics.phaseTransitionTime).toBeLessThan(5000); // 5 seconds
    expect(performanceMetrics.agentCoordinationOverhead).toBeLessThan(100); // 100ms
    expect(performanceMetrics.qualityGateValidation).toBeLessThan(1000); // 1 second
    expect(performanceMetrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB
  });

  test('should scale efficiently with multiple concurrent workflows', async () => {
    const concurrentWorkflows = 5;
    const scalabilityMetrics = await workflowEngine.testScalability(concurrentWorkflows);

    expect(scalabilityMetrics.resourceUtilization).toBeLessThan(0.8); // 80% max
    expect(scalabilityMetrics.responseTimeIncrease).toBeLessThan(1.5); // 50% max increase
    expect(scalabilityMetrics.errorRate).toBeLessThan(0.01); // <1% errors
  });
});