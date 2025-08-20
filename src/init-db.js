require('dotenv').config();
const db = require('./models');

async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('Syncing database models...');
    await db.sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synced successfully.');

    console.log('Creating default workspace...');
    let workspace = await db.Workspace.findOne();
    if (!workspace) {
      workspace = await db.Workspace.create({
        name: 'Default Workspace',
        slackTeamId: null,
        settings: {
          defaultChannelPrefix: 'deal-',
          autoArchiveDays: 30
        }
      });
      console.log('✅ Default workspace created.');
    } else {
      console.log('ℹ️  Workspace already exists, using existing one.');
    }

    console.log('Creating default configuration...');
    const existingConfig = await db.Configuration.findOne();
    if (!existingConfig) {
      await db.Configuration.create({
        workspaceId: workspace.id,
        key: 'channel_naming_pattern',
        value: '{company}-{deal_type}-{date}',
        description: 'Default pattern for channel naming'
      });
      console.log('✅ Default configuration created.');
    } else {
      console.log('ℹ️  Configuration already exists, skipping creation.');
    }

    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();