import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    defaultAgent: 'dev',
    parallelAgents: 3,
    autoCommit: true,
    toolApproval: 'ask',
    theme: 'dark',
    mcpServers: [
      { name: 'GitHub', url: 'http://localhost:3001', enabled: true },
      { name: 'Web Search', url: 'http://localhost:3002', enabled: true },
    ],
    gitConfig: {
      defaultBranch: 'main',
      autoMerge: false,
      squashCommits: true,
    },
  });

  const handleSettingChange = (setting: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleGitConfigChange = (setting: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      gitConfig: {
        ...prev.gitConfig,
        [setting]: value,
      },
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="General" />
            <Tab label="Agents" />
            <Tab label="MCP Servers" />
            <Tab label="Git" />
            <Tab label="Advanced" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  label="Theme"
                >
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Directory"
                defaultValue="/home/user/projects"
                InputProps={{
                  endAdornment: (
                    <IconButton edge="end">
                      <FolderIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoCommit}
                    onChange={(e) => handleSettingChange('autoCommit', e.target.checked)}
                  />
                }
                label="Auto-commit after each agent response"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tool Approval Mode</InputLabel>
                <Select
                  value={settings.toolApproval}
                  onChange={(e) => handleSettingChange('toolApproval', e.target.value)}
                  label="Tool Approval Mode"
                >
                  <MenuItem value="ask">Ask for approval</MenuItem>
                  <MenuItem value="allow">Always allow</MenuItem>
                  <MenuItem value="deny">Always deny</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Default Agent Type</InputLabel>
                <Select
                  value={settings.defaultAgent}
                  onChange={(e) => handleSettingChange('defaultAgent', e.target.value)}
                  label="Default Agent Type"
                >
                  <MenuItem value="dev">Developer</MenuItem>
                  <MenuItem value="architect">Architect</MenuItem>
                  <MenuItem value="planner">Planner</MenuItem>
                  <MenuItem value="reviewer">Reviewer</MenuItem>
                  <MenuItem value="qa">QA Engineer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Parallel Agents"
                value={settings.parallelAgents}
                onChange={(e) => handleSettingChange('parallelAgents', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Agent Timeout Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Task Timeout (minutes)"
                    type="number"
                    defaultValue={30}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Idle Timeout (minutes)"
                    type="number"
                    defaultValue={5}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">MCP Servers</Typography>
            <Button startIcon={<AddIcon />} variant="outlined" size="small">
              Add Server
            </Button>
          </Box>
          
          <List>
            {settings.mcpServers.map((server, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={server.name}
                  secondary={server.url}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={server.enabled}
                    onChange={(e) => {
                      const newServers = [...settings.mcpServers];
                      newServers[index].enabled = e.target.checked;
                      handleSettingChange('mcpServers', newServers);
                    }}
                  />
                  <IconButton edge="end" sx={{ ml: 1 }}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            MCP Connection Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Connection Timeout (seconds)"
                type="number"
                defaultValue={30}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Retry Attempts"
                type="number"
                defaultValue={3}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Branch"
                value={settings.gitConfig.defaultBranch}
                onChange={(e) => handleGitConfigChange('defaultBranch', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.gitConfig.autoMerge}
                    onChange={(e) => handleGitConfigChange('autoMerge', e.target.checked)}
                  />
                }
                label="Auto-merge completed sessions"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.gitConfig.squashCommits}
                    onChange={(e) => handleGitConfigChange('squashCommits', e.target.checked)}
                  />
                }
                label="Squash commits when merging"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Commit Message Template
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                defaultValue="[{{agent}}] {{message}}\n\nTask: {{task}}\nSession: {{session}}"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Danger Zone
              </Typography>
              <Paper sx={{ p: 2, border: 1, borderColor: 'error.main' }}>
                <Button color="error" variant="outlined">
                  Clear All Sessions
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  This will remove all session data and cannot be undone.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Export/Import
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined">Export Settings</Button>
                <Button variant="outlined">Import Settings</Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Debug
              </Typography>
              <FormControlLabel
                control={<Switch />}
                label="Enable debug logging"
              />
              <FormControlLabel
                control={<Switch />}
                label="Show system notifications"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<SaveIcon />}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
}

export default Settings;