import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  callsign: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  rank: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export default User;