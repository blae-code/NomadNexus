import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const ArmoryItem = sequelize.define('ArmoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  }
});

export default ArmoryItem;