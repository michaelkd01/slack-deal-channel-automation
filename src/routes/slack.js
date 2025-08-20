const express = require('express');
const { InstallProvider } = require('@slack/oauth');
const db = require('../models');
const router = express.Router();

const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SESSION_SECRET || 'my-state-secret',
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
        res.send(`
          <html>
            <body>
              <h1>Success!</h1>
              <p>Slack app installed successfully. You can close this window.</p>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3001'}';
                }, 2000);
              </script>
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