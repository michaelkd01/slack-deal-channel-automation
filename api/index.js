// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');

// Use in-memory storage for serverless
process.env.USE_MEMORY_STORAGE = 'true';

// Import routes
const slackRoutes = require('../backend/routes/slack');
const channelRoutes = require('../backend/routes/channels');
const configRoutes = require('../backend/routes/config');

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

// Simple frontend for production
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
            .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; }
            .button:hover { background: #45a049; }
            .api-button { background: #2196F3; }
            .api-button:hover { background: #0b7dda; }
            .debug-button { background: #FF9800; }
            .debug-button:hover { background: #f57c00; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Slack Deal Automation</h1>
            <p>Production-ready tool for automated Slack channel creation with consistent naming, team management, and Salesforce integration.</p>
            
            <h3>Setup</h3>
            <a href="/api/slack/install" class="button">Install to Slack</a>
            
            <h3>API Endpoints</h3>
            <a href="/api/health" class="button api-button">Health Check</a>
            <a href="/api/debug/workspaces" class="button debug-button">View Workspaces</a>
            <a href="/api/slack/workspaces" class="button api-button">API Workspaces</a>
            
            <h3>Features</h3>
            <ul>
                <li>✅ Automated Channel Creation with consistent naming</li>
                <li>✅ Team Management - automatically add default team members</li>
                <li>✅ Deal Templates with customizable first messages</li>
                <li>✅ Salesforce Integration ready</li>
                <li>✅ OAuth-secured workspace connection</li>
            </ul>
            
            <h3>Development</h3>
            <p>For the full React frontend, run locally: <code>npm start</code> in the frontend directory.</p>
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
    const db = require('../backend/models');
    const workspaces = await db.Workspace.findAll();
    res.json({ workspaces: workspaces.map(w => ({ id: w.id, name: w.slackTeamName, teamId: w.slackTeamId })) });
  } catch (error) {
    res.json({ error: error.message, workspaces: [] });
  }
});

// For Vercel, we need to export the app, not listen
module.exports = app;