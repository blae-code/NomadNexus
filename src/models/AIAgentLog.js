import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const AIAgentLog = sequelize.define('AIAgentLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  agent_slug: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT
  },
  data: {
    type: DataTypes.JSON
  }
});

export default AIAgentLog;