import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const FleetAsset = sequelize.define('FleetAsset', {
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
  },
  owner_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

export default FleetAsset;