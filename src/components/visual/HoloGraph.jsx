import React from 'react';
import ReactFlow, { Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const HoloGraph = (props) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        {...props}
        proOptions={{ hideAttribution: true }}
        edgesFocusable={false}
        edgesUpdatable={false}
        nodesDraggable={props.onNodeDragStop !== undefined}
        nodesConnectable={false}
        selectionOnDrag
        edgeTypes={props.edgeTypes}
      >
        <Background variant="dots" gap={12} size={1} style={{ backgroundColor: '#0a0a0a' }} color="#444" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default HoloGraph;
