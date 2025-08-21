// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');

// Use in-memory storage for serverless
process.env.USE_MEMORY_STORAGE = 'true';

// Import routes
const slackRoutes = require('../src/routes/slack');
const channelRoutes = require('../src/routes/channels');
const configRoutes = require('../src/routes/config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for Vercel
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.APP_URL && process.env.APP_URL.startsWith('https'),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use('/api/slack', slackRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/config', configRoutes);

// Root route - simple frontend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Slack Deal Automation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
            .button:hover { background: #45a049; }
            .api-link { background: #2196F3; }
            .api-link:hover { background: #0b7dda; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Slack Deal Automation</h1>
            <p>Automate the creation and management of Slack channels for deal discussions with consistent naming conventions, automatic team member additions, and Salesforce integration capabilities.</p>
            
            <h3>Getting Started</h3>
            <p>Click the button below to set up your Slack workspace integration:</p>
            <a href="/api/slack/install" class="button">Install to Slack</a>
            
            <h3>API Health Check</h3>
            <a href="/api/health" class="button api-link">Check API Status</a>
            
            <h3>Features</h3>
            <ul>
                <li>Automated Channel Creation with consistent naming</li>
                <li>Team Management - automatically add default team members</li>
                <li>Deal Templates with customizable first messages</li>
                <li>Salesforce Integration ready</li>
                <li>Web Interface for manual channel creation</li>
            </ul>
            
            <p><em>Note: This is a simplified interface. The full React frontend is available for local development.</em></p>
        </div>
    </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check connected workspaces
app.get('/api/debug/workspaces', async (req, res) => {
  try {
    const db = require('../src/models');
    const workspaces = await db.Workspace.findAll();
    res.json({ workspaces: workspaces.map(w => ({ id: w.id, name: w.slackTeamName, teamId: w.slackTeamId })) });
  } catch (error) {
    res.json({ error: error.message, workspaces: [] });
  }
});

// For Vercel, we need to export the app, not listen
module.exports = app;