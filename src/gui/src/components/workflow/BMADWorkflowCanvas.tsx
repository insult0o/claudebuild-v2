import React, { useState, useCallback } from 'react';
import { Box, Paper, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Group as AgentIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { ResponsiveNetwork } from '@nivo/network';

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
}

interface Agent {
  id: string;
  name: string;
  type: 'planner' | 'architect' | 'builder' | 'reviewer' | 'manager' | 'deployer';
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  progress: number;
  qualityScore?: number;
}

interface WorkflowState {
  currentPhase: string;
  phases: BMAdPhase[];
  agents: Agent[];
  dependencies: any[];
  qualityGates: any[];
}

interface BMADWorkflowCanvasProps {
  workflow: WorkflowState;
  agents: Agent[];
  onPhaseSelect?: (phase: BMAdPhase) => void;
  onAgentSelect?: (agent: Agent) => void;
}

/**
 * BMAD Workflow Canvas - Unique ClaudeBuild Feature
 * 
 * This component visualizes the Breakthrough Method for Agile AI-Driven Development
 * workflow in real-time, showing agent coordination and dependencies.
 * 
 * Superior to competitors:
 * - Claudia: No workflow methodology visualization
 * - Crystal: Basic timeline without workflow semantics
 * - Claude Squad: No structured workflow, just parallel execution
 */
export const BMADWorkflowCanvas: React.FC<BMADWorkflowCanvasProps> = ({
  workflow,
  agents,
  onPhaseSelect,
  onAgentSelect
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'phases' | 'network' | 'timeline'>('phases');

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'in_progress':
        return <PlayIcon color="primary" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getAgentTypeColor = (type: string) => {
    const colors = {
      planner: '#2196F3',     // Blue
      architect: '#9C27B0',   // Purple  
      builder: '#4CAF50',     // Green
      reviewer: '#FF9800',    // Orange
      manager: '#F44336',     // Red
      deployer: '#607D8B'     // Blue Grey
    };
    return colors[type as keyof typeof colors] || '#757575';
  };

  const renderPhaseCard = (phase: BMAdPhase) => (
    <Paper
      key={phase.id}
      elevation={selectedPhase === phase.id ? 8 : 2}
      sx={{
        p: 3,
        m: 1,
        minWidth: 320,
        maxWidth: 400,
        cursor: 'pointer',
        border: selectedPhase === phase.id ? '2px solid' : '1px solid',
        borderColor: selectedPhase === phase.id ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          elevation: 6,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={() => {
        setSelectedPhase(phase.id);
        onPhaseSelect?.(phase);
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getPhaseStatusIcon(phase.status)}
        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
          {phase.name}
        </Typography>
        <Chip 
          label={phase.status.replace('_', ' ').toUpperCase()}
          color={phase.status === 'completed' ? 'success' : 
                 phase.status === 'in_progress' ? 'primary' : 
                 phase.status === 'error' ? 'error' : 'default'}
          size="small"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {phase.description}
      </Typography>

      {phase.progress > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2">{phase.progress}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={phase.progress}
            sx={{ 
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
        </Box>
      )}

      {/* Assigned Agents */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Assigned Agents ({phase.agents.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {phase.agents.map((agent) => (
            <Tooltip key={agent.id} title={`${agent.name} - ${agent.status}`}>
              <Chip
                icon={<AgentIcon />}
                label={agent.name}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: getAgentTypeColor(agent.type),
                  color: getAgentTypeColor(agent.type),
                  '&:hover': {
                    backgroundColor: `${getAgentTypeColor(agent.type)}20`
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAgentSelect?.(agent);
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Phase Timing */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Estimated: {phase.estimatedTime}
          {phase.actualTime && ` | Actual: ${phase.actualTime}`}
        </Typography>
        <Box>
          <IconButton size="small">
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Dependencies Indicator */}
      {phase.dependencies.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body2" color="text.secondary">
            Dependencies: {phase.dependencies.join(', ')}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  const renderNetworkView = () => {
    // Convert BMAD workflow to network graph data
    const networkData = {
      nodes: workflow.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        status: phase.status,
        color: phase.status === 'completed' ? '#4CAF50' : 
               phase.status === 'in_progress' ? '#2196F3' : 
               phase.status === 'error' ? '#F44336' : '#757575'
      })),
      links: workflow.phases.flatMap(phase => 
        phase.dependencies.map(dep => ({
          source: dep,
          target: phase.id,
          distance: 100
        }))
      )
    };

    return (
      <Box sx={{ height: 600 }}>
        <ResponsiveNetwork
          data={networkData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          linkDistance={100}
          centeringStrength={0.3}
          repulsivity={6}
          nodeSize={16}
          activeNodeSize={24}
          nodeColor={(node: any) => node.color}
          nodeBorderWidth={2}
          nodeBorderColor="#ffffff"
          linkThickness={2}
          linkColor="#666666"
          isInteractive={true}
          nodeTooltip={(node: any) => (
            <Box sx={{ p: 1, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2">{node.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Status: {node.status}
              </Typography>
            </Box>
          )}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            BMAD Workflow Orchestration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Breakthrough Method for Agile AI-Driven Development
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={`Phase: ${workflow.phases.find(p => p.id === workflow.currentPhase)?.name || 'None'}`}
            color="primary"
          />
          <Chip 
            label={`Agents: ${agents.filter(a => a.status === 'running').length}/${agents.length} Active`}
            color="secondary"
          />
          
          <IconButton color="primary">
            <PlayIcon />
          </IconButton>
          <IconButton>
            <PauseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* View Mode Selector */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label="Phase View"
          variant={viewMode === 'phases' ? 'filled' : 'outlined'}
          onClick={() => setViewMode('phases')}
          sx={{ mr: 1 }}
        />
        <Chip
          label="Network View"
          variant={viewMode === 'network' ? 'filled' : 'outlined'}
          onClick={() => setViewMode('network')}
          sx={{ mr: 1 }}
        />
        <Chip
          label="Timeline View"
          variant={viewMode === 'timeline' ? 'filled' : 'outlined'}
          onClick={() => setViewMode('timeline')}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {viewMode === 'phases' && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
            p: 1
          }}>
            {workflow.phases.map(renderPhaseCard)}
          </Box>
        )}

        {viewMode === 'network' && renderNetworkView()}

        {viewMode === 'timeline' && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Timeline view coming soon...</Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced timeline visualization with agent coordination will be implemented here.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Selected Phase Details */}
      {selectedPhase && (
        <Paper sx={{ 
          position: 'absolute', 
          bottom: 20, 
          right: 20, 
          p: 2, 
          maxWidth: 400,
          backgroundColor: 'background.paper',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h6">
            {workflow.phases.find(p => p.id === selectedPhase)?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phase details and controls will be shown here
          </Typography>
        </Paper>
      )}
    </Box>
  );
};