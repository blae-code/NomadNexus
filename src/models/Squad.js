import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const Squad = sequelize.define('Squad', {
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
  }
});

export default Squad;