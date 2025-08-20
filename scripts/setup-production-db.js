require('dotenv').config();
const { Sequelize } = require('sequelize');

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET', 
  'SLACK_SIGNING_SECRET'
];

const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// Initialize database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Import models
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Workspace = require('../src/models/Workspace')(sequelize, Sequelize);
db.Channel = require('../src/models/Channel')(sequelize, Sequelize);
db.User = require('../src/models/User')(sequelize, Sequelize);
db.Template = require('../src/models/Template')(sequelize, Sequelize);
db.Configuration = require('../src/models/Configuration')(sequelize, Sequelize);

// Set up associations
db.Workspace.hasMany(db.Channel);
db.Channel.belongsTo(db.Workspace);

db.Workspace.hasMany(db.User);
db.User.belongsTo(db.Workspace);

db.Workspace.hasMany(db.Template);
db.Template.belongsTo(db.Workspace);

db.Channel.belongsToMany(db.User, { through: 'ChannelUsers' });
db.User.belongsToMany(db.Channel, { through: 'ChannelUsers' });

async function setupProductionDatabase() {
  try {
    console.log('🔗 Connecting to Supabase database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('📋 Creating database tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created successfully.');

    console.log('🏢 Creating default workspace...');
    let workspace = await db.Workspace.findOne();
    if (!workspace) {
      workspace = await db.Workspace.create({
        slackTeamName: 'Default Workspace',
        settings: {
          defaultChannelPrefix: 'deal-',
          autoArchiveDays: 30
        }
      });
      console.log('✅ Default workspace created.');
    } else {
      console.log('ℹ️  Workspace already exists, using existing one.');
    }

    console.log('⚙️  Creating default configuration...');
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

    console.log('🎉 Production database setup completed successfully!');
    console.log('📊 Database URL:', process.env.DATABASE_URL.split('@')[1] || 'Connected');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Production database setup failed:', error.message);
    console.error('💡 Make sure your DATABASE_URL includes the correct password');
    process.exit(1);
  }
}

setupProductionDatabase();