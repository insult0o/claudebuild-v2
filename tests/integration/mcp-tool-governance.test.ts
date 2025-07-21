/**
 * MCP Tool Governance Integration Tests - ClaudeBuild v2.1.0
 * 
 * Tests the advanced MCP tool governance system that provides
 * superior security and control compared to competitors.
 * 
 * Competitive Advantage: Claudia has basic MCP integration,
 * but ClaudeBuild has comprehensive tool governance with
 * granular permissions, auditing, and security controls.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MCPToolGovernanceSystem } from '@/enhanced-mcp/mcp-tool-governance';
import { SecurityValidator } from '@/enhanced-mcp/security-validator';
import { AuditLogger } from '@/enhanced-mcp/audit-logger';
import { TestMCPServer } from '@tests/mocks/test-mcp-server';

describe('MCP Tool Governance - Superior to Competitor Integration', () => {
  let governanceSystem: MCPToolGovernanceSystem;
  let securityValidator: SecurityValidator;
  let auditLogger: AuditLogger;
  let testMCPServer: TestMCPServer;

  beforeEach(async () => {
    testMCPServer = new TestMCPServer();
    await testMCPServer.start();

    governanceSystem = new MCPToolGovernanceSystem({
      serverUrl: testMCPServer.getUrl(),
      securityLevel: 'enterprise'
    });

    securityValidator = new SecurityValidator();
    auditLogger = new AuditLogger();

    await governanceSystem.initialize();
  });

  afterEach(async () => {
    await governanceSystem.shutdown();
    await testMCPServer.stop();
  });

  describe('Tool Permission Management', () => {
    test('should enforce ask/allow/deny policies for individual tools', async () => {
      // Arrange
      const toolPolicies = [
        { toolId: 'web-search', permission: 'allow' },
        { toolId: 'file-operations', permission: 'ask' },
        { toolId: 'system-commands', permission: 'deny' }
      ];

      // Act
      await governanceSystem.configurePolicies(toolPolicies);

      // Assert - Allow policy
      const webSearchResult = await governanceSystem.requestToolAccess('web-search', 'agent-001');
      expect(webSearchResult.granted).toBe(true);
      expect(webSearchResult.requiresUserConfirmation).toBe(false);

      // Assert - Ask policy
      const fileOpsResult = await governanceSystem.requestToolAccess('file-operations', 'agent-001');
      expect(fileOpsResult.granted).toBe(false);
      expect(fileOpsResult.requiresUserConfirmation).toBe(true);
      expect(fileOpsResult.userPrompt).toContain('Agent agent-001 requests access to file-operations');

      // Assert - Deny policy
      const systemCmdResult = await governanceSystem.requestToolAccess('system-commands', 'agent-001');
      expect(systemCmdResult.granted).toBe(false);
      expect(systemCmdResult.requiresUserConfirmation).toBe(false);
      expect(systemCmdResult.reason).toContain('Access denied by policy');
    });

    test('should support agent-specific tool permissions', async () => {
      // Arrange
      const agentSpecificPolicies = [
        { agentId: 'builder-001', toolId: 'file-operations', permission: 'allow' },
        { agentId: 'reviewer-001', toolId: 'file-operations', permission: 'ask' },
        { agentId: 'deployer-001', toolId: 'system-commands', permission: 'allow' }
      ];

      // Act
      await governanceSystem.configureAgentSpecificPolicies(agentSpecificPolicies);

      // Assert
      const builderAccess = await governanceSystem.requestToolAccess('file-operations', 'builder-001');
      expect(builderAccess.granted).toBe(true);

      const reviewerAccess = await governanceSystem.requestToolAccess('file-operations', 'reviewer-001');
      expect(reviewerAccess.requiresUserConfirmation).toBe(true);

      const deployerAccess = await governanceSystem.requestToolAccess('system-commands', 'deployer-001');
      expect(deployerAccess.granted).toBe(true);
    });

    test('should handle conditional permissions based on context', async () => {
      // Arrange
      const contextualPolicy = {
        toolId: 'github-operations',
        conditions: [
          { context: 'workflow_phase', value: 'deployment', permission: 'allow' },
          { context: 'workflow_phase', value: 'implementation', permission: 'ask' },
          { context: 'workflow_phase', value: 'planning', permission: 'deny' }
        ]
      };

      // Act
      await governanceSystem.configureContextualPolicy(contextualPolicy);

      // Assert - Deployment phase
      const deploymentContext = { workflow_phase: 'deployment' };
      const deploymentAccess = await governanceSystem.requestToolAccessWithContext(
        'github-operations', 
        'deployer-001', 
        deploymentContext
      );
      expect(deploymentAccess.granted).toBe(true);

      // Assert - Planning phase
      const planningContext = { workflow_phase: 'planning' };
      const planningAccess = await governanceSystem.requestToolAccessWithContext(
        'github-operations', 
        'planner-001', 
        planningContext
      );
      expect(planningAccess.granted).toBe(false);
    });
  });

  describe('Security Validation', () => {
    test('should prevent command injection in tool parameters', async () => {
      // Arrange
      const maliciousParameters = {
        query: 'legitimate search; rm -rf /',
        options: { format: 'json && cat /etc/passwd' }
      };

      // Act
      const validationResult = await securityValidator.validateToolParameters(
        'web-search',
        maliciousParameters
      );

      // Assert
      expect(validationResult.isSecure).toBe(false);
      expect(validationResult.threats).toContain('command_injection');
      expect(validationResult.sanitizedParameters).toBeDefined();
      expect(validationResult.sanitizedParameters.query).not.toContain(';');
    });

    test('should validate file path access boundaries', async () => {
      // Arrange
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM'
      ];

      // Act & Assert
      for (const maliciousPath of pathTraversalAttempts) {
        const validationResult = await securityValidator.validateFilePath(maliciousPath);
        
        expect(validationResult.isSecure).toBe(false);
        expect(validationResult.threats).toContain('path_traversal');
        expect(validationResult.allowedPath).toBeNull();
      }
    });

    test('should enforce rate limiting for tool usage', async () => {
      // Arrange
      const rateLimitConfig = {
        toolId: 'web-search',
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 100
      };

      await governanceSystem.configureRateLimit(rateLimitConfig);

      // Act - Exceed rate limit
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(governanceSystem.requestToolAccess('web-search', 'agent-001'));
      }
      const results = await Promise.all(requests);

      // Assert
      const grantedRequests = results.filter(r => r.granted).length;
      const rateLimitedRequests = results.filter(r => r.rateLimited).length;

      expect(grantedRequests).toBeLessThanOrEqual(10);
      expect(rateLimitedRequests).toBeGreaterThan(0);
    });
  });

  describe('Audit and Compliance', () => {
    test('should log all tool access requests and responses', async () => {
      // Arrange
      const toolRequests = [
        { toolId: 'web-search', agentId: 'agent-001', parameters: { query: 'test' } },
        { toolId: 'file-operations', agentId: 'agent-002', parameters: { path: './test.txt' } }
      ];

      // Act
      for (const request of toolRequests) {
        await governanceSystem.requestToolAccess(request.toolId, request.agentId);
      }

      // Assert
      const auditLogs = await auditLogger.getRecentLogs(Date.now() - 60000); // Last minute
      
      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
      expect(auditLogs[0]).toMatchObject({
        event: 'tool_access_request',
        toolId: expect.any(String),
        agentId: expect.any(String),
        timestamp: expect.any(Date),
        result: expect.any(String)
      });
    });

    test('should generate compliance reports for enterprise audit', async () => {
      // Arrange
      const reportPeriod = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date()
      };

      // Act
      const complianceReport = await governanceSystem.generateComplianceReport(reportPeriod);

      // Assert
      expect(complianceReport.totalRequests).toBeDefined();
      expect(complianceReport.grantedRequests).toBeDefined();
      expect(complianceReport.deniedRequests).toBeDefined();
      expect(complianceReport.securityViolations).toBeDefined();
      expect(complianceReport.policyViolations).toBeDefined();
      expect(complianceReport.agentActivity).toBeDefined();
      expect(complianceReport.toolUsageStats).toBeDefined();
    });

    test('should alert on suspicious tool usage patterns', async () => {
      // Arrange
      const suspiciousPatterns = [
        // Rapid successive requests
        ...Array(50).fill(0).map(() => ({ toolId: 'system-commands', agentId: 'agent-001' })),
        // Off-hours access
        { toolId: 'sensitive-data', agentId: 'agent-002', timestamp: new Date('2024-01-01T03:00:00Z') }
      ];

      // Act
      const alertPromises = suspiciousPatterns.map(pattern => 
        governanceSystem.requestToolAccess(pattern.toolId, pattern.agentId)
      );
      await Promise.all(alertPromises);

      // Assert
      const securityAlerts = await governanceSystem.getSecurityAlerts();
      
      expect(securityAlerts.length).toBeGreaterThan(0);
      expect(securityAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'rapid_requests',
            severity: 'high',
            agentId: 'agent-001'
          })
        ])
      );
    });
  });

  describe('Tool Performance Monitoring', () => {
    test('should track tool response times and success rates', async () => {
      // Arrange
      const toolRequests = [
        { toolId: 'web-search', expectedDuration: 1000 },
        { toolId: 'github-operations', expectedDuration: 500 },
        { toolId: 'file-operations', expectedDuration: 100 }
      ];

      // Act
      const performanceResults = [];
      for (const request of toolRequests) {
        const startTime = Date.now();
        const result = await governanceSystem.executeToolRequest(request.toolId, 'test-agent', {});
        const duration = Date.now() - startTime;
        
        performanceResults.push({
          toolId: request.toolId,
          duration,
          success: result.success
        });
      }

      // Assert
      const performanceMetrics = await governanceSystem.getToolPerformanceMetrics();
      
      expect(performanceMetrics).toBeDefined();
      expect(performanceMetrics['web-search'].avgResponseTime).toBeDefined();
      expect(performanceMetrics['web-search'].successRate).toBeGreaterThanOrEqual(0.95);
      expect(performanceMetrics['github-operations'].avgResponseTime).toBeLessThan(2000);
    });

    test('should identify and alert on tool performance degradation', async () => {
      // Arrange - Simulate slow tool responses
      testMCPServer.simulateLatency('web-search', 5000); // 5 second delay

      // Act
      const slowRequests = [];
      for (let i = 0; i < 5; i++) {
        slowRequests.push(governanceSystem.executeToolRequest('web-search', 'agent-001', {}));
      }
      await Promise.all(slowRequests);

      // Assert
      const performanceAlerts = await governanceSystem.getPerformanceAlerts();
      
      expect(performanceAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'performance_degradation',
            toolId: 'web-search',
            threshold: expect.any(Number),
            actualPerformance: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('Integration with BMAD Workflow', () => {
    test('should adjust permissions based on workflow phase', async () => {
      // Arrange
      const workflowPhases = [
        { phase: 'planning', allowedTools: ['web-search', 'github-search'] },
        { phase: 'implementation', allowedTools: ['web-search', 'file-operations', 'github-operations'] },
        { phase: 'deployment', allowedTools: ['system-commands', 'github-operations', 'deployment-tools'] }
      ];

      // Act & Assert
      for (const phase of workflowPhases) {
        await governanceSystem.setWorkflowPhase(phase.phase);
        
        for (const toolId of phase.allowedTools) {
          const access = await governanceSystem.requestToolAccess(toolId, 'workflow-agent');
          expect(access.granted || access.requiresUserConfirmation).toBe(true);
        }
      }
    });

    test('should integrate with agent coordination for tool allocation', async () => {
      // Arrange
      const agentCoordination = {
        activeAgents: ['builder-001', 'builder-002', 'reviewer-001'],
        toolAllocation: {
          'file-operations': ['builder-001', 'builder-002'],
          'code-analysis': ['reviewer-001'],
          'web-search': ['builder-001', 'reviewer-001']
        }
      };

      // Act
      await governanceSystem.coordinateWithAgentSystem(agentCoordination);

      // Assert
      const builderAccess = await governanceSystem.requestToolAccess('file-operations', 'builder-001');
      expect(builderAccess.granted).toBe(true);

      const reviewerFileAccess = await governanceSystem.requestToolAccess('file-operations', 'reviewer-001');
      expect(reviewerFileAccess.granted).toBe(false); // Not allocated to reviewer
    });
  });

  describe('Competitive Advantage Validation', () => {
    test('should demonstrate superior governance vs Claudia basic MCP', () => {
      const governanceFeatures = governanceSystem.getGovernanceFeatures();

      // Features that Claudia lacks
      expect(governanceFeatures).toContain('granular_permission_control');
      expect(governanceFeatures).toContain('agent_specific_policies');
      expect(governanceFeatures).toContain('contextual_permissions');
      expect(governanceFeatures).toContain('comprehensive_audit_logging');
      expect(governanceFeatures).toContain('security_threat_detection');
      expect(governanceFeatures).toContain('performance_monitoring');
      expect(governanceFeatures).toContain('compliance_reporting');
      expect(governanceFeatures).toContain('workflow_phase_integration');
    });

    test('should provide enterprise-grade security that competitors lack', async () => {
      const securityFeatures = await securityValidator.getSecurityCapabilities();

      expect(securityFeatures.inputValidation).toBe(true);
      expect(securityFeatures.pathTraversalPrevention).toBe(true);
      expect(securityFeatures.commandInjectionPrevention).toBe(true);
      expect(securityFeatures.rateLimiting).toBe(true);
      expect(securityFeatures.anomalyDetection).toBe(true);
      expect(securityFeatures.complianceReporting).toBe(true);
      expect(securityFeatures.auditTrail).toBe(true);

      // Verify security standards
      expect(securityFeatures.securityLevel).toBe('enterprise');
      expect(securityFeatures.complianceStandards).toContain('SOC2');
      expect(securityFeatures.complianceStandards).toContain('GDPR');
    });
  });
});