import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from 'react-flow-renderer';
import { Box, Typography, Paper, Chip } from '@mui/material';

// Custom node component
const TaskNode = ({ data }: NodeProps) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'failed':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        minWidth: 200,
        border: 2,
        borderColor: getStatusColor(),
        borderRadius: 2,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Box>
        <Typography variant="subtitle2" fontWeight="bold">
          {data.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data.agent}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={data.status}
            size="small"
            sx={{
              backgroundColor: getStatusColor(),
              color: 'white',
            }}
          />
        </Box>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

const nodeTypes = {
  taskNode: TaskNode,
};

function Workflow() {
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'taskNode',
      position: { x: 250, y: 0 },
      data: {
        label: 'Planning',
        agent: 'BMAD Planner',
        status: 'completed',
      },
    },
    {
      id: '2',
      type: 'taskNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'API Design',
        agent: 'Architect',
        status: 'completed',
      },
    },
    {
      id: '3',
      type: 'taskNode',
      position: { x: 400, y: 100 },
      data: {
        label: 'Database Schema',
        agent: 'Architect',
        status: 'completed',
      },
    },
    {
      id: '4',
      type: 'taskNode',
      position: { x: 0, y: 200 },
      data: {
        label: 'Auth Module',
        agent: 'Builder #1',
        status: 'in_progress',
      },
    },
    {
      id: '5',
      type: 'taskNode',
      position: { x: 200, y: 200 },
      data: {
        label: 'User API',
        agent: 'Builder #2',
        status: 'in_progress',
      },
    },
    {
      id: '6',
      type: 'taskNode',
      position: { x: 400, y: 200 },
      data: {
        label: 'Data Models',
        agent: 'Builder #3',
        status: 'pending',
      },
    },
    {
      id: '7',
      type: 'taskNode',
      position: { x: 100, y: 300 },
      data: {
        label: 'Security Review',
        agent: 'Reviewer',
        status: 'pending',
      },
    },
    {
      id: '8',
      type: 'taskNode',
      position: { x: 300, y: 300 },
      data: {
        label: 'Integration Tests',
        agent: 'QA Engineer',
        status: 'pending',
      },
    },
    {
      id: '9',
      type: 'taskNode',
      position: { x: 200, y: 400 },
      data: {
        label: 'Deployment',
        agent: 'DevOps',
        status: 'pending',
      },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e2-5', source: '2', target: '5' },
    { id: 'e3-6', source: '3', target: '6' },
    { id: 'e4-7', source: '4', target: '7' },
    { id: 'e5-7', source: '5', target: '7' },
    { id: 'e6-8', source: '6', target: '8' },
    { id: 'e7-9', source: '7', target: '9' },
    { id: 'e8-9', source: '8', target: '9' },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      <Typography variant="h4" gutterBottom>
        Workflow Visualization
      </Typography>
      
      <Paper sx={{ height: '100%', p: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.status) {
                case 'completed':
                  return '#4caf50';
                case 'in_progress':
                  return '#2196f3';
                case 'failed':
                  return '#f44336';
                default:
                  return '#757575';
              }
            }}
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Chip label="Completed" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
        <Chip label="In Progress" sx={{ backgroundColor: '#2196f3', color: 'white' }} />
        <Chip label="Pending" sx={{ backgroundColor: '#757575', color: 'white' }} />
        <Chip label="Failed" sx={{ backgroundColor: '#f44336', color: 'white' }} />
      </Box>
    </Box>
  );
}

export default Workflow;