import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Tag as TagIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { slackApi, channelApi, configApi, Workspace, Channel } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [recentChannels, setRecentChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState({
    totalChannels: 0,
    activeDeals: 0,
    totalValue: 0,
    defaultUsers: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const workspacesRes = await slackApi.getWorkspaces();
      setWorkspaces(workspacesRes.data);

      if (workspacesRes.data.length > 0) {
        const workspace = workspacesRes.data[0];
        const [channelsRes, defaultUsersRes] = await Promise.all([
          channelApi.getChannels(workspace.id),
          configApi.getDefaultUsers(workspace.id),
        ]);

        const channels = channelsRes.data;
        setRecentChannels(channels.slice(0, 5));

        const activeChannels = channels.filter(c => !c.isArchived);
        const totalValue = channels.reduce((sum, c) => sum + (c.dealValue || 0), 0);

        setStats({
          totalChannels: channels.length,
          activeDeals: activeChannels.length,
          totalValue,
          defaultUsers: defaultUsersRes.data.length,
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create')}
        >
          Create Channel
        </Button>
      </Box>

      {workspaces.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Slack Workspace Connected
          </Typography>
          <Typography color="text.secondary" paragraph>
            Connect your Slack workspace to start automating deal channels
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/setup')}
          >
            Connect Slack
          </Button>
        </Paper>
      )}

      {workspaces.length > 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TagIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Total Channels
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.totalChannels}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Active Deals
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.activeDeals}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography color="text.secondary" variant="body2">
                      Total Deal Value
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {formatCurrency(stats.totalValue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography color="text.secondary" variant="body2">
                      Default Members
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {stats.defaultUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Channels
                </Typography>
                <List>
                  {recentChannels.map((channel) => (
                    <ListItem key={channel.id}>
                      <ListItemText
                        primary={`#${channel.slackChannelName}`}
                        secondary={`${channel.clientName} - ${channel.dealName}`}
                      />
                      {channel.dealStage && (
                        <Chip label={channel.dealStage} size="small" />
                      )}
                    </ListItem>
                  ))}
                </List>
                {recentChannels.length === 0 && (
                  <Typography color="text.secondary">
                    No channels created yet
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Connected Workspaces
                </Typography>
                <List>
                  {workspaces.map((workspace) => (
                    <ListItem key={workspace.id}>
                      <ListItemText
                        primary={workspace.slackTeamName}
                        secondary={`Connected on ${new Date(workspace.createdAt).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}