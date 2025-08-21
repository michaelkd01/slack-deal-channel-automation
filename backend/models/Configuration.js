module.exports = (sequelize, DataTypes) => {
  const Configuration = sequelize.define('Configuration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Workspaces',
        key: 'id'
      }
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  Configuration.associate = function(models) {
    Configuration.belongsTo(models.Workspace);
  };

  return Configuration;
};