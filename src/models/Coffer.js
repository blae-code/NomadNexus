import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const Coffer = sequelize.define('Coffer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  type: {
    type: DataTypes.STRING
  }
});

export default Coffer;