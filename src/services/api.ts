import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export interface Workspace {
  id: string;
  slackTeamName: string;
  slackTeamId: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  slackChannelId: string;
  slackChannelName: string;
  dealName: string;
  clientName: string;
  dealValue?: number;
  dealOwner?: string;
  dealStage?: string;
  createdAt: string;
  isArchived: boolean;
  webUrl?: string;
}

export interface User {
  id: string;
  slackUserId: string;
  displayName: string;
  email?: string;
  isDefaultMember: boolean;
  role: 'admin' | 'member';
}

export interface Template {
  id?: string;
  name: string;
  template: string;
  type: 'naming' | 'message';
  variables: string[];
  isDefault: boolean;
  description?: string;
}

export interface CreateChannelData {
  workspaceId: string;
  clientName: string;
  dealName: string;
  dealValue?: number;
  dealOwner?: string;
  dealStage?: string;
  dealId?: string;
  salesforceId?: string;
  templateId?: string;
  customChannelName?: string;
  userIds?: string[];
  firstMessage?: string;
  metadata?: Record<string, any>;
}

export const slackApi = {
  getWorkspaces: () => api.get<Workspace[]>('/slack/workspaces'),
  installSlack: () => {
    window.location.href = `${API_BASE_URL}/slack/install?ngrok-skip-browser-warning=true`;
  },
};

export const channelApi = {
  createChannel: (data: CreateChannelData) => 
    api.post<{ success: boolean; channel: Channel }>('/channels/create', data),
  
  getChannels: (workspaceId: string) => 
    api.get<Channel[]>('/channels', { params: { workspaceId } }),
  
  archiveChannel: (channelId: string) => 
    api.post(`/channels/${channelId}/archive`),
  
  getNamingTemplates: (workspaceId?: string) => 
    api.get<Template[]>('/channels/templates/naming', { params: { workspaceId } }),
  
  createNamingTemplate: (data: Template & { workspaceId: string }) => 
    api.post<Template>('/channels/templates/naming', data),
  
  previewChannelName: (template: string, variables: Record<string, string>) => 
    api.get<{ channelName: string; isValid: boolean; errors: string[] }>(
      '/channels/preview-name',
      { params: { template, ...variables } }
    ),
};

export const configApi = {
  getUsers: (workspaceId: string, sync = false) => 
    api.get<User[]>(`/config/users/${workspaceId}`, { params: { sync } }),
  
  updateUserDefault: (userId: string, isDefault: boolean) => 
    api.put<User>(`/config/users/${userId}/default`, { isDefault }),
  
  bulkUpdateUserDefaults: (workspaceId: string, userIds: string[], isDefault: boolean) => 
    api.post<User[]>('/config/users/bulk-default', { workspaceId, userIds, isDefault }),
  
  getDefaultUsers: (workspaceId: string) => 
    api.get<User[]>(`/config/default-users/${workspaceId}`),
  
  getMessageTemplates: (workspaceId: string) => 
    api.get<Template[]>(`/config/templates/message/${workspaceId}`),
  
  createMessageTemplate: (data: Template & { workspaceId: string }) => 
    api.post<Template>('/config/templates/message', data),
  
  getSettings: (workspaceId: string) => 
    api.get<Record<string, any>>(`/config/settings/${workspaceId}`),
  
  updateSettings: (workspaceId: string, settings: Record<string, any>) => 
    api.put(`/config/settings/${workspaceId}`, settings),
};

export default api;