import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { channelApi, configApi, slackApi, Workspace, User, Template } from '../services/api';

export default function CreateChannel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]);
  const [namingTemplates, setNamingTemplates] = useState<Template[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedMessageTemplate, setSelectedMessageTemplate] = useState<string>('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [channelPreview, setChannelPreview] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    clientName: '',
    dealName: '',
    dealValue: '',
    dealOwner: '',
    dealStage: '',
    dealId: '',
    customChannelName: '',
    firstMessage: '',
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData();
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedTemplate && !useCustomName) {
      previewChannelName();
    }
  }, [selectedTemplate, formData.clientName, formData.dealName, formData.dealOwner, formData.dealStage]);

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
      const [usersRes, defaultUsersRes, namingRes, messageRes] = await Promise.all([
        configApi.getUsers(selectedWorkspace),
        configApi.getDefaultUsers(selectedWorkspace),
        channelApi.getNamingTemplates(selectedWorkspace),
        configApi.getMessageTemplates(selectedWorkspace),
      ]);
      
      setUsers(usersRes.data);
      setDefaultUsers(defaultUsersRes.data);
      setNamingTemplates(namingRes.data);
      setMessageTemplates(messageRes.data);
      
      if (namingRes.data.length > 0) {
        const defaultTemplate = namingRes.data.find(t => t.isDefault) || namingRes.data[0];
        setSelectedTemplate(defaultTemplate.template);
      }
      
      if (messageRes.data.length > 0) {
        const defaultMessage = messageRes.data.find(t => t.isDefault) || messageRes.data[0];
        setSelectedMessageTemplate(defaultMessage.template);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  };

  const previewChannelName = async () => {
    if (!selectedTemplate) return;
    
    try {
      const response = await channelApi.previewChannelName(selectedTemplate, {
        clientName: formData.clientName,
        dealName: formData.dealName,
        dealOwner: formData.dealOwner,
        dealStage: formData.dealStage,
        dealValue: formData.dealValue,
      });
      setChannelPreview(response.data.channelName);
    } catch (err) {
      console.error('Failed to preview channel name:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const userIdSet = new Set([
        ...defaultUsers.map(u => u.slackUserId),
        ...selectedUsers,
      ]);
      const allUserIds = Array.from(userIdSet);

      const response = await channelApi.createChannel({
        workspaceId: selectedWorkspace,
        clientName: formData.clientName,
        dealName: formData.dealName,
        dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
        dealOwner: formData.dealOwner,
        dealStage: formData.dealStage,
        dealId: formData.dealId,
        customChannelName: useCustomName ? formData.customChannelName : undefined,
        templateId: !useCustomName ? selectedTemplate : undefined,
        userIds: allUserIds,
        firstMessage: useCustomMessage ? formData.firstMessage : undefined,
      });

      setSuccess(true);
      setFormData({
        clientName: '',
        dealName: '',
        dealValue: '',
        dealOwner: '',
        dealStage: '',
        dealId: '',
        customChannelName: '',
        firstMessage: '',
      });
      setSelectedUsers([]);
      
      if (response.data.channel.webUrl) {
        window.open(response.data.channel.webUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Deal Channel
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Channel created successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Client Name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Deal Name"
                value={formData.dealName}
                onChange={(e) => setFormData({ ...formData, dealName: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Deal Value"
                type="number"
                value={formData.dealValue}
                onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Deal Owner"
                value={formData.dealOwner}
                onChange={(e) => setFormData({ ...formData, dealOwner: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Deal Stage</InputLabel>
                <Select
                  value={formData.dealStage}
                  onChange={(e) => setFormData({ ...formData, dealStage: e.target.value })}
                  label="Deal Stage"
                >
                  <MenuItem value="Prospecting">Prospecting</MenuItem>
                  <MenuItem value="Qualification">Qualification</MenuItem>
                  <MenuItem value="Proposal">Proposal</MenuItem>
                  <MenuItem value="Negotiation">Negotiation</MenuItem>
                  <MenuItem value="Closing">Closing</MenuItem>
                  <MenuItem value="Closed Won">Closed Won</MenuItem>
                  <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Deal ID (Optional)"
                value={formData.dealId}
                onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Channel Name
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useCustomName}
                    onChange={(e) => setUseCustomName(e.target.checked)}
                  />
                }
                label="Use custom channel name"
              />
              {useCustomName ? (
                <TextField
                  fullWidth
                  label="Custom Channel Name"
                  value={formData.customChannelName}
                  onChange={(e) => setFormData({ ...formData, customChannelName: e.target.value })}
                  helperText="Must be lowercase, no spaces, 80 chars max"
                />
              ) : (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Naming Template</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      label="Naming Template"
                    >
                      {namingTemplates.map((template) => (
                        <MenuItem key={template.name} value={template.template}>
                          {template.name} - {template.template}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {channelPreview && (
                    <Alert severity="info">
                      Preview: #{channelPreview}
                    </Alert>
                  )}
                </>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Team Members
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Default members: {defaultUsers.map(u => u.displayName).join(', ') || 'None'}
              </Typography>
              <Autocomplete
                multiple
                options={users}
                getOptionLabel={(option) => option.displayName}
                value={users.filter(u => selectedUsers.includes(u.slackUserId))}
                onChange={(_, newValue) => {
                  setSelectedUsers(newValue.map(u => u.slackUserId));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Users"
                    placeholder="Select users to add"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.displayName}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                First Message
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useCustomMessage}
                    onChange={(e) => setUseCustomMessage(e.target.checked)}
                  />
                }
                label="Use custom message"
              />
              {useCustomMessage ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Custom First Message"
                  value={formData.firstMessage}
                  onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Message Template</InputLabel>
                  <Select
                    value={selectedMessageTemplate}
                    onChange={(e) => setSelectedMessageTemplate(e.target.value)}
                    label="Message Template"
                  >
                    {messageTemplates.map((template) => (
                      <MenuItem key={template.name} value={template.template}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading || !selectedWorkspace || !formData.clientName || !formData.dealName}
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}