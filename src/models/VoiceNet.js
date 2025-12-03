import { DataTypes } from 'sequelize';
import sequelize from '../api/db.js';

const VoiceNet = sequelize.define('VoiceNet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING
  },
  linked_squad_id: {
    type: DataTypes.UUID,
    references: {
      model: 'Squads',
      key: 'id'
    }
  }
});

export default VoiceNet;