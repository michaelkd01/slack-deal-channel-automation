const express = require('express');
const { InstallProvider } = require('@slack/oauth');
const db = require('../models');
const router = express.Router();

// Simple in-memory state store for development
const stateStore = new Map();

const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SESSION_SECRET || 'my-state-secret',
  // Disable state verification in serverless environments where sessions don't persist
  stateVerification: false,
  // Add a simple state store that always returns true (since verification is disabled)
  stateStore: {
    generateStateParam: () => {
      return 'dummy-state-' + Date.now();
    },
    verifyStateParam: () => {
      return { result: true };
    }
  },
  scopes: [
    'channels:manage',
    'channels:read',
    'chat:write',
    'users:read',
    'groups:write',
    'groups:read',
    'im:write',
    'mpim:write'
  ],
  installationStore: {
    storeInstallation: async (installation) => {
      const workspace = await db.Workspace.findOne({
        where: { slackTeamId: installation.team.id }
      });

      if (workspace) {
        await workspace.update({
          slackTeamName: installation.team.name,
          accessToken: installation.bot.token,
          botUserId: installation.bot.userId,
          installedBy: installation.user.id,
          isActive: true
        });
      } else {
        await db.Workspace.create({
          slackTeamId: installation.team.id,
          slackTeamName: installation.team.name,
          accessToken: installation.bot.token,
          botUserId: installation.bot.userId,
          installedBy: installation.user.id,
          isActive: true
        });
      }
      return installation;
    },
    fetchInstallation: async (installQuery) => {
      const workspace = await db.Workspace.findOne({
        where: { slackTeamId: installQuery.teamId }
      });
      
      if (!workspace) {
        throw new Error('No installation found');
      }

      return {
        team: { id: workspace.slackTeamId, name: workspace.slackTeamName },
        bot: { token: workspace.accessToken, userId: workspace.botUserId },
        user: { id: workspace.installedBy }
      };
    }
  }
});

router.get('/install', async (req, res) => {
  try {
    const url = await installer.generateInstallUrl({
      scopes: [
        'channels:manage',
        'channels:read',
        'chat:write',
        'users:read',
        'groups:write',
        'groups:read'
      ],
      metadata: req.query.metadata || '',
      redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/slack/oauth_redirect`
    });
    
    res.redirect(url);
  } catch (error) {
    console.error('Install URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate install URL', details: error.message });
  }
});

router.get('/oauth_redirect', async (req, res) => {
  try {
    await installer.handleCallback(req, res, {
      success: (installation, options, req, res) => {
        console.log('Slack installation successful:', {
          team: installation.team,
          bot: installation.bot.userId,
          user: installation.user.id
        });
        
        res.send(`
          <html>
          <head>
            <title>Slack Integration Success</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #4CAF50; }
              .info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
              .button:hover { background: #45a049; }
              .api-button { background: #2196F3; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">🎉 Success!</h1>
              <p>Slack app installed successfully for workspace: <strong>${installation.team.name}</strong></p>
              
              <div class="info">
                <h3>What's Next?</h3>
                <p>Your Slack workspace is now connected! You can:</p>
                <ul>
                  <li>Create deal channels with consistent naming</li>
                  <li>Automatically add team members to channels</li>
                  <li>Post deal information templates</li>
                  <li>Use API endpoints for Salesforce integration</li>
                </ul>
              </div>
              
              <h3>Quick Actions:</h3>
              <a href="/api/debug/workspaces" class="button api-button">View Connected Workspaces</a>
              <a href="/api/slack/workspaces" class="button api-button">Test API</a>
              <a href="/" class="button">Back to Home</a>
              
              <p><small>Team ID: ${installation.team.id}</small></p>
            </div>
          </body>
          </html>
        `);
      },
      failure: (error, options, req, res) => {
        res.status(500).send(`
          <html>
            <body>
              <h1>Installation Failed</h1>
              <p>Error: ${error.message}</p>
            </body>
          </html>
        `);
      }
    });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth failed');
  }
});

router.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await db.Workspace.findAll({
      where: { isActive: true },
      attributes: ['id', 'slackTeamName', 'slackTeamId', 'createdAt']
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;