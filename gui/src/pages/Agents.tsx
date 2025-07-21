import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Psychology as BrainIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  BugReport as BugIcon,
  Architecture as ArchitectureIcon,
} from '@mui/icons-material';
import { useAgentStore } from '../stores/agentStore';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-markdown';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`agent-tabpanel-${index}`}
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Agents() {
  const { agents, templates, createAgent } = useAgentStore();
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'planner':
        return <BrainIcon />;
      case 'architect':
        return <ArchitectureIcon />;
      case 'builder':
        return <CodeIcon />;
      case 'reviewer':
        return <SecurityIcon />;
      case 'qa':
        return <BugIcon />;
      default:
        return <BrainIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'default';
      case 'busy':
        return 'primary';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCreateFromTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCustomPrompt(template.systemPrompt || '');
    setCreateDialogOpen(true);
  };

  const handleCreateAgent = async () => {
    if (selectedTemplate) {
      await createAgent({
        ...selectedTemplate,
        systemPrompt: customPrompt,
        id: undefined, // Let the store generate a new ID
      });
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setCustomPrompt('');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agents
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Active Agents" />
          <Tab label="Agent Templates" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid item xs={12} md={6} lg={4} key={agent.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {getRoleIcon(agent.role)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{agent.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {agent.role}
                      </Typography>
                    </Box>
                    <Chip
                      label={agent.status}
                      color={getStatusColor(agent.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {agent.description}
                  </Typography>
                  
                  {agent.currentTask && (
                    <Paper sx={{ p: 1, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">
                        Current Task:
                      </Typography>
                      <Typography variant="body2">
                        {agent.currentTask}
                      </Typography>
                    </Paper>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Capabilities:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {agent.capabilities.map((cap) => (
                        <Chip key={cap} label={cap} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon />
                  </IconButton>
                  <Button
                    size="small"
                    startIcon={<RunIcon />}
                    disabled={agent.status === 'busy'}
                  >
                    Run Task
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreateFromTemplate({})}
          >
            Create Custom Agent
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      {getRoleIcon(template.role)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Capabilities:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {template.capabilities.map((cap) => (
                        <Chip key={cap} label={cap} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Create Agent Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.name
            ? `Create Agent from ${selectedTemplate.name} Template`
            : 'Create Custom Agent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Agent Name"
              fullWidth
              defaultValue={selectedTemplate?.name}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              defaultValue={selectedTemplate?.description}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              System Prompt
            </Typography>
            <Paper sx={{ p: 1 }}>
              <Editor
                value={customPrompt}
                onValueChange={setCustomPrompt}
                highlight={(code) => highlight(code, languages.markdown, 'markdown')}
                padding={10}
                style={{
                  fontFamily: '"Fira Code", monospace',
                  fontSize: 14,
                  minHeight: 200,
                }}
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAgent} variant="contained">
            Create Agent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agents;