import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  OpenInNew as OpenInNewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { channelApi, slackApi, Workspace, Channel } from '../services/api';

export default function Channels() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadChannels();
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    filterChannels();
  }, [channels, searchTerm, stageFilter]);

  const loadWorkspaces = async () => {
    try {
      const response = await slackApi.getWorkspaces();
      setWorkspaces(response.data);
      if (response.data.length === 1) {
        setSelectedWorkspace(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await channelApi.getChannels(selectedWorkspace);
      setChannels(response.data);
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const filterChannels = () => {
    let filtered = [...channels];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.slackChannelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.dealOwner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== 'all') {
      if (stageFilter === 'archived') {
        filtered = filtered.filter((c) => c.isArchived);
      } else if (stageFilter === 'active') {
        filtered = filtered.filter((c) => !c.isArchived);
      } else {
        filtered = filtered.filter((c) => c.dealStage === stageFilter);
      }
    }

    setFilteredChannels(filtered);
  };

  const handleArchive = async (channelId: string) => {
    if (!window.confirm('Are you sure you want to archive this channel?')) {
      return;
    }

    try {
      await channelApi.archiveChannel(channelId);
      loadChannels();
    } catch (err) {
      console.error('Failed to archive channel:', err);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageColor = (stage?: string) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' } = {
      'Prospecting': 'default',
      'Qualification': 'info',
      'Proposal': 'primary',
      'Negotiation': 'warning',
      'Closing': 'secondary',
      'Closed Won': 'success',
      'Closed Lost': 'error',
    };
    return colors[stage || ''] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Channels
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Workspace</InputLabel>
            <Select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              label="Workspace"
            >
              {workspaces.map((ws) => (
                <MenuItem key={ws.id} value={ws.id}>
                  {ws.slackTeamName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Stage Filter</InputLabel>
            <Select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              label="Stage Filter"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
              <MenuItem value="Prospecting">Prospecting</MenuItem>
              <MenuItem value="Qualification">Qualification</MenuItem>
              <MenuItem value="Proposal">Proposal</MenuItem>
              <MenuItem value="Negotiation">Negotiation</MenuItem>
              <MenuItem value="Closing">Closing</MenuItem>
              <MenuItem value="Closed Won">Closed Won</MenuItem>
              <MenuItem value="Closed Lost">Closed Lost</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Showing {filteredChannels.length} of {channels.length} channels
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Channel</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Deal</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredChannels.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    #{channel.slackChannelName}
                  </Typography>
                  {channel.isArchived && (
                    <Chip label="Archived" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell>{channel.clientName}</TableCell>
                <TableCell>{channel.dealName}</TableCell>
                <TableCell>{formatCurrency(channel.dealValue)}</TableCell>
                <TableCell>{channel.dealOwner || '-'}</TableCell>
                <TableCell>
                  {channel.dealStage && (
                    <Chip
                      label={channel.dealStage}
                      size="small"
                      color={getStageColor(channel.dealStage)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(channel.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {channel.webUrl && (
                    <IconButton
                      size="small"
                      onClick={() => window.open(channel.webUrl, '_blank')}
                      title="Open in Slack"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  )}
                  {!channel.isArchived && (
                    <IconButton
                      size="small"
                      onClick={() => handleArchive(channel.id)}
                      title="Archive"
                    >
                      <ArchiveIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredChannels.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No channels found
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}