// In-memory storage for serverless environment
const storage = {
  workspaces: new Map(),
  channels: new Map(),
  users: new Map(),
  templates: new Map(),
  configurations: new Map()
};

// Mock Sequelize-like interface
const createModel = (name, storageKey) => {
  return {
    findOne: async (options) => {
      const items = Array.from(storage[storageKey].values());
      return items.find(item => {
        if (options.where) {
          return Object.keys(options.where).every(key => item[key] === options.where[key]);
        }
        return false;
      });
    },
    
    findAll: async (options = {}) => {
      const items = Array.from(storage[storageKey].values());
      if (options.where) {
        return items.filter(item => {
          return Object.keys(options.where).every(key => item[key] === options.where[key]);
        });
      }
      return items;
    },
    
    create: async (data) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      storage[storageKey].set(id, item);
      
      // Mock update method
      item.update = async (updateData) => {
        Object.assign(item, updateData, { updatedAt: new Date() });
        return item;
      };
      
      return item;
    },
    
    destroy: async (options) => {
      if (options.where) {
        const items = Array.from(storage[storageKey].entries());
        items.forEach(([id, item]) => {
          const matches = Object.keys(options.where).every(key => item[key] === options.where[key]);
          if (matches) {
            storage[storageKey].delete(id);
          }
        });
      }
    }
  };
};

module.exports = {
  Workspace: createModel('Workspace', 'workspaces'),
  Channel: createModel('Channel', 'channels'),
  User: createModel('User', 'users'),
  Template: createModel('Template', 'templates'),
  Configuration: createModel('Configuration', 'configurations'),
  
  // Mock sequelize object
  sequelize: {
    authenticate: async () => {
      console.log('Using in-memory storage for serverless environment');
      return Promise.resolve();
    }
  }
};