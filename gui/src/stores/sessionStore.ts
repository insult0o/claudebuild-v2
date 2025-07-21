import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agent?: string;
  dependencies?: string[];
}

export interface Session {
  id: string;
  branch: string;
  worktree: string;
  status: 'active' | 'paused' | 'completed';
  agent: string;
  task?: {
    description: string;
  };
  tasks?: Task[];
  progress?: number;
  created: string;
  checkpoints: Array<{
    id: string;
    message: string;
    timestamp: string;
  }>;
}

interface SessionStore {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSessions: () => Promise<void>;
  createSession: (options: any) => Promise<Session>;
  resumeSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string, options?: any) => Promise<void>;
  checkpointSession: (sessionId: string, message: string) => Promise<void>;
  selectSession: (session: Session) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [
    // Mock data for development
    {
      id: 'session-001',
      branch: 'feature/auth',
      worktree: '.worktrees/session-001',
      status: 'active',
      agent: 'dev',
      task: { description: 'Implement OAuth2 authentication' },
      progress: 65,
      created: new Date().toISOString(),
      checkpoints: [
        { id: 'cp-1', message: 'Initial setup', timestamp: new Date().toISOString() },
        { id: 'cp-2', message: 'Added login endpoint', timestamp: new Date().toISOString() },
      ],
      tasks: [
        { id: 't1', title: 'Setup OAuth provider', status: 'completed' },
        { id: 't2', title: 'Create login endpoint', status: 'completed' },
        { id: 't3', title: 'Add JWT tokens', status: 'in_progress' },
        { id: 't4', title: 'Write tests', status: 'pending', dependencies: ['t3'] },
      ],
    },
    {
      id: 'session-002',
      branch: 'feature/api',
      worktree: '.worktrees/session-002',
      status: 'paused',
      agent: 'architect',
      task: { description: 'Design REST API endpoints' },
      progress: 30,
      created: new Date().toISOString(),
      checkpoints: [],
    },
  ],
  currentSession: null,
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      // In production, this would call Tauri command
      // const sessions = await invoke('get_sessions');
      // set({ sessions, loading: false });
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSession: async (options) => {
    set({ loading: true, error: null });
    try {
      // const session = await invoke('create_session', options);
      const session: Session = {
        id: `session-${Date.now()}`,
        branch: `feature/${options.task}`,
        worktree: `.worktrees/session-${Date.now()}`,
        status: 'active',
        agent: options.agent || 'dev',
        task: { description: options.task },
        progress: 0,
        created: new Date().toISOString(),
        checkpoints: [],
      };
      
      set(state => ({
        sessions: [...state.sessions, session],
        loading: false,
      }));
      
      return session;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resumeSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      // await invoke('resume_session', { sessionId });
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, status: 'active' } : s
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  pauseSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      // await invoke('pause_session', { sessionId });
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, status: 'paused' } : s
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  completeSession: async (sessionId, options = {}) => {
    set({ loading: true, error: null });
    try {
      // await invoke('complete_session', { sessionId, ...options });
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, status: 'completed' } : s
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  checkpointSession: async (sessionId, message) => {
    set({ loading: true, error: null });
    try {
      // await invoke('checkpoint_session', { sessionId, message });
      const checkpoint = {
        id: `cp-${Date.now()}`,
        message,
        timestamp: new Date().toISOString(),
      };
      
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId
            ? { ...s, checkpoints: [...s.checkpoints, checkpoint] }
            : s
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectSession: (session) => {
    set({ currentSession: session });
  },
}));