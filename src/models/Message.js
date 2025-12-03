import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  channel_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Channels',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

export default Message;