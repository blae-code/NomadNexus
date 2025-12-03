import React from 'react';

const RoomCard = ({ room }) => {
  // Placeholder for user role and allowed roles
  const userRole = 'user';
  const allowedRoles = room.allowedRoles || ['admin', 'user'];

  const isAllowed = allowedRoles.includes(userRole);
  const count = room.count || 0;

  return (
    <div
      className={`
        relative border border-burnt-orange p-4 
        ${isAllowed ? 'hover:bg-burnt-orange/10 hover:cursor-pointer hover:shadow-[0_0_15px_rgba(204,85,0,0.5)]' : 'opacity-50 grayscale cursor-not-allowed'}
      `}
    >
      <div className="absolute top-2 right-2 flex items-center">
        <span className={count > 0 ? 'text-indicator-green' : 'text-tech-white/50'}>
          {count > 0 ? '■' : '□'}
        </span>
        <span className="ml-1 text-tech-white/80 text-sm">
          {count.toString().padStart(2, '0')}
        </span>
      </div>
      <div>
        <h3 className="text-tech-white">{room.name}</h3>
        <p className="text-tech-white/50">{isAllowed ? room.status : '🔒 ENC'}</p>
      </div>
    </div>
  );
};

export default RoomCard;
