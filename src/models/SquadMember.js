import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const SquadMember = sequelize.define('SquadMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  squad_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Squads',
      key: 'id'
    }
  }
});

export default SquadMember;