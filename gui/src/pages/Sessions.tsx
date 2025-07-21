import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as ResumeIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Visibility as ViewIcon,
  Code as DiffIcon,
  Save as CheckpointIcon,
} from '@mui/icons-material';
import { useSessionStore } from '../stores/sessionStore';
import { useAgentStore } from '../stores/agentStore';

function Sessions() {
  const { sessions, createSession, resumeSession, pauseSession, completeSession } = useSessionStore();
  const { agents } = useAgentStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    task: '',
    agent: 'dev',
    baseBranch: 'main',
  });

  const handleCreateSession = async () => {
    try {
      await createSession(newSession);
      setCreateDialogOpen(false);
      setNewSession({ task: '', agent: 'dev', baseBranch: 'main' });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sessions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Session
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Checkpoints</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {session.id}
                  </Typography>
                </TableCell>
                <TableCell>{session.task?.description || 'No description'}</TableCell>
                <TableCell>{session.agent}</TableCell>
                <TableCell>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={session.progress || 0}
                        color={session.status === 'active' ? 'primary' : 'inherit'}
                      />
                    </Box>
                    <Typography variant="body2">
                      {session.progress || 0}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatDate(session.created)}</TableCell>
                <TableCell>{session.checkpoints.length}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    {session.status === 'active' ? (
                      <Tooltip title="Pause">
                        <IconButton
                          size="small"
                          onClick={() => pauseSession(session.id)}
                        >
                          <PauseIcon />
                        </IconButton>
                      </Tooltip>
                    ) : session.status === 'paused' ? (
                      <Tooltip title="Resume">
                        <IconButton
                          size="small"
                          onClick={() => resumeSession(session.id)}
                        >
                          <ResumeIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    
                    <Tooltip title="Checkpoint">
                      <IconButton size="small">
                        <CheckpointIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="View Diff">
                      <IconButton size="small">
                        <DiffIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {session.status !== 'completed' && (
                      <Tooltip title="Complete">
                        <IconButton
                          size="small"
                          onClick={() => completeSession(session.id)}
                        >
                          <CompleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Session Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Task Description"
              fullWidth
              multiline
              rows={3}
              value={newSession.task}
              onChange={(e) => setNewSession({ ...newSession, task: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Agent Type</InputLabel>
              <Select
                value={newSession.agent}
                onChange={(e) => setNewSession({ ...newSession, agent: e.target.value })}
                label="Agent Type"
              >
                <MenuItem value="dev">Developer</MenuItem>
                <MenuItem value="architect">Architect</MenuItem>
                <MenuItem value="planner">Planner</MenuItem>
                <MenuItem value="reviewer">Reviewer</MenuItem>
                <MenuItem value="qa">QA Engineer</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Base Branch"
              fullWidth
              value={newSession.baseBranch}
              onChange={(e) => setNewSession({ ...newSession, baseBranch: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!newSession.task}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Sessions;