import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// State interfaces for ClaudeBuild v2.1.0 Superior GUI
interface Agent {
  id: string;
  name: string;
  type: 'brain' | 'orchestrator' | 'planner' | 'architect' | 'builder' | 'reviewer' | 'manager' | 'deployer' | 'archiver';
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  currentTask?: string;
  progress: number;
  qualityScore?: number;
  startTime?: Date;
  endTime?: Date;
  dependencies: string[];
  branch?: string;
  lastUpdate: Date;
}

interface BMAdPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  agents: Agent[];
  dependencies: string[];
  estimatedTime: string;
  actualTime?: string;
  qualityGate: number;
  deliverables: string[];
}

interface WorkflowEvent {
  id: string;
  timestamp: Date;
  type: 'phase_start' | 'phase_complete' | 'agent_start' | 'agent_complete' | 'quality_gate' | 'error';
  agentId?: string;
  phaseId?: string;
  data: any;
  description: string;
}

interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: MCPTool[];
  lastSeen: Date;
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  permissions: 'ask' | 'allow' | 'deny';
  usageCount: number;
  lastUsed?: Date;
  performance: {
    avgResponseTime: number;
    successRate: number;
    errorCount: number;
  };
}

interface GovernancePolicy {
  id: string;
  toolId: string;
  agentId?: string;
  permission: 'ask' | 'allow' | 'deny';
  conditions?: string[];
  createdBy: string;
  createdAt: Date;
}

interface KnowledgeNode {
  id: string;
  type: 'pattern' | 'insight' | 'experience' | 'best_practice';
  title: string;
  content: string;
  confidence: number;
  tags: string[];
  relationships: string[];
  createdAt: Date;
  lastAccessed: Date;
}

interface WorkflowState {
  // Current workflow execution
  currentPhase: string;
  phases: BMAdPhase[];
  history: WorkflowEvent[];
  
  // Project management
  projects: any[];
  currentProject: string | null;
  
  // Dependencies and coordination
  dependencies: any[];
  bottlenecks: any[];
  
  // MCP Integration
  mcpServers: MCPServer[];
  mcpStatus: 'connected' | 'disconnected' | 'partial';
  governancePolicies: GovernancePolicy[];
  auditTrail: any[];
  
  // Knowledge and Learning
  knowledgeGraph: KnowledgeNode[];
  insights: any[];
  researchHistory: any[];
  
  // Performance metrics
  performance: {
    overallQuality: number;
    avgExecutionTime: number;
    successRate: number;
    resourceUsage: any;
  };
}

interface UIState {
  layout: any;
  theme: 'light' | 'dark' | 'auto';
  preferences: any;
  notifications: any[];
  selectedAgent?: string;
  selectedPhase?: string;
}

interface ClaudeBuildState {
  // Core state
  workflow: WorkflowState;
  agents: Agent[];
  ui: UIState;
  
  // Actions
  setCurrentPhase: (phaseId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  addWorkflowEvent: (event: Omit<WorkflowEvent, 'id'>) => void;
  updateMCPServerStatus: (serverId: string, status: MCPServer['status']) => void;
  addKnowledgeNode: (node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'lastAccessed'>) => void;
  
  // UI actions
  selectAgent: (agentId: string | undefined) => void;
  selectPhase: (phaseId: string | undefined) => void;
  addNotification: (notification: any) => void;
  dismissNotification: (id: string) => void;
  
  // Workflow control
  startWorkflow: () => void;
  pauseWorkflow: () => void;
  resumeWorkflow: () => void;
  resetWorkflow: () => void;
}

// Mock data for development
const mockBMADPhases: BMAdPhase[] = [
  {
    id: 'strategic-planning',
    name: 'Strategic Planning',
    description: 'Define project vision, requirements, and strategic approach',
    status: 'completed',
    progress: 100,
    agents: [
      {
        id: 'brain-001',
        name: 'ClaudeBrain',
        type: 'brain',
        status: 'completed',
        progress: 100,
        qualityScore: 100,
        dependencies: [],
        lastUpdate: new Date()
      },
      {
        id: 'planner-001', 
        name: 'Strategic Planner',
        type: 'planner',
        status: 'completed',
        progress: 100,
        qualityScore: 98,
        dependencies: ['brain-001'],
        lastUpdate: new Date()
      }
    ],
    dependencies: [],
    estimatedTime: '2 hours',
    actualTime: '1.5 hours',
    qualityGate: 95,
    deliverables: ['PRD.md', 'tasks.json', 'strategy-brief.md']
  },
  {
    id: 'technical-architecture',
    name: 'Technical Architecture',
    description: 'Design system architecture and technical specifications',
    status: 'completed',
    progress: 100,
    agents: [
      {
        id: 'architect-001',
        name: 'System Architect',
        type: 'architect',
        status: 'completed',
        progress: 100,
        qualityScore: 96,
        dependencies: ['planner-001'],
        lastUpdate: new Date()
      }
    ],
    dependencies: ['strategic-planning'],
    estimatedTime: '3 hours',
    actualTime: '2.8 hours',
    qualityGate: 90,
    deliverables: ['architecture.md', 'specifications/', 'design-patterns.md']
  },
  {
    id: 'parallel-implementation',
    name: 'Parallel Implementation',
    description: 'Multi-agent parallel development with coordination',
    status: 'in_progress',
    progress: 75,
    agents: [
      {
        id: 'builder-gui-001',
        name: 'GUI Builder',
        type: 'builder',
        status: 'running',
        progress: 80,
        currentTask: 'Implementing superior dashboard components',
        dependencies: ['architect-001'],
        lastUpdate: new Date()
      },
      {
        id: 'builder-testing-001',
        name: 'Testing Builder',
        type: 'builder', 
        status: 'running',
        progress: 70,
        currentTask: 'Creating comprehensive test suite',
        dependencies: ['architect-001'],
        lastUpdate: new Date()
      }
    ],
    dependencies: ['technical-architecture'],
    estimatedTime: '8 hours',
    qualityGate: 95,
    deliverables: ['src/gui/', 'tests/', 'documentation/']
  },
  {
    id: 'quality-assurance',
    name: 'Quality Assurance',
    description: 'Comprehensive review and validation',
    status: 'pending',
    progress: 0,
    agents: [],
    dependencies: ['parallel-implementation'],
    estimatedTime: '2 hours',
    qualityGate: 98,
    deliverables: ['review-reports/', 'quality-metrics.json']
  },
  {
    id: 'integration-deployment',
    name: 'Integration & Deployment',
    description: 'Final integration and production deployment',
    status: 'pending',
    progress: 0,
    agents: [],
    dependencies: ['quality-assurance'],
    estimatedTime: '1 hour',
    qualityGate: 99,
    deliverables: ['release-v2.1.0/', 'deployment-docs/']
  }
];

const mockMCPServers: MCPServer[] = [
  {
    id: 'primary-mcp',
    name: 'ClaudeBuild Primary MCP',
    url: 'ws://localhost:8080/mcp',
    status: 'connected',
    lastSeen: new Date(),
    tools: [
      {
        id: 'web-search',
        name: 'Web Search',
        description: 'Search the web for information and research',
        permissions: 'allow',
        usageCount: 47,
        lastUsed: new Date(),
        performance: {
          avgResponseTime: 1200,
          successRate: 98.5,
          errorCount: 2
        }
      },
      {
        id: 'github-search',
        name: 'GitHub Search',
        description: 'Search GitHub repositories and code examples',
        permissions: 'allow',
        usageCount: 23,
        lastUsed: new Date(),
        performance: {
          avgResponseTime: 800,
          successRate: 100,
          errorCount: 0
        }
      },
      {
        id: 'file-operations',
        name: 'File Operations',
        description: 'Read, write, and manage files',
        permissions: 'ask',
        usageCount: 156,
        lastUsed: new Date(),
        performance: {
          avgResponseTime: 50,
          successRate: 99.8,
          errorCount: 1
        }
      }
    ]
  }
];

// Zustand store with subscriptions for real-time updates
export const useClaudeBuildState = create<ClaudeBuildState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    workflow: {
      currentPhase: 'parallel-implementation',
      phases: mockBMADPhases,
      history: [],
      projects: [],
      currentProject: null,
      dependencies: [],
      bottlenecks: [],
      mcpServers: mockMCPServers,
      mcpStatus: 'connected',
      governancePolicies: [],
      auditTrail: [],
      knowledgeGraph: [],
      insights: [],
      researchHistory: [],
      performance: {
        overallQuality: 93,
        avgExecutionTime: 2.5,
        successRate: 98.2,
        resourceUsage: {}
      }
    },
    
    agents: mockBMADPhases.flatMap(phase => phase.agents),
    
    ui: {
      layout: {},
      theme: 'dark',
      preferences: {},
      notifications: [],
      selectedAgent: undefined,
      selectedPhase: undefined
    },

    // Workflow actions
    setCurrentPhase: (phaseId: string) => set((state) => ({
      workflow: { ...state.workflow, currentPhase: phaseId }
    })),

    updateAgent: (agentId: string, updates: Partial<Agent>) => set((state) => ({
      agents: state.agents.map(agent => 
        agent.id === agentId ? { ...agent, ...updates, lastUpdate: new Date() } : agent
      ),
      workflow: {
        ...state.workflow,
        phases: state.workflow.phases.map(phase => ({
          ...phase,
          agents: phase.agents.map(agent =>
            agent.id === agentId ? { ...agent, ...updates, lastUpdate: new Date() } : agent
          )
        }))
      }
    })),

    addWorkflowEvent: (event: Omit<WorkflowEvent, 'id'>) => set((state) => ({
      workflow: {
        ...state.workflow,
        history: [
          ...state.workflow.history,
          { ...event, id: `event-${Date.now()}` }
        ]
      }
    })),

    updateMCPServerStatus: (serverId: string, status: MCPServer['status']) => set((state) => ({
      workflow: {
        ...state.workflow,
        mcpServers: state.workflow.mcpServers.map(server =>
          server.id === serverId ? { ...server, status, lastSeen: new Date() } : server
        )
      }
    })),

    addKnowledgeNode: (node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'lastAccessed'>) => set((state) => ({
      workflow: {
        ...state.workflow,
        knowledgeGraph: [
          ...state.workflow.knowledgeGraph,
          {
            ...node,
            id: `knowledge-${Date.now()}`,
            createdAt: new Date(),
            lastAccessed: new Date()
          }
        ]
      }
    })),

    // UI actions
    selectAgent: (agentId: string | undefined) => set((state) => ({
      ui: { ...state.ui, selectedAgent: agentId }
    })),

    selectPhase: (phaseId: string | undefined) => set((state) => ({
      ui: { ...state.ui, selectedPhase: phaseId }
    })),

    addNotification: (notification: any) => set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, { ...notification, id: `notif-${Date.now()}` }]
      }
    })),

    dismissNotification: (id: string) => set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter(n => n.id !== id)
      }
    })),

    // Workflow control
    startWorkflow: () => {
      // Implementation for starting workflow
      set((state) => ({
        workflow: { ...state.workflow, /* workflow start logic */ }
      }));
    },

    pauseWorkflow: () => {
      // Implementation for pausing workflow
      set((state) => ({
        agents: state.agents.map(agent => 
          agent.status === 'running' ? { ...agent, status: 'paused' } : agent
        )
      }));
    },

    resumeWorkflow: () => {
      // Implementation for resuming workflow
      set((state) => ({
        agents: state.agents.map(agent => 
          agent.status === 'paused' ? { ...agent, status: 'running' } : agent
        )
      }));
    },

    resetWorkflow: () => {
      // Implementation for resetting workflow
      set((state) => ({
        workflow: { ...state.workflow, currentPhase: mockBMADPhases[0].id },
        agents: state.agents.map(agent => ({
          ...agent,
          status: 'idle',
          progress: 0,
          currentTask: undefined
        }))
      }));
    }
  }))
);

// Selectors for derived state
export const useWorkflowProgress = () => {
  return useClaudeBuildState((state) => {
    const completedPhases = state.workflow.phases.filter(p => p.status === 'completed').length;
    const totalPhases = state.workflow.phases.length;
    return (completedPhases / totalPhases) * 100;
  });
};

export const useActiveAgents = () => {
  return useClaudeBuildState((state) => 
    state.agents.filter(agent => agent.status === 'running')
  );
};

export const useCurrentPhase = () => {
  return useClaudeBuildState((state) => 
    state.workflow.phases.find(p => p.id === state.workflow.currentPhase)
  );
};