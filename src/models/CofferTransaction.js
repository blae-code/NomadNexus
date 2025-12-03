import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const CofferTransaction = sequelize.define('CofferTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  coffer_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Coffers',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.INTEGER
  },
  type: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

export default CofferTransaction;