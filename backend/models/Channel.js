module.exports = (sequelize, DataTypes) => {
  const Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slackChannelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slackChannelName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dealId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dealName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dealValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    dealOwner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dealStage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    salesforceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return Channel;
};