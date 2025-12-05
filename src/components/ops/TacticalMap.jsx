import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { supabase } from '@/lib/supabase';
import HoloGraph from '@/components/visual/HoloGraph';
import MapNode from '@/components/visual/MapNode';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/ContextMenu";

const nodeTypes = {
  mapNode: MapNode,
};

const TacticalMap = () => {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);

  const { data: fleetAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fleet_assets').select('*');
      if (error) throw new Error('Failed to fetch fleet assets');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: squads = [], isLoading: isLoadingSquads } = useQuery({
    queryKey: ['tactical-squads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('squads').select(`*, leader:profiles!squads_leader_id_fkey(*)`);
      if (error) throw new Error('Failed to fetch squads');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: distressSignals = [], isLoading: isLoadingDistress } = useQuery({
    queryKey: ['tactical-distress'],
    queryFn: async () => {
        const { data, error } = await supabase.from('player_status').select(`*, profile:profiles(*)`).eq('status', 'DISTRESS');
        if (error) throw new Error('Failed to fetch distress signals');
        return data;
    },
    refetchInterval: 2000,
  });

  const sectors = [
    { id: 'S-01', name: 'Stanton', x: 800, y: 400, status: 'active' },
    { id: 'S-02', name: 'Pyro', x: 1400, y: 800, status: 'danger' },
    { id: 'S-03', name: 'Terra', x: 200, y: 700, status: 'secure' },
  ];

  const updateAssetCoordinatesMutation = useMutation({
    mutationFn: async ({ assetId, coordinates }) => {
        const { error } = await supabase
            .from('fleet_assets')
            .update({ coordinates })
            .eq('id', assetId);
        if (error) throw new Error('Failed to update asset coordinates');
    },
    onSuccess: () => {
        toast.success("Asset position updated.");
        queryClient.invalidateQueries(['fleet_assets']);
    },
    onError: () => {
        toast.error("Failed to update asset position.");
    }
  });

  useMemo(() => {
    if (isLoadingAssets || isLoadingSquads || isLoadingDistress) return;

    const assetNodes = fleetAssets.map(asset => ({
      id: asset.id,
      type: 'mapNode',
      position: { x: asset.coordinates?.x || 500, y: asset.coordinates?.y || 300 },
      data: { type: 'asset', label: asset.name, sublabel: asset.type, status: asset.status },
      draggable: true,
    }));

    const squadNodes = squads.map((squad, index) => ({
        id: squad.id,
        type: 'mapNode',
        position: { x: 400 + (index * 200), y: 200 + (index % 2 * 100) },
        data: { type: 'squad', label: squad.name, sublabel: `Leader: ${squad.leader?.callsign}` },
        draggable: false,
    }));

    const distressNodes = distressSignals.map((signal, index) => ({
        id: signal.id,
        type: 'mapNode',
        position: { x: 1000, y: 150 + (index * 100) },
        data: { type: 'distress_signal', label: 'DISTRESS', sublabel: signal.profile?.callsign },
        draggable: false,
    }));

    const sectorNodes = sectors.map(sector => ({
        id: sector.id,
        type: 'mapNode',
        position: { x: sector.x, y: sector.y },
        data: { type: 'sector', label: sector.id, sublabel: sector.name },
        draggable: false,
    }));

    setNodes([...assetNodes, ...squadNodes, ...distressNodes, ...sectorNodes]);
  }, [fleetAssets, squads, distressSignals, isLoadingAssets, isLoadingSquads, isLoadingDistress, setNodes]);

  const onNodeDragStop = (event, node) => {
    if (node.data.type === 'asset') {
        const coordinates = { x: node.position.x, y: node.position.y };
        updateAssetCoordinatesMutation.mutate({ assetId: node.id, coordinates });
    }
  };
  
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      if (node.data.type !== 'asset') return;
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        data: node.data
      });
    },
    [setMenu],
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const isLoading = isLoadingAssets || isLoadingSquads || isLoadingDistress;

  if (isLoading) {
    return <div className="text-center p-8">LOADING TACTICAL DATA...</div>;
  }

  return (
    <ContextMenu onOpenChange={() => setMenu(null)}>
        <div style={{ height: '100%', width: '100%' }}>
          <HoloGraph
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeDragStop={onNodeDragStop}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            panOnDrag
            zoomOnScroll
            panOnScroll
          />
        </div>
        {menu && (
          <ContextMenuContent style={{ top: menu.top, left: menu.left }}>
            <ContextMenuItem onSelect={() => toast.info(`Deploy order issued for ${menu.data.label}`)}>Deploy</ContextMenuItem>
            <ContextMenuItem onSelect={() => toast.warning(`Recall order issued for ${menu.data.label}`)}>Recall</ContextMenuItem>
            <ContextMenuItem onSelect={() => toast.success(`Hailing ${menu.data.label}`)}>Hail</ContextMenuItem>
          </ContextMenuContent>
        )}
    </ContextMenu>
  );
};

export default TacticalMap;