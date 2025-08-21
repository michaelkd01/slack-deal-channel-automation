import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
} from '@mui/material';
import {
  Check as CheckIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { slackApi, Workspace } from '../services/api';

const steps = [
  {
    label: 'Create Slack App',
    description: 'Create a new Slack app in your workspace',
  },
  {
    label: 'Configure OAuth & Permissions',
    description: 'Set up the required OAuth scopes and redirect URLs',
  },
  {
    label: 'Install to Workspace',
    description: 'Install the app to your Slack workspace',
  },
  {
    label: 'Configure Default Settings',
    description: 'Set up naming conventions and default team members',
  },
];

export default function Setup() {
  const [activeStep, setActiveStep] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    checkWorkspaces();
  }, []);

  const checkWorkspaces = async () => {
    try {
      const response = await slackApi.getWorkspaces();
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setActiveStep(3);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const handleInstallSlack = () => {
    slackApi.installSlack();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Setup Guide
      </Typography>

      {workspaces.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Slack workspace connected successfully!
          </Typography>
          <Typography variant="body2">
            Connected to: {workspaces.map(w => w.slackTeamName).join(', ')}
          </Typography>
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Create Slack App</StepLabel>
            <StepContent>
              <Typography paragraph>
                First, you need to create a new Slack app in your workspace:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText>
                    Go to{' '}
                    <Link href="https://api.slack.com/apps" target="_blank" rel="noopener">
                      api.slack.com/apps <OpenInNewIcon sx={{ fontSize: 14, ml: 0.5 }} />
                    </Link>
                  </ListItemText>
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText>Click "Create New App" → "From scratch"</ListItemText>
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText>Name your app "Deal Channel Automation"</ListItemText>
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText>Select your workspace</ListItemText>
                </ListItem>
              </List>
              <Button variant="contained" onClick={() => setActiveStep(1)}>
                Next
              </Button>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Configure OAuth & Permissions</StepLabel>
            <StepContent>
              <Typography paragraph>
                Configure the OAuth settings and permissions:
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                1. OAuth Redirect URLs:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {window.location.origin.replace(':3001', ':3000')}/api/slack/oauth_redirect
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>
                2. Bot Token Scopes:
              </Typography>
              <List dense>
                {[
                  'channels:manage',
                  'channels:read',
                  'chat:write',
                  'users:read',
                  'groups:write',
                  'groups:read',
                  'im:write',
                  'mpim:write',
                ].map((scope) => (
                  <ListItem key={scope}>
                    <ListItemText
                      primary={scope}
                      primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                3. Save your credentials in the .env file:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
                  SLACK_CLIENT_ID=your_client_id{'\n'}
                  SLACK_CLIENT_SECRET=your_client_secret{'\n'}
                  SLACK_SIGNING_SECRET=your_signing_secret
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setActiveStep(0)}>Back</Button>
                <Button variant="contained" onClick={() => setActiveStep(2)}>
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Install to Workspace</StepLabel>
            <StepContent>
              <Typography paragraph>
                Now install the app to your Slack workspace:
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Make sure you've configured the OAuth settings and saved your credentials in the .env file before proceeding.
              </Alert>

              <Button
                variant="contained"
                color="primary"
                onClick={handleInstallSlack}
                sx={{ mb: 2 }}
              >
                Install to Slack
              </Button>

              <Typography variant="body2" color="text.secondary">
                This will redirect you to Slack to authorize the app. After authorization, you'll be redirected back here.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button onClick={() => setActiveStep(1)}>Back</Button>
                <Button variant="outlined" onClick={() => setActiveStep(3)}>
                  Skip (if already installed)
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Configure Default Settings</StepLabel>
            <StepContent>
              <Typography paragraph>
                Great! Your Slack app is connected. Now configure your default settings:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText>
                    Go to <Link href="/settings">Settings</Link> to configure:
                  </ListItemText>
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText>• Default team members for all channels</ListItemText>
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText>• Channel naming templates</ListItemText>
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText>• First message templates</ListItemText>
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText>• Auto-archive settings</ListItemText>
                </ListItem>
              </List>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Optional: Salesforce Integration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                For Salesforce integration, you'll need to create a Connected App in Salesforce and configure the webhook endpoints. This can be set up later.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setActiveStep(2)}>Back</Button>
                <Button variant="contained" href="/settings">
                  Go to Settings
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        {activeStep === 4 && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success">
              <Typography variant="subtitle1">
                Setup Complete! 🎉
              </Typography>
              <Typography variant="body2">
                Your Slack Deal Channel Automation tool is ready to use. You can now create channels from the Dashboard or Create Channel page.
              </Typography>
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
}