# Slack Deal Channel Automation Tool

Automate the creation and management of Slack channels for deal discussions with consistent naming conventions, automatic team member additions, and Salesforce integration capabilities.

## Features

- **Automated Channel Creation**: Create Slack channels with consistent naming conventions
- **Team Management**: Automatically add default team members to all new channels
- **Deal Templates**: Customizable first message templates with deal information
- **Naming Conventions**: Flexible naming templates with variables (client, date, stage, etc.)
- **Salesforce Integration**: API endpoints ready for Salesforce webhook integration
- **Web Interface**: User-friendly React dashboard for manual channel creation
- **Bulk Operations**: Create multiple channels efficiently
- **Channel Management**: View, filter, and archive channels from the dashboard

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React, TypeScript, Material-UI
- **Database**: PostgreSQL with Sequelize ORM
- **APIs**: Slack Web API, OAuth 2.0
- **Authentication**: Slack OAuth

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL database
- Slack workspace with admin permissions
- Slack app credentials

## Installation

### 1. Clone and Install Dependencies

```bash
cd slack-deal-automation
npm install

cd frontend
npm install
cd ..
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE slack_deals;
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Slack App Credentials
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/slack_deals

# Server Configuration
PORT=3000
SESSION_SECRET=generate_a_random_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001
```

### 4. Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app "From scratch"
3. Name it "Deal Channel Automation"
4. Add OAuth Redirect URL: `http://localhost:3000/api/slack/oauth_redirect`
5. Add Bot Token Scopes:
   - `channels:manage`
   - `channels:read`
   - `chat:write`
   - `users:read`
   - `groups:write`
   - `groups:read`
   - `im:write`
   - `mpim:write`

6. Copy the Client ID, Client Secret, and Signing Secret to your `.env` file

## Running the Application

### Development Mode

Start the backend server:
```bash
npm run dev
```

In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001

### Production Mode

Build the frontend:
```bash
cd frontend
npm run build
```

Start the server:
```bash
npm start
```

## Usage Guide

### Initial Setup

1. Navigate to http://localhost:3001
2. Go to "Setup" in the sidebar
3. Follow the setup wizard to connect your Slack workspace
4. Click "Install to Slack" to authorize the app

### Configuring Settings

1. Go to "Settings" page
2. **Users Tab**: 
   - Click "Sync Users" to import Slack users
   - Toggle switches to set default team members
3. **Naming Templates Tab**:
   - Create custom naming patterns using variables
   - Example: `deal-{client_short}-{date}`
4. **Message Templates Tab**:
   - Create first message templates
   - Use variables like `{client}`, `{deal}`, `{value}`

### Creating Channels

1. Go to "Create Channel" page
2. Select your workspace
3. Fill in deal information:
   - Client Name (required)
   - Deal Name (required)
   - Deal Value
   - Deal Owner
   - Deal Stage
4. Preview the channel name
5. Select additional team members
6. Click "Create Channel"

The channel will be created with:
- Consistent naming based on your template
- All default team members added
- First message posted with deal details

### Managing Channels

- View all channels in the "Channels" page
- Filter by stage, search by name/client
- Archive completed deals
- Click the external link icon to open in Slack

## API Endpoints

### Channel Management
- `POST /api/channels/create` - Create a new channel
- `GET /api/channels` - List all channels
- `POST /api/channels/:id/archive` - Archive a channel

### Configuration
- `GET /api/config/users/:workspaceId` - Get users
- `PUT /api/config/users/:userId/default` - Set default user
- `GET /api/config/templates/message/:workspaceId` - Get message templates

### Slack Integration
- `GET /api/slack/install` - Start OAuth flow
- `GET /api/slack/oauth_redirect` - OAuth callback
- `GET /api/slack/workspaces` - List connected workspaces

## Salesforce Integration

The tool provides API endpoints ready for Salesforce integration:

### Setup in Salesforce

1. Create a Lightning Component or Button on the Case object
2. Configure it to call: `POST /api/channels/create`
3. Map Salesforce fields to the API payload:

```json
{
  "workspaceId": "your-workspace-id",
  "clientName": "{!Case.Account.Name}",
  "dealName": "{!Case.Subject}",
  "dealValue": "{!Case.Amount__c}",
  "dealOwner": "{!Case.Owner.Name}",
  "dealStage": "{!Case.Status}",
  "salesforceId": "{!Case.Id}"
}
```

## Deployment

### Heroku Deployment

1. Create a Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy:

```bash
git init
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Docker Deployment

Build and run with Docker:

```bash
docker build -t slack-deal-automation .
docker run -p 3000:3000 --env-file .env slack-deal-automation
```

## Security Considerations

- Store all credentials in environment variables
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Regular security audits of dependencies
- Rotate Slack tokens periodically

## Troubleshooting

### Common Issues

1. **OAuth Error**: Check redirect URL matches exactly
2. **Database Connection**: Verify PostgreSQL is running and credentials are correct
3. **Missing Scopes**: Ensure all required bot token scopes are added
4. **CORS Issues**: Verify FRONTEND_URL in .env matches your frontend address

## License

MIT

## Support

For issues or questions, please create an issue in the repository.