import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const Mission = sequelize.define('Mission', {
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
  status: {
    type: DataTypes.STRING
  },
  objectives: {
    type: DataTypes.JSON
  },
  assigned_to: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

export default Mission;