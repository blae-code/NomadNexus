import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  start_time: {
    type: DataTypes.DATE
  },
  end_time: {
    type: DataTypes.DATE
  },
  type: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

export default Event;