const express = require('express');
const router = express.Router();
const db = require('../models');
const SlackService = require('../services/slackService');
const NamingService = require('../services/namingService');

router.post('/create', async (req, res) => {
  try {
    const {
      workspaceId,
      clientName,
      dealName,
      dealValue,
      dealOwner,
      dealStage,
      dealId,
      salesforceId,
      templateId,
      customChannelName,
      userIds,
      firstMessage,
      metadata
    } = req.body;

    if (!workspaceId || !clientName || !dealName) {
      return res.status(400).json({ 
        error: 'Missing required fields: workspaceId, clientName, and dealName are required' 
      });
    }

    const workspace = await db.Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    let channelName;
    if (customChannelName) {
      channelName = customChannelName;
    } else {
      let template = 'deal-{client_short}-{date}';
      
      if (templateId) {
        const savedTemplate = await db.Template.findOne({
          where: { 
            id: templateId,
            workspaceId: workspaceId,
            type: 'naming'
          }
        });
        if (savedTemplate) {
          template = savedTemplate.template;
        }
      } else {
        const defaultTemplate = await db.Template.findOne({
          where: {
            workspaceId: workspaceId,
            type: 'naming',
            isDefault: true
          }
        });
        if (defaultTemplate) {
          template = defaultTemplate.template;
        }
      }

      channelName = NamingService.generateChannelName(template, {
        clientName,
        dealName,
        dealValue,
        dealOwner,
        dealStage,
        dealId,
        ...metadata
      });
    }

    const validation = NamingService.validateChannelName(channelName);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid channel name', 
        details: validation.errors 
      });
    }

    const slackService = new SlackService(workspace.accessToken);
    
    const slackChannel = await slackService.createChannel(channelName);
    
    const channel = await db.Channel.create({
      slackChannelId: slackChannel.id,
      slackChannelName: slackChannel.name,
      dealId: dealId || null,
      dealName,
      clientName,
      dealValue: dealValue || null,
      dealOwner: dealOwner || null,
      dealStage: dealStage || null,
      salesforceId: salesforceId || null,
      metadata: metadata || {},
      createdBy: req.session?.userId || 'system',
      WorkspaceId: workspaceId
    });

    let defaultUserIds = [];
    const defaultUsers = await db.User.findAll({
      where: {
        WorkspaceId: workspaceId,
        isDefaultMember: true,
        isActive: true
      }
    });
    defaultUserIds = defaultUsers.map(u => u.slackUserId);

    const allUserIds = [...new Set([...defaultUserIds, ...(userIds || [])])];
    
    if (allUserIds.length > 0) {
      await slackService.inviteUsersToChannel(slackChannel.id, allUserIds);
      
      const usersToAssociate = await db.User.findAll({
        where: {
          slackUserId: allUserIds,
          WorkspaceId: workspaceId
        }
      });
      
      if (usersToAssociate.length > 0) {
        await channel.setUsers(usersToAssociate);
      }
    }

    if (dealStage) {
      await slackService.setChannelTopic(
        slackChannel.id, 
        `Deal Stage: ${dealStage} | Owner: ${dealOwner || 'Unassigned'}`
      );
    }

    let messageToPost = firstMessage;
    if (!messageToPost) {
      const messageTemplate = await db.Template.findOne({
        where: {
          workspaceId: workspaceId,
          type: 'message',
          isDefault: true
        }
      });

      if (messageTemplate) {
        messageToPost = messageTemplate.template
          .replace('{client}', clientName)
          .replace('{deal}', dealName)
          .replace('{value}', dealValue ? `$${dealValue.toLocaleString()}` : 'TBD')
          .replace('{owner}', dealOwner || 'Unassigned')
          .replace('{stage}', dealStage || 'Initial')
          .replace('{date}', new Date().toLocaleDateString());
      } else {
        messageToPost = `🎯 *New Deal Channel Created*\n\n` +
          `*Client:* ${clientName}\n` +
          `*Deal:* ${dealName}\n` +
          `*Value:* ${dealValue ? `$${dealValue.toLocaleString()}` : 'TBD'}\n` +
          `*Owner:* ${dealOwner || 'Unassigned'}\n` +
          `*Stage:* ${dealStage || 'Initial'}\n` +
          `*Created:* ${new Date().toLocaleDateString()}\n\n` +
          `Welcome to the deal channel! Use this space to collaborate on all aspects of this opportunity.`;
      }
    }

    await slackService.postMessage(slackChannel.id, messageToPost);

    res.json({
      success: true,
      channel: {
        id: channel.id,
        slackChannelId: slackChannel.id,
        slackChannelName: slackChannel.name,
        webUrl: `https://app.slack.com/client/${workspace.slackTeamId}/${slackChannel.id}`
      }
    });

  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ 
      error: 'Failed to create channel', 
      details: error.message 
    });
  }
});

router.get('/templates/naming', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.json(NamingService.getDefaultTemplates());
    }

    const templates = await db.Template.findAll({
      where: {
        workspaceId: workspaceId,
        type: 'naming'
      }
    });

    if (templates.length === 0) {
      return res.json(NamingService.getDefaultTemplates());
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/templates/naming', async (req, res) => {
  try {
    const { workspaceId, name, template, variables, isDefault, description } = req.body;

    if (!workspaceId || !name || !template) {
      return res.status(400).json({ 
        error: 'Missing required fields: workspaceId, name, and template are required' 
      });
    }

    if (isDefault) {
      await db.Template.update(
        { isDefault: false },
        { 
          where: { 
            workspaceId: workspaceId,
            type: 'naming',
            isDefault: true
          }
        }
      );
    }

    const newTemplate = await db.Template.create({
      workspaceId,
      name,
      type: 'naming',
      template,
      variables: variables || [],
      isDefault: isDefault || false,
      description
    });

    res.json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/preview-name', async (req, res) => {
  try {
    const { template, ...variables } = req.query;
    
    if (!template) {
      return res.status(400).json({ error: 'Template is required' });
    }

    const channelName = NamingService.generateChannelName(template, variables);
    const validation = NamingService.validateChannelName(channelName);

    res.json({
      channelName,
      isValid: validation.isValid,
      errors: validation.errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const channels = await db.Channel.findAll({
      where: { WorkspaceId: workspaceId },
      include: [
        {
          model: db.User,
          attributes: ['id', 'displayName', 'slackUserId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:channelId/archive', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const channel = await db.Channel.findByPk(channelId, {
      include: [db.Workspace]
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const slackService = new SlackService(channel.Workspace.accessToken);
    await slackService.archiveChannel(channel.slackChannelId);

    await channel.update({ isArchived: true });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;