import React, { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { supabase } from '@/lib/supabase';
import HoloGraph from './HoloGraph';
import TacticalNode from './TacticalNode';
import DataStreamEdge from './DataStreamEdge';
import dagre from 'dagre';
import { toast } from 'sonner';

const nodeTypes = {
  tactical: TacticalNode,
};

const edgeTypes = {
  dataStream: DataStreamEdge,
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const nodeWidth = 172;
  const nodeHeight = 36;

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};


const FleetHierarchy = () => {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw new Error('Failed to fetch profiles');
      return data;
    },
  });

  const { data: squads = [], isLoading: isLoadingSquads } = useQuery({
    queryKey: ['squads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('squads').select('*');
      if (error) {
        console.warn('Failed to fetch squads:', error);
        return [];
      }
      return data || [];
    },
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw new Error('Failed to fetch roles');
      return data;
    },
  });

  const { data: playerStatus = [], isLoading: isLoadingPlayerStatus } = useQuery({
    queryKey: ['player_status'],
    queryFn: async () => {
      const { data, error } = await supabase.from('player_status').select('*');
      if (error) {
        console.warn('Failed to fetch player status:', error);
        return [];
      }
      return data || [];
    },
  });
  
  const updatePlayerSquadMutation = useMutation({
    mutationFn: async ({ userId, squadId }) => {
        const { error } = await supabase
            .from('player_status')
            .update({ assigned_squad_id: squadId })
            .eq('user_id', userId);
        if (error) throw new Error('Failed to update player squad');
    },
    onSuccess: () => {
        toast.success("Squad assignment updated.");
        queryClient.invalidateQueries(['player_status']);
    },
    onError: () => {
        toast.error("Failed to update squad assignment.");
    }
  });

  const { initialNodes, initialEdges } = useMemo(() => {
    if (isLoadingProfiles || isLoadingSquads || isLoadingPlayerStatus || isLoadingRoles) {
      return { initialNodes: [], initialEdges: [] };
    }
    
    const commanderRole = roles.find(r => r.name === 'Commander' || r.name === 'Tactical Command');
    const commander = profiles.find(p => p.role === commanderRole?.id) || profiles[0];
    
    const constructedNodes = [];
    const constructedEdges = [];

    if (commander) {
      constructedNodes.push({
        id: commander.id,
        type: 'tactical',
        data: { label: commander.callsign || 'Commander', sublabel: 'COMMAND', status: 'active', type: 'commander' },
        draggable: false,
      });
    }

    squads.forEach((squad) => {
      if (squad.leader) {
        constructedNodes.push({
          id: squad.id,
          type: 'tactical',
          data: { label: squad.name, sublabel: `Leader: ${squad.leader.callsign}`, status: 'active', type: 'squad' },
        });

        if (commander) {
            constructedEdges.push({ id: `e-${commander.id}-${squad.id}`, source: commander.id, target: squad.id, type: 'dataStream', data: { type: 'command' } });
        }
      }
    });

    playerStatus.forEach((ps) => {
        if (ps.profile && ps.assigned_squad_id) {
            const squad = squads.find(s => s.id === ps.assigned_squad_id);
            if (squad) {
                constructedNodes.push({
                    id: ps.profile.id,
                    type: 'tactical',
                    data: { label: ps.profile.callsign, sublabel: 'Member', status: 'active', type: 'member' },
                    draggable: true,
                });
                constructedEdges.push({ id: `e-${squad.id}-${ps.profile.id}`, source: squad.id, target: ps.profile.id, type: 'dataStream', data: { type: 'squad' } });
            }
        }
    });

    return { initialNodes: constructedNodes, initialEdges: constructedEdges };
  }, [profiles, squads, roles, playerStatus, isLoadingProfiles, isLoadingSquads, isLoadingRoles, isLoadingPlayerStatus]);

  useEffect(() => {
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  const onNodeDragStop = useCallback((event, node) => {
    const targetSquadNode = nodes.find(n => 
        node.position.x > n.position.x && node.position.x < n.position.x + n.width &&
        node.position.y > n.position.y && node.position.y < n.position.y + n.height &&
        n.data.type === 'squad'
    );

    if (targetSquadNode && node.data.type === 'member') {
        const currentSquad = playerStatus.find(p => p.user_id === node.id)?.assigned_squad_id;
        if (currentSquad !== targetSquadNode.id) {
            updatePlayerSquadMutation.mutate({ userId: node.id, squadId: targetSquadNode.id }, {
              onSuccess: () => {
                setNodes((nds) => 
                  nds.map(n => {
                    if (n.id === targetSquadNode.id) {
                      return {
                        ...n,
                        className: 'snap'
                      }
                    }
                    return n;
                  })
                );
                setTimeout(() => {
                  setNodes((nds) => 
                    nds.map(n => {
                      if (n.id === targetSquadNode.id) {
                        return {
                          ...n,
                          className: ''
                        }
                      }
                      return n;
                    })
                  );
                }, 500);
              }
            });
        }
    }
  }, [nodes, playerStatus, updatePlayerSquadMutation, setNodes]);

  const onConnect = useCallback((params) => {
    // do nothing, disable new connections
  }, []);


  if (isLoadingProfiles || isLoadingSquads || isLoadingPlayerStatus) {
    return <div className="text-center p-8">LOADING HIERARCHY DATA...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 50px)' }}>
      <HoloGraph
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
      </HoloGraph>
    </div>
  );
};

export default FleetHierarchy;