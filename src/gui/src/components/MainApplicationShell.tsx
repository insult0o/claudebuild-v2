import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Group as AgentsIcon,
  Security as GovernanceIcon,
  Psychology as KnowledgeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import SplitPane from 'react-split-pane';
import { BMADWorkflowCanvas } from './workflow/BMADWorkflowCanvas';
import { SuperiorTimelineView } from './timeline/SuperiorTimelineView';
import { AgentOrchestrationMonitor } from './agents/AgentOrchestrationMonitor';
import { MCPToolGovernanceDashboard } from './mcp/MCPToolGovernanceDashboard';
import { KnowledgeGraphVisualization } from './knowledge/KnowledgeGraphVisualization';
import { ProjectNavigator } from './sidebar/ProjectNavigator';
import { StatusBar } from './status/StatusBar';
import { useClaudeBuildState } from '../stores/claudeBuildStore';

const DRAWER_WIDTH = 280;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 400;

type ViewMode = 'workflow' | 'timeline' | 'agents' | 'governance' | 'knowledge';

/**
 * ClaudeBuild v2.1.0 Main Application Shell
 * 
 * Superior to competitors:
 * - Claudia: Basic project browser vs our comprehensive BMAD workflow visualization
 * - Crystal: Simple timeline vs our agent-aware orchestration timeline
 * - Claude Squad: Terminal-only vs rich desktop GUI with modern UX patterns
 */
export const MainApplicationShell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('workflow');
  const [sidebarWidth, setSidebarWidth] = useState(DRAWER_WIDTH);
  
  const { workflow, ui, agents } = useClaudeBuildState();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'workflow':
        return (
          <BMADWorkflowCanvas 
            workflow={workflow}
            agents={agents}
            onPhaseSelect={(phase) => console.log('Phase selected:', phase)}
            onAgentSelect={(agent) => console.log('Agent selected:', agent)}
          />
        );
      case 'timeline':
        return (
          <SuperiorTimelineView
            events={workflow.history}
            agents={agents}
            onEventSelect={(event) => console.log('Event selected:', event)}
            onTimeRangeChange={(range) => console.log('Time range:', range)}
          />
        );
      case 'agents':
        return (
          <AgentOrchestrationMonitor
            agents={agents}
            dependencies={workflow.dependencies}
            onAgentAction={(action) => console.log('Agent action:', action)}
            onDependencyUpdate={(deps) => console.log('Dependencies:', deps)}
          />
        );
      case 'governance':
        return (
          <MCPToolGovernanceDashboard
            servers={workflow.mcpServers}
            policies={workflow.governancePolicies}
            auditTrail={workflow.auditTrail}
            onPolicyChange={(policy) => console.log('Policy change:', policy)}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeGraphVisualization
            knowledgeGraph={workflow.knowledgeGraph}
            insights={workflow.insights}
            onNodeSelect={(node) => console.log('Knowledge node:', node)}
            onInsightExplore={(insight) => console.log('Insight:', insight)}
          />
        );
      default:
        return <BMADWorkflowCanvas workflow={workflow} agents={agents} />;
    }
  };

  const navigationItems = [
    { 
      id: 'workflow', 
      label: 'BMAD Workflow', 
      icon: <DashboardIcon />, 
      tooltip: 'Breakthrough Method Agile Development workflow visualization'
    },
    { 
      id: 'timeline', 
      label: 'Agent Timeline', 
      icon: <TimelineIcon />, 
      tooltip: 'Advanced timeline with agent coordination and dependencies'
    },
    { 
      id: 'agents', 
      label: 'Orchestration', 
      icon: <AgentsIcon />, 
      tooltip: 'Real-time multi-agent coordination monitoring'
    },
    { 
      id: 'governance', 
      label: 'MCP Governance', 
      icon: <GovernanceIcon />, 
      tooltip: 'Tool access control and security governance'
    },
    { 
      id: 'knowledge', 
      label: 'Knowledge Graph', 
      icon: <KnowledgeIcon />, 
      tooltip: 'Learning visualization and research integration'
    }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ClaudeBuild v2.1.0 - {navigationItems.find(item => item.id === currentView)?.label}
          </Typography>

          {/* Quick Navigation */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navigationItems.map((item) => (
              <Tooltip key={item.id} title={item.tooltip}>
                <IconButton
                  color={currentView === item.id ? 'primary' : 'inherit'}
                  onClick={() => handleViewChange(item.id as ViewMode)}
                  sx={{
                    backgroundColor: currentView === item.id ? 'primary.main' : 'transparent',
                    '&:hover': {
                      backgroundColor: currentView === item.id ? 'primary.dark' : 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            ))}
            
            <IconButton color="inherit">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            marginTop: '56px',
            height: 'calc(100vh - 56px)',
            backgroundColor: 'background.paper',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          },
        }}
      >
        <ProjectNavigator
          projects={workflow.projects}
          currentProject={workflow.currentProject}
          onProjectSelect={(project) => console.log('Project selected:', project)}
          onProjectCreate={() => console.log('Create new project')}
        />
      </Drawer>

      {/* Main Content Area with Resizable Panels */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginTop: '56px',
          marginLeft: drawerOpen ? 0 : `-${sidebarWidth}px`,
          transition: theme => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          height: 'calc(100vh - 56px)',
          overflow: 'hidden'
        }}
      >
        <SplitPane
          split="horizontal"
          minSize={200}
          defaultSize="calc(100vh - 200px)"
          resizerStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            height: '4px',
            cursor: 'row-resize'
          }}
        >
          {/* Main Content Panel */}
          <Box
            sx={{
              height: '100%',
              padding: 2,
              backgroundColor: 'background.default',
              overflow: 'auto'
            }}
          >
            {renderMainContent()}
          </Box>

          {/* Bottom Status and Details Panel */}
          <Box
            sx={{
              height: '100%',
              backgroundColor: 'background.paper',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
          >
            <StatusBar
              agents={agents}
              workflow={workflow}
              mcpStatus={workflow.mcpStatus}
              performance={workflow.performance}
            />
          </Box>
        </SplitPane>
      </Box>
    </Box>
  );
};