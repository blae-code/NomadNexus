import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const PlayerStatus = sequelize.define('PlayerStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  health: {
    type: DataTypes.STRING
  },
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Events',
      key: 'id'
    }
  }
});

export default PlayerStatus;