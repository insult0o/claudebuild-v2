import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  ContentCopy as CopyIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-markdown';
import ReactMarkdown from 'react-markdown';

interface Command {
  name: string;
  description: string;
  usage: string;
  category: string;
  content: string;
}

const mockCommands: Command[] = [
  {
    name: 'plan',
    description: 'BMAD planning command for breaking down requirements',
    usage: '/plan "Build a secure file upload system"',
    category: 'Planning',
    content: '# /plan - BMAD Planning Command\n\n## Purpose\nBreaks down requirements using BMAD methodology...',
  },
  {
    name: 'build',
    description: 'Parallel agent builder for implementation',
    usage: '/build --from tasks.json --parallel 5',
    category: 'Development',
    content: '# /build - Parallel Builder Command\n\n## Purpose\nSpawns multiple agents in parallel...',
  },
  {
    name: 'review',
    description: 'Multi-perspective code review',
    usage: '/review --pr 123 --hat security,performance',
    category: 'Quality',
    content: '# /review - Code Review Command\n\n## Purpose\nReviews code from multiple perspectives...',
  },
  {
    name: 'deploy',
    description: 'CI/CD deployment pipeline',
    usage: '/deploy --env production',
    category: 'Operations',
    content: '# /deploy - Deployment Command\n\n## Purpose\nHandles deployment to various environments...',
  },
];

function Commands() {
  const [commands] = useState<Command[]>(mockCommands);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [commandArgs, setCommandArgs] = useState('');

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(commands.map((cmd) => cmd.category)));

  const handleRunCommand = () => {
    if (selectedCommand) {
      console.log(`Running: /${selectedCommand.name} ${commandArgs}`);
      setRunDialogOpen(false);
      setCommandArgs('');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      Planning: 'primary',
      Development: 'success',
      Quality: 'warning',
      Operations: 'error',
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Slash Commands</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Command
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search commands..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} key={category}>
            <Typography variant="h6" gutterBottom>
              {category}
            </Typography>
            <Grid container spacing={2}>
              {filteredCommands
                .filter((cmd) => cmd.category === category)
                .map((command) => (
                  <Grid item xs={12} md={6} lg={4} key={command.name}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TerminalIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                            /{command.name}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {command.description}
                        </Typography>
                        
                        <Paper sx={{ p: 1, bgcolor: 'background.default', mb: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                          >
                            {command.usage}
                          </Typography>
                        </Paper>
                        
                        <Chip
                          label={command.category}
                          size="small"
                          color={getCategoryColor(command.category)}
                        />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<RunIcon />}
                          onClick={() => {
                            setSelectedCommand(command);
                            setRunDialogOpen(true);
                          }}
                        >
                          Run
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedCommand(command);
                            setEditDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                        <IconButton size="small">
                          <CopyIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Grid>
        ))}
      </Grid>

      {/* View/Edit Command Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TerminalIcon sx={{ mr: 1 }} />
            /{selectedCommand?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <ReactMarkdown>{selectedCommand?.content || ''}</ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
          <Button startIcon={<EditIcon />} variant="outlined">
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Run Command Dialog */}
      <Dialog
        open={runDialogOpen}
        onClose={() => setRunDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Run Command: /{selectedCommand?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedCommand?.description}
            </Typography>
            
            <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Example:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedCommand?.usage}
              </Typography>
            </Paper>
            
            <TextField
              fullWidth
              label="Command Arguments"
              value={commandArgs}
              onChange={(e) => setCommandArgs(e.target.value)}
              placeholder="Enter arguments..."
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRunCommand} variant="contained" startIcon={<RunIcon />}>
            Run
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Commands;