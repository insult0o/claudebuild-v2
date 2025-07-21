import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
  capabilities: string[];
  systemPrompt?: string;
}

interface AgentStore {
  agents: Agent[];
  templates: Agent[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAgents: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createAgent: (agent: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [
    {
      id: 'planner-1',
      name: 'BMAD Planner',
      role: 'planner',
      description: 'Strategic planning and task breakdown specialist',
      status: 'idle',
      capabilities: ['requirement-analysis', 'task-breakdown', 'dependency-mapping'],
    },
    {
      id: 'architect-1',
      name: 'System Architect',
      role: 'architect',
      description: 'Technical architecture and specification expert',
      status: 'busy',
      currentTask: 'Designing API schema',
      capabilities: ['technical-design', 'api-specification', 'data-modeling'],
    },
    {
      id: 'builder-1',
      name: 'Code Builder #1',
      role: 'builder',
      description: 'Implementation specialist',
      status: 'busy',
      currentTask: 'Implementing auth module',
      capabilities: ['code-implementation', 'test-writing', 'debugging'],
    },
    {
      id: 'reviewer-1',
      name: 'Code Reviewer',
      role: 'reviewer',
      description: 'Multi-perspective code analysis',
      status: 'idle',
      capabilities: ['code-analysis', 'security-review', 'best-practice-check'],
    },
  ],
  
  templates: [
    {
      id: 'tpl-planner',
      name: 'BMAD Planner',
      role: 'planner',
      description: 'Breaks down requirements using BMAD methodology',
      status: 'idle',
      capabilities: ['requirement-analysis', 'task-breakdown', 'dependency-mapping'],
    },
    {
      id: 'tpl-architect',
      name: 'Architect',
      role: 'architect',
      description: 'Creates detailed technical specifications',
      status: 'idle',
      capabilities: ['technical-design', 'api-specification', 'data-modeling'],
    },
    {
      id: 'tpl-builder',
      name: 'Builder',
      role: 'builder',
      description: 'Implements code based on specifications',
      status: 'idle',
      capabilities: ['code-implementation', 'test-writing', 'refactoring'],
    },
    {
      id: 'tpl-reviewer',
      name: 'Reviewer',
      role: 'reviewer',
      description: 'Reviews code from multiple perspectives',
      status: 'idle',
      capabilities: ['code-analysis', 'security-review', 'performance-analysis'],
    },
    {
      id: 'tpl-qa',
      name: 'QA Engineer',
      role: 'qa',
      description: 'Ensures quality through comprehensive testing',
      status: 'idle',
      capabilities: ['test-planning', 'test-automation', 'performance-testing'],
    },
    {
      id: 'tpl-manager',
      name: 'Manager',
      role: 'manager',
      description: 'Orchestrates workflow and validates results',
      status: 'idle',
      capabilities: ['workflow-orchestration', 'quality-validation', 'conflict-resolution'],
    },
  ],
  
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createAgent: async (agentData) => {
    set({ loading: true, error: null });
    try {
      const agent: Agent = {
        id: `agent-${Date.now()}`,
        name: agentData.name || 'New Agent',
        role: agentData.role || 'custom',
        description: agentData.description || '',
        status: 'idle',
        capabilities: agentData.capabilities || [],
        ...agentData,
      };
      
      set(state => ({
        agents: [...state.agents, agent],
        loading: false,
      }));
      
      return agent;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAgent: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      set(state => ({
        agents: state.agents.map(agent =>
          agent.id === id ? { ...agent, ...updates } : agent
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteAgent: async (id) => {
    set({ loading: true, error: null });
    try {
      set(state => ({
        agents: state.agents.filter(agent => agent.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));