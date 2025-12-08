import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const HoloGraph = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  edgeTypes,
  onNodeDragStop,
  onNodeContextMenu,
  onPaneClick,
  fitView,
  panOnDrag,
  zoomOnScroll,
  panOnScroll,
  children
}) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        fitView={fitView}
        panOnDrag={panOnDrag}
        zoomOnScroll={zoomOnScroll}
        panOnScroll={panOnScroll}
        proOptions={{ hideAttribution: true }}
        edgesFocusable={false}
        nodesDraggable={onNodeDragStop !== undefined}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Background variant="dots" gap={12} size={1} style={{ backgroundColor: '#0a0a0a' }} color="#444" />
        <Controls showInteractive={false} />
        {children}
      </ReactFlow>
    </div>
  );
};

export default HoloGraph;
