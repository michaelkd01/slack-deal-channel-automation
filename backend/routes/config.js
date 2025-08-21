const express = require('express');
const router = express.Router();
const db = require('../models');
const SlackService = require('../services/slackService');

router.get('/users/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { sync } = req.query;

    const workspace = await db.Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (sync === 'true') {
      const slackService = new SlackService(workspace.accessToken);
      const slackUsers = await slackService.getUsers();

      for (const slackUser of slackUsers) {
        const [user, created] = await db.User.findOrCreate({
          where: {
            slackUserId: slackUser.id,
            WorkspaceId: workspaceId
          },
          defaults: {
            email: slackUser.profile.email,
            displayName: slackUser.profile.display_name || slackUser.profile.real_name,
            realName: slackUser.profile.real_name,
            isActive: !slackUser.deleted
          }
        });

        if (!created) {
          await user.update({
            email: slackUser.profile.email,
            displayName: slackUser.profile.display_name || slackUser.profile.real_name,
            realName: slackUser.profile.real_name,
            isActive: !slackUser.deleted
          });
        }
      }
    }

    const users = await db.User.findAll({
      where: { WorkspaceId: workspaceId },
      order: [['displayName', 'ASC']]
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:userId/default', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isDefault } = req.body;

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ isDefaultMember: isDefault });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/bulk-default', async (req, res) => {
  try {
    const { workspaceId, userIds, isDefault } = req.body;

    if (!workspaceId || !Array.isArray(userIds)) {
      return res.status(400).json({ 
        error: 'workspaceId and userIds array are required' 
      });
    }

    await db.User.update(
      { isDefaultMember: isDefault },
      {
        where: {
          id: userIds,
          WorkspaceId: workspaceId
        }
      }
    );

    const updatedUsers = await db.User.findAll({
      where: {
        id: userIds,
        WorkspaceId: workspaceId
      }
    });

    res.json(updatedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/default-users/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const defaultUsers = await db.User.findAll({
      where: {
        WorkspaceId: workspaceId,
        isDefaultMember: true,
        isActive: true
      },
      order: [['displayName', 'ASC']]
    });

    res.json(defaultUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates/message/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const templates = await db.Template.findAll({
      where: {
        workspaceId: workspaceId,
        type: 'message'
      }
    });

    if (templates.length === 0) {
      const defaultTemplates = [
        {
          name: 'Standard Welcome',
          template: '🎯 *New Deal Channel Created*\n\n*Client:* {client}\n*Deal:* {deal}\n*Value:* {value}\n*Owner:* {owner}\n*Stage:* {stage}\n*Created:* {date}\n\nWelcome to the deal channel! Use this space to collaborate on all aspects of this opportunity.',
          variables: ['client', 'deal', 'value', 'owner', 'stage', 'date'],
          isDefault: true
        },
        {
          name: 'Detailed Welcome',
          template: '🚀 *Deal Channel: {deal}*\n\n📊 *Deal Information*\n• Client: {client}\n• Deal Value: {value}\n• Stage: {stage}\n• Owner: {owner}\n• Target Close: {close_date}\n\n📋 *Next Steps*\n1. Review deal requirements\n2. Schedule kickoff meeting\n3. Assign team roles\n\n💬 *Channel Guidelines*\n• Keep all deal discussions in this channel\n• Tag relevant team members with @mentions\n• Share documents and updates regularly\n\nLet\'s close this deal! 💪',
          variables: ['client', 'deal', 'value', 'stage', 'owner', 'close_date'],
          isDefault: false
        },
        {
          name: 'Minimal',
          template: 'Deal channel for *{client} - {deal}*\nOwner: {owner} | Value: {value}',
          variables: ['client', 'deal', 'owner', 'value'],
          isDefault: false
        }
      ];
      return res.json(defaultTemplates);
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates/message', async (req, res) => {
  try {
    const { workspaceId, name, template, variables, isDefault } = req.body;

    if (!workspaceId || !name || !template) {
      return res.status(400).json({ 
        error: 'workspaceId, name, and template are required' 
      });
    }

    if (isDefault) {
      await db.Template.update(
        { isDefault: false },
        {
          where: {
            workspaceId: workspaceId,
            type: 'message',
            isDefault: true
          }
        }
      );
    }

    const newTemplate = await db.Template.create({
      workspaceId,
      name,
      type: 'message',
      template,
      variables: variables || [],
      isDefault: isDefault || false
    });

    res.json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const configurations = await db.Configuration.findAll({
      where: { workspaceId: workspaceId }
    });

    const settings = {};
    configurations.forEach(config => {
      settings[config.key] = config.value;
    });

    const defaultSettings = {
      autoArchiveDays: 90,
      requireApproval: false,
      notifyOnCreate: true,
      allowCustomNames: true,
      enforceNamingConvention: false,
      maxChannelsPerDay: 50,
      fiscalYearStart: 1
    };

    res.json({ ...defaultSettings, ...settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.Configuration.upsert({
        workspaceId,
        key,
        value,
        updatedAt: new Date()
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;