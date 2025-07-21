import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSessionStore } from '../stores/sessionStore';
import { useAgentStore } from '../stores/agentStore';

function Dashboard() {
  const sessions = useSessionStore((state) => state.sessions);
  const agents = useAgentStore((state) => state.agents);

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalTasks = sessions.reduce((acc, s) => acc + (s.tasks?.length || 0), 0);
  const completedTasks = sessions.reduce((acc, s) => 
    acc + (s.tasks?.filter(t => t.status === 'completed').length || 0), 0
  );

  const stats = [
    { label: 'Active Sessions', value: activeSessions, color: 'primary' },
    { label: 'Total Agents', value: agents.length, color: 'secondary' },
    { label: 'Tasks Completed', value: `${completedTasks}/${totalTasks}`, color: 'success' },
    { label: 'Success Rate', value: '94%', color: 'info' },
  ];

  const recentSessions = sessions.slice(0, 3);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
              }}
            >
              <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
                {stat.label}
              </Typography>
              <Typography component="p" variant="h3">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Sessions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Sessions
      </Typography>
      <Grid container spacing={3}>
        {recentSessions.map((session) => (
          <Grid item xs={12} md={4} key={session.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {session.id}
                  </Typography>
                  <Chip
                    label={session.status}
                    color={session.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  {session.task?.description || 'No description'}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={session.progress || 0}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Typography variant="body2">
                  Agent: {session.agent || 'Not assigned'}
                </Typography>
              </CardContent>
              <CardActions>
                {session.status === 'active' ? (
                  <Button size="small" startIcon={<PauseIcon />}>
                    Pause
                  </Button>
                ) : (
                  <Button size="small" startIcon={<StartIcon />}>
                    Resume
                  </Button>
                )}
                <Button size="small">View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Activity Timeline */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Activity Timeline
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { time: '2 minutes ago', event: 'Session auth-001 completed', icon: <CompleteIcon color="success" /> },
            { time: '5 minutes ago', event: 'Agent builder-02 started task API-002', icon: <StartIcon color="primary" /> },
            { time: '10 minutes ago', event: 'Review failed for PR #123', icon: <ErrorIcon color="error" /> },
            { time: '15 minutes ago', event: 'New session created: feature-notifications', icon: <StartIcon color="primary" /> },
          ].map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.icon}
              <Box>
                <Typography variant="body1">{item.event}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.time}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;