import React from 'react';
import { Handle, Position } from '@xyflow/react';

const TacticalNode = ({ data, className }) => {
  const statusColor = data.status === 'active' ? '#ff4500' : '#888';

  return (
    <div className={className} style={{
      backgroundColor: '#2d3748', // gunmetal
      border: '1px solid #ff4500', // burnt orange
      borderRadius: '0px',
      padding: '10px',
      display: 'flex',
      alignItems: 'center',
      minWidth: '150px'
    }}>
      <div style={{
        width: '10px',
        height: '10px',
        backgroundColor: statusColor,
        borderRadius: '50%',
        marginRight: '10px',
        boxShadow: `0 0 5px ${statusColor}`,
      }}></div>
      <div>
        <div style={{ color: 'white', fontWeight: 'bold' }}>{data.label}</div>
        {data.sublabel && <div style={{ color: '#aaa', fontSize: '0.8em' }}>{data.sublabel}</div>}
      </div>
      <Handle type="target" position={Position.Top} style={{ borderRadius: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ borderRadius: 0 }} />
    </div>
  );
};

export default TacticalNode;
