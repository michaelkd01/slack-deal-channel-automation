import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Sync as SyncIcon } from '@mui/icons-material';
import { slackApi, configApi, channelApi, Workspace, User, Template } from '../services/api';

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

export default function Settings() {
  const [tab, setTab] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [namingTemplates, setNamingTemplates] = useState<Template[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [newNamingTemplate, setNewNamingTemplate] = useState({
    name: '',
    template: '',
    description: '',
  });

  const [newMessageTemplate, setNewMessageTemplate] = useState({
    name: '',
    template: '',
    description: '',
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData();
    }
  }, [selectedWorkspace]);

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

  const loadWorkspaceData = async () => {
    try {
      const [usersRes, namingRes, messageRes, settingsRes] = await Promise.all([
        configApi.getUsers(selectedWorkspace),
        channelApi.getNamingTemplates(selectedWorkspace),
        configApi.getMessageTemplates(selectedWorkspace),
        configApi.getSettings(selectedWorkspace),
      ]);

      setUsers(usersRes.data);
      setNamingTemplates(namingRes.data);
      setMessageTemplates(messageRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  const syncUsers = async () => {
    setLoading(true);
    try {
      const response = await configApi.getUsers(selectedWorkspace, true);
      setUsers(response.data);
      setSuccess('Users synced successfully');
    } catch (err) {
      console.error('Failed to sync users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserDefault = async (userId: string, currentStatus: boolean) => {
    try {
      await configApi.updateUserDefault(userId, !currentStatus);
      loadWorkspaceData();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const saveNamingTemplate = async () => {
    if (!newNamingTemplate.name || !newNamingTemplate.template) return;

    try {
      await channelApi.createNamingTemplate({
        ...newNamingTemplate,
        workspaceId: selectedWorkspace,
        type: 'naming',
        variables: [],
        isDefault: false,
      });
      setNewNamingTemplate({ name: '', template: '', description: '' });
      loadWorkspaceData();
      setSuccess('Naming template saved');
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const saveMessageTemplate = async () => {
    if (!newMessageTemplate.name || !newMessageTemplate.template) return;

    try {
      await configApi.createMessageTemplate({
        ...newMessageTemplate,
        workspaceId: selectedWorkspace,
        type: 'message',
        variables: [],
        isDefault: false,
      });
      setNewMessageTemplate({ name: '', template: '', description: '' });
      loadWorkspaceData();
      setSuccess('Message template saved');
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const saveSettings = async () => {
    try {
      await configApi.updateSettings(selectedWorkspace, settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <FormControl fullWidth sx={{ p: 2 }}>
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
      </Paper>

      {selectedWorkspace && (
        <Paper>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Users" />
            <Tab label="Naming Templates" />
            <Tab label="Message Templates" />
            <Tab label="General Settings" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Default Team Members</Typography>
              <Button
                startIcon={<SyncIcon />}
                onClick={syncUsers}
                disabled={loading}
              >
                Sync Users
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              These users will be automatically added to all new deal channels
            </Typography>
            <List>
              {users.map((user) => (
                <ListItem key={user.id}>
                  <ListItemText
                    primary={user.displayName}
                    secondary={user.email}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={user.isDefaultMember}
                      onChange={() => toggleUserDefault(user.id, user.isDefaultMember)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography variant="h6" gutterBottom>
              Channel Naming Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Available variables: {'{client}'}, {'{client_short}'}, {'{deal}'}, {'{date}'}, {'{year}'}, {'{month}'}, {'{day}'}, {'{owner}'}, {'{owner_initials}'}, {'{stage}'}, {'{value}'}, {'{quarter}'}
            </Typography>
            
            <List sx={{ mb: 3 }}>
              {namingTemplates.map((template) => (
                <ListItem key={template.name}>
                  <ListItemText
                    primary={template.name}
                    secondary={template.template}
                  />
                  {template.isDefault && (
                    <Chip label="Default" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>

            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Template
              </Typography>
              <TextField
                fullWidth
                label="Template Name"
                value={newNamingTemplate.name}
                onChange={(e) => setNewNamingTemplate({ ...newNamingTemplate, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Template Pattern"
                value={newNamingTemplate.template}
                onChange={(e) => setNewNamingTemplate({ ...newNamingTemplate, template: e.target.value })}
                placeholder="deal-{client_short}-{date}"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={saveNamingTemplate}
                disabled={!newNamingTemplate.name || !newNamingTemplate.template}
              >
                Save Template
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography variant="h6" gutterBottom>
              First Message Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Available variables: {'{client}'}, {'{deal}'}, {'{value}'}, {'{owner}'}, {'{stage}'}, {'{date}'}
            </Typography>
            
            <List sx={{ mb: 3 }}>
              {messageTemplates.map((template) => (
                <ListItem key={template.name}>
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {template.template.substring(0, 100)}...
                      </Typography>
                    }
                  />
                  {template.isDefault && (
                    <Chip label="Default" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>

            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Template
              </Typography>
              <TextField
                fullWidth
                label="Template Name"
                value={newMessageTemplate.name}
                onChange={(e) => setNewMessageTemplate({ ...newMessageTemplate, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message Template"
                value={newMessageTemplate.template}
                onChange={(e) => setNewMessageTemplate({ ...newMessageTemplate, template: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={saveMessageTemplate}
                disabled={!newMessageTemplate.name || !newMessageTemplate.template}
              >
                Save Template
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                type="number"
                label="Auto-archive channels after (days)"
                value={settings.autoArchiveDays || 90}
                onChange={(e) => setSettings({ ...settings, autoArchiveDays: parseInt(e.target.value) })}
                helperText="Automatically archive channels after this many days of inactivity"
              />

              <TextField
                type="number"
                label="Max channels per day"
                value={settings.maxChannelsPerDay || 50}
                onChange={(e) => setSettings({ ...settings, maxChannelsPerDay: parseInt(e.target.value) })}
                helperText="Maximum number of channels that can be created per day"
              />

              <FormControl>
                <InputLabel>Fiscal Year Start Month</InputLabel>
                <Select
                  value={settings.fiscalYearStart || 1}
                  onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                  label="Fiscal Year Start Month"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month}>
                      {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveSettings}
                sx={{ alignSelf: 'flex-start' }}
              >
                Save Settings
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
}