import React from 'react';
import RoomCard from './RoomCard';

const rooms = [
  { id: 1, name: 'Command', status: 'READY', allowedRoles: ['admin'], count: 1 },
  { id: 2, name: 'Squad A', status: 'READY', allowedRoles: ['admin', 'user'], count: 12 },
  { id: 3, name: 'Squad B', status: 'READY', allowedRoles: ['admin', 'user'], count: 0 },
  { id: 4, name: 'Open Channel', status: 'READY', allowedRoles: ['admin', 'user', 'guest'], count: 5 },
];

const RoomGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
};

export default RoomGrid;
