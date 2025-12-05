import { getStepPath } from '@xyflow/react';
 
export default function DataStreamEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) {
  const [edgePath] = getStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = data?.type === 'command' ? 'var(--burnt-orange)' : 
                    data?.type === 'squad' ? '#00ff41' :
                    '#ff0000';
 
  return (
    <>
      <path
        id={id}
        style={{ ...style, stroke: edgeColor }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <circle r="4" fill={edgeColor} >
        <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
        />
      </circle>
    </>
  );
}
