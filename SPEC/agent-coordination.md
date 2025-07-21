# Agent Coordination Patterns Specification

## Overview
This specification defines the multi-agent coordination patterns for ClaudeBuild v2, including communication protocols, handoff procedures, error handling, and state management.

## 1. Agent Communication Protocol

### 1.1 Message Bus Architecture
```javascript
// Core communication interface
interface AgentMessage {
  id: string;
  timestamp: string;
  fromAgent: AgentId;
  toAgent: AgentId | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'status' | 'handoff';
  payload: any;
  correlationId?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

// Message types for coordination
enum MessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_COMPLETION = 'task_completion', 
  HANDOFF_REQUEST = 'handoff_request',
  HANDOFF_ACCEPT = 'handoff_accept',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report',
  RESOURCE_REQUEST = 'resource_request',
  KNOWLEDGE_SHARE = 'knowledge_share'
}
```

### 1.2 Communication Patterns

#### Synchronous Request-Response
```javascript
// For immediate coordination needs
const response = await messagebus.request(targetAgent, {
  type: 'resource_request',
  payload: { resource: 'github_credentials', reason: 'PR creation' }
});
```

#### Asynchronous Pub-Sub
```javascript
// For status updates and notifications
messagebus.publish('task.completed', {
  agentId: 'builder-001',
  taskId: 'task-003',
  artifacts: ['src/component.js', 'tests/component.test.js']
});
```

#### Agent Handoff Protocol
```javascript
// Structured handoff between agents
const handoff = {
  fromAgent: 'architect-001',
  toAgent: 'builder-001',
  context: {
    task: taskDetails,
    specifications: specDocuments,
    dependencies: requiredArtifacts,
    constraints: limitationsAndRequirements
  },
  expectedDeliverable: deliverableSpec,
  deadline: timeConstraint,
  successCriteria: acceptanceCriteria
};

await messagebus.handoff(handoff);
```

## 2. Agent Handoff Procedures

### 2.1 Standard Handoff Sequence
1. **Pre-Handoff Validation**
   - Verify task completion
   - Validate deliverables
   - Prepare context package

2. **Context Transfer**
   - Package complete task context
   - Include all relevant artifacts
   - Document assumptions and decisions

3. **Handoff Execution**
   - Send structured handoff message
   - Wait for acceptance confirmation
   - Transfer ownership

4. **Post-Handoff Monitoring**
   - Monitor acceptance status
   - Provide clarification if needed
   - Log handoff completion

### 2.2 Context Package Structure
```javascript
interface HandoffContext {
  taskDetails: {
    id: string;
    description: string;
    acceptanceCriteria: string[];
    priority: string;
    deadline: string;
  };
  artifacts: {
    created: ArtifactInfo[];
    modified: ArtifactInfo[];
    referenced: ArtifactInfo[];
  };
  dependencies: {
    completed: string[];
    pending: string[];
    external: string[];
  };
  decisions: {
    technical: TechnicalDecision[];
    architectural: ArchitecturalDecision[];
    constraints: Constraint[];
  };
  knowledge: {
    research: ResearchFindings[];
    learnings: Insight[];
    resources: ResourceReference[];
  };
}
```

### 2.3 Agent-Specific Handoff Patterns

#### 🧠 ClaudeBrain → 🤖 Orchestrator
```javascript
const handoff = {
  context: {
    userIntent: capturedIntent,
    projectMetadata: projectStructure,
    initialRequirements: requirements,
    constraints: userConstraints
  },
  deliverable: 'project_initialization',
  nextSteps: ['repository_setup', 'agent_coordination']
};
```

#### 🤖 Orchestrator → 📘 Planner
```javascript
const handoff = {
  context: {
    mainIssue: issueDescription,
    projectScope: scopeDefinition,
    resourceConstraints: limitations,
    timeline: projectTimeline
  },
  deliverable: 'task_breakdown',
  nextSteps: ['sub_issue_creation', 'dependency_analysis']
};
```

#### 📘 Planner → 🏗️ Architect
```javascript
const handoff = {
  context: {
    taskBreakdown: tasksJson,
    requirements: refinedRequirements,
    dependencies: taskDependencies,
    priorities: taskPriorities
  },
  deliverable: 'technical_specifications',
  nextSteps: ['spec_creation', 'design_documentation']
};
```

#### 🏗️ Architect → 🛠️ Builder
```javascript
const handoff = {
  context: {
    specifications: specDocuments,
    architecturalDecisions: designChoices,
    codeStandards: codingGuidelines,
    testRequirements: testingStrategy
  },
  deliverable: 'feature_implementation',
  nextSteps: ['code_development', 'test_creation']
};
```

#### 🛠️ Builder → 🔍 Reviewer  
```javascript
const handoff = {
  context: {
    implementation: codeArtifacts,
    testResults: testingResults,
    documentation: createdDocs,
    commitHistory: gitHistory
  },
  deliverable: 'quality_validation',
  nextSteps: ['code_review', 'quality_assurance']
};
```

#### 🔍 Reviewer → ✅ Manager
```javascript
const handoff = {
  context: {
    reviewResults: qaResults,
    approvals: reviewApprovals,
    qualityMetrics: metrics,
    recommendedActions: suggestions
  },
  deliverable: 'integration_readiness',
  nextSteps: ['pr_creation', 'ci_validation']
};
```

#### ✅ Manager → 🚀 Deploy
```javascript
const handoff = {
  context: {
    integratedFeature: mergedCode,
    validationResults: ciResults,
    releaseNotes: documentedChanges,
    deploymentConfig: deployConfig
  },
  deliverable: 'deployment_execution',
  nextSteps: ['release_creation', 'deployment']
};
```

## 3. Error Handling Patterns

### 3.1 Error Classification
```javascript
enum ErrorSeverity {
  CRITICAL = 'critical',    // Workflow blocking
  HIGH = 'high',           // Task blocking
  MEDIUM = 'medium',       // Performance impact
  LOW = 'low'              // Cosmetic/minor
}

enum ErrorCategory {
  COMMUNICATION = 'communication',
  VALIDATION = 'validation',
  RESOURCE = 'resource',
  INTEGRATION = 'integration',
  EXTERNAL = 'external'
}
```

### 3.2 Error Recovery Strategies

#### Automatic Recovery
```javascript
class ErrorRecovery {
  async handleError(error, context) {
    switch (error.category) {
      case 'communication':
        return this.retryWithBackoff(error.operation);
      case 'resource':
        return this.requestAlternativeResource(error.resource);
      case 'validation':
        return this.requestCorrection(error.validation);
      default:
        return this.escalateToHuman(error, context);
    }
  }
}
```

#### Human Escalation
```javascript
interface EscalationRequest {
  severity: ErrorSeverity;
  agentId: string;
  taskId: string;
  error: ErrorDetails;
  context: TaskContext;
  suggestedActions: string[];
  urgency: 'immediate' | 'soon' | 'when_convenient';
}
```

### 3.3 Recovery Procedures

#### Communication Failures
1. **Retry with exponential backoff**
2. **Switch to alternative communication channel**
3. **Cache and retry when connection restored**
4. **Escalate if critical path affected**

#### Task Failures
1. **Validate error reproducibility**
2. **Check for environmental issues**
3. **Request peer agent assistance**
4. **Rollback to last known good state**
5. **Re-attempt with adjusted parameters**

#### Integration Failures
1. **Analyze conflict sources**
2. **Attempt automatic conflict resolution**
3. **Request manual conflict resolution**
4. **Create alternative integration path**

## 4. State Management

### 4.1 Agent State Model
```javascript
interface AgentState {
  id: string;
  status: 'idle' | 'active' | 'blocked' | 'error' | 'completed';
  currentTask: TaskInfo | null;
  progress: {
    percentage: number;
    milestone: string;
    eta: string;
  };
  resources: {
    allocated: ResourceInfo[];
    requested: ResourceRequest[];
  };
  context: TaskContext;
  capabilities: Capability[];
  health: HealthMetrics;
}
```

### 4.2 Global State Coordination
```javascript
class StateCoordinator {
  async updateAgentState(agentId, stateUpdate) {
    // Update local state
    const updated = await this.updateLocalState(agentId, stateUpdate);
    
    // Broadcast state change
    await this.broadcastStateChange(agentId, updated);
    
    // Check for coordination opportunities
    await this.checkCoordinationTriggers(updated);
    
    return updated;
  }
  
  async checkCoordinationTriggers(state) {
    // Check for dependency resolution
    if (state.status === 'completed') {
      await this.resolveDependentTasks(state.currentTask.id);
    }
    
    // Check for resource availability
    if (state.resources.requested.length > 0) {
      await this.processResourceRequests(state.id);
    }
    
    // Check for handoff opportunities
    if (state.status === 'ready_for_handoff') {
      await this.initiateHandoff(state);
    }
  }
}
```

### 4.3 Persistence Strategy
- **In-Memory**: Current active states for performance
- **File-Based**: Checkpoints for recovery
- **Git-Based**: Artifact and progress tracking
- **MCP-Based**: Knowledge and learning state

## 5. Coordination Triggers

### 5.1 Event-Driven Coordination
```javascript
// Automatic coordination triggers
const coordinationTriggers = {
  'task.completed': (event) => {
    this.checkDependentTasks(event.taskId);
    this.initiateNextPhase(event.agentId);
  },
  
  'agent.blocked': (event) => {
    this.identifyUnblockingActions(event.agentId);
    this.requestAssistance(event.blockingIssue);
  },
  
  'resource.available': (event) => {
    this.allocateToWaitingAgents(event.resource);
  },
  
  'integration.ready': (event) => {
    this.triggerIntegrationProcess(event.artifacts);
  }
};
```

### 5.2 Coordination Optimization
- **Load Balancing**: Distribute tasks based on agent capacity
- **Parallel Execution**: Identify independent task opportunities  
- **Resource Sharing**: Optimize resource utilization across agents
- **Knowledge Sharing**: Share relevant learnings between agents

## 6. Quality Assurance

### 6.1 Coordination Quality Metrics
- **Handoff Success Rate**: Percentage of successful agent handoffs
- **Communication Latency**: Average response time between agents
- **Error Recovery Time**: Time to resolve coordination errors
- **Resource Utilization**: Efficiency of resource allocation

### 6.2 Monitoring and Alerting
```javascript
class CoordinationMonitor {
  monitorCoordination() {
    setInterval(() => {
      const metrics = this.collectMetrics();
      
      if (metrics.handoffFailureRate > 0.05) {
        this.alertCoordinationIssue('high_handoff_failure_rate');
      }
      
      if (metrics.averageResponseTime > 10000) {
        this.alertCoordinationIssue('slow_communication');
      }
    }, 30000);
  }
}
```

## Implementation Notes

1. **Start Simple**: Begin with basic message passing, add complexity incrementally
2. **Test Thoroughly**: Each coordination pattern should have automated tests
3. **Monitor Continuously**: Real-time monitoring of coordination health
4. **Learn and Adapt**: Use coordination metrics to improve patterns over time

---

**Created by**: 🏗️ Architect Agent  
**Status**: Complete  
**Next**: Implementation by Builder Agents  
**Related Issues**: #1 - Design Multi-Agent Coordination Patterns