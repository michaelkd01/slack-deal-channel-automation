const { WebClient } = require('@slack/web-api');
const db = require('../models');

class SlackService {
  constructor(accessToken) {
    this.client = new WebClient(accessToken);
  }

  static async getClientForWorkspace(workspaceId) {
    const workspace = await db.Workspace.findByPk(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return new SlackService(workspace.accessToken);
  }

  async createChannel(name, isPrivate = false) {
    try {
      const result = await this.client.conversations.create({
        name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        is_private: isPrivate
      });
      return result.channel;
    } catch (error) {
      if (error.data && error.data.error === 'name_taken') {
        const listResult = await this.client.conversations.list({
          exclude_archived: true
        });
        const existingChannel = listResult.channels.find(
          c => c.name === name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        );
        if (existingChannel) {
          return existingChannel;
        }
      }
      throw error;
    }
  }

  async inviteUsersToChannel(channelId, userIds) {
    try {
      const result = await this.client.conversations.invite({
        channel: channelId,
        users: userIds.join(',')
      });
      return result;
    } catch (error) {
      if (error.data && error.data.error === 'already_in_channel') {
        return { ok: true, already_in_channel: true };
      }
      throw error;
    }
  }

  async postMessage(channelId, text, blocks = null) {
    const message = {
      channel: channelId,
      text: text
    };
    
    if (blocks) {
      message.blocks = blocks;
    }

    const result = await this.client.chat.postMessage(message);
    return result;
  }

  async setChannelTopic(channelId, topic) {
    try {
      const result = await this.client.conversations.setTopic({
        channel: channelId,
        topic: topic
      });
      return result;
    } catch (error) {
      console.error('Error setting channel topic:', error);
      return null;
    }
  }

  async setChannelPurpose(channelId, purpose) {
    try {
      const result = await this.client.conversations.setPurpose({
        channel: channelId,
        purpose: purpose
      });
      return result;
    } catch (error) {
      console.error('Error setting channel purpose:', error);
      return null;
    }
  }

  async getUsers() {
    const result = await this.client.users.list({
      exclude_archived: true,
      exclude_guests: true
    });
    return result.members.filter(user => !user.is_bot && user.id !== 'USLACKBOT');
  }

  async getUserInfo(userId) {
    const result = await this.client.users.info({
      user: userId
    });
    return result.user;
  }

  async archiveChannel(channelId) {
    const result = await this.client.conversations.archive({
      channel: channelId
    });
    return result;
  }

  async getChannelInfo(channelId) {
    const result = await this.client.conversations.info({
      channel: channelId
    });
    return result.channel;
  }

  async listChannels(excludeArchived = true) {
    const result = await this.client.conversations.list({
      exclude_archived: excludeArchived,
      types: 'public_channel,private_channel'
    });
    return result.channels;
  }
}

module.exports = SlackService;