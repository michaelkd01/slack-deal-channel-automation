// Use memory storage in serverless environment
if (process.env.USE_MEMORY_STORAGE === 'true') {
  console.log('Using in-memory storage for serverless deployment');
  module.exports = require('./memory');
} else {
  const { Sequelize } = require('sequelize');

  const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./slack_deals.db', {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase.co') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });

  const db = {};

  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  db.Workspace = require('./Workspace')(sequelize, Sequelize);
  db.Channel = require('./Channel')(sequelize, Sequelize);
  db.User = require('./User')(sequelize, Sequelize);
  db.Template = require('./Template')(sequelize, Sequelize);
  db.Configuration = require('./Configuration')(sequelize, Sequelize);

  db.Workspace.hasMany(db.Channel);
  db.Channel.belongsTo(db.Workspace);

  db.Workspace.hasMany(db.User);
  db.User.belongsTo(db.Workspace);

  db.Workspace.hasMany(db.Template);
  db.Template.belongsTo(db.Workspace);

  db.Channel.belongsToMany(db.User, { through: 'ChannelUsers' });
  db.User.belongsToMany(db.Channel, { through: 'ChannelUsers' });

  module.exports = db;
}