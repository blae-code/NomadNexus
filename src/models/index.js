import User from './User.js';
import Event from './Event.js';
import Squad from './Squad.js';
import SquadMember from './SquadMember.js';
import PlayerStatus from './PlayerStatus.js';
import Channel from './Channel.js';
import Message from './Message.js';
import VoiceNet from './VoiceNet.js';
import Coffer from './Coffer.js';
import CofferTransaction from './CofferTransaction.js';
import AIAgent from './AIAgent.js';
import AIAgentLog from './AIAgentLog.js';
import AIAgentRule from './AIAgentRule.js';
import ArmoryItem from './ArmoryItem.js';
import Role from './Role.js';
import FleetAsset from './FleetAsset.js';
import Mission from './Mission.js';
import sequelize from '../api/db.js';

// User associations
User.hasMany(Event, { foreignKey: 'created_by' });
Event.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(SquadMember, { foreignKey: 'user_id' });
SquadMember.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PlayerStatus, { foreignKey: 'user_id' });
PlayerStatus.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Message, { foreignKey: 'created_by' });
Message.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(CofferTransaction, { foreignKey: 'created_by' });
CofferTransaction.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(FleetAsset, { foreignKey: 'owner_id' });
FleetAsset.belongsTo(User, { foreignKey: 'owner_id' });

User.hasMany(Mission, { foreignKey: 'assigned_to' });
Mission.belongsTo(User, { foreignKey: 'assigned_to' });

// Event associations
Event.hasMany(PlayerStatus, { foreignKey: 'event_id' });
PlayerStatus.belongsTo(Event, { foreignKey: 'event_id' });

Event.hasMany(AIAgentLog, { foreignKey: 'event_id' });
AIAgentLog.belongsTo(Event, { foreignKey: 'event_id' });

// Squad associations
Squad.hasMany(SquadMember, { foreignKey: 'squad_id' });
SquadMember.belongsTo(Squad, { foreignKey: 'squad_id' });

Squad.hasOne(VoiceNet, { foreignKey: 'linked_squad_id' });
VoiceNet.belongsTo(Squad, { foreignKey: 'linked_squad_id' });

// Channel associations
Channel.hasMany(Message, { foreignKey: 'channel_id' });
Message.belongsTo(Channel, { foreignKey: 'channel_id' });

// Coffer associations
Coffer.hasMany(CofferTransaction, { foreignKey: 'coffer_id' });
CofferTransaction.belongsTo(Coffer, { foreignKey: 'coffer_id' });

const models = {
  User,
  Event,
  Squad,
  SquadMember,
  PlayerStatus,
  Channel,
  Message,
  VoiceNet,
  Coffer,
  CofferTransaction,
  AIAgent,
  AIAgentLog,
  AIAgentRule,
  ArmoryItem,
  Role,
  FleetAsset,
  Mission
};

export { sequelize };
export default models;
