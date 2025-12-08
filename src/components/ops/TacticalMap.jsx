import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import { 
  Ship, Users, ShieldAlert, MapPin, Info, 
  Plus, RotateCcw, ZoomIn, ZoomOut, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      const { data, error } = await supabase.from('squads').select('*');
      if (error) {
        console.warn('Failed to fetch squads:', error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: distressSignals = [], isLoading: isLoadingDistress } = useQuery({
    queryKey: ['tactical-distress'],
    queryFn: async () => {
        const { data, error } = await supabase.from('player_status').select('*').eq('status', 'DISTRESS');
        if (error) {
          console.warn('Failed to fetch distress signals:', error);
          return [];
        }
        return data || [];
    },
    refetchInterval: 2000,
  });

  // Fetch sector/location data from events or create derived sectors from fleet_assets
  const { data: sectorsData = [], isLoading: isLoadingSectors } = useQuery({
    queryKey: ['tactical-sectors'],
    queryFn: async () => {
        const { data, error } = await supabase.from('events').select('*').neq('location', null).limit(5);
        if (error) {
          console.warn('Failed to fetch event locations, using defaults:', error);
          return [];
        }
        // Convert events with locations to sector-like objects
        return (data || []).map((event, idx) => ({
          id: `LOC-${idx}`,
          name: event.location,
          x: 200 + (idx * 300),
          y: 400 + (Math.random() * 200),
          status: event.status === 'active' ? 'active' : 'secure'
        }));
    },
    refetchInterval: 10000,
  });

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

  useEffect(() => {
    if (isLoadingAssets || isLoadingSquads || isLoadingDistress || isLoadingSectors) return;

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
        data: { type: 'squad', label: squad.name, sublabel: `Leader: ${squad.leader_id || 'Unassigned'}` },
        draggable: false,
    }));

    const distressNodes = distressSignals.map((signal, index) => ({
        id: signal.id,
        type: 'mapNode',
        position: { x: 1000, y: 150 + (index * 100) },
        data: { type: 'distress_signal', label: 'DISTRESS', sublabel: `User: ${signal.user_id}` },
        draggable: false,
    }));

    const sectorNodes = sectorsData.map(sector => ({
        id: sector.id,
        type: 'mapNode',
        position: { x: sector.x, y: sector.y },
        data: { type: 'sector', label: sector.id, sublabel: sector.name },
        draggable: false,
    }));

    setNodes([...assetNodes, ...squadNodes, ...distressNodes, ...sectorNodes]);
  }, [fleetAssets, squads, distressSignals, sectorsData, isLoadingAssets, isLoadingSquads, isLoadingDistress, isLoadingSectors, setNodes]);

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

  const isLoading = isLoadingAssets || isLoadingSquads || isLoadingDistress || isLoadingSectors;
  const hasData = fleetAssets.length > 0 || squads.length > 0 || distressSignals.length > 0 || sectorsData.length > 0;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="text-emerald-500 text-sm font-bold animate-pulse">LOADING TACTICAL DATA...</div>
          <div className="text-zinc-600 text-xs mt-2">Scanning operational sectors</div>
        </div>
      </div>
    );
  }

  return (
    <ContextMenu onOpenChange={() => setMenu(null)}>
        <div className="relative w-full h-full">
          {/* Map Legend - Top Left */}
          <div className="absolute top-4 left-4 z-20 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-xs font-bold text-emerald-500 mb-2 flex items-center gap-2">
              <Info className="w-3 h-3" />
              MAP LEGEND
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-3 h-3 bg-blue-500 transform rotate-45" />
                <span>Fleet Asset</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="w-3 h-3 text-emerald-500" />
                <span>Squad</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldAlert className="w-3 h-3 text-red-500" />
                <span>Distress Signal</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="w-3 h-3 text-zinc-500" />
                <span>Sector</span>
              </div>
            </div>
          </div>

          {/* Status Panel - Top Right */}
          <div className="absolute top-4 right-4 z-20 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 backdrop-blur-sm min-w-[200px]">
            <div className="text-xs font-bold text-emerald-500 mb-2">TACTICAL STATUS</div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between text-zinc-400">
                <span>Fleet Assets:</span>
                <span className="text-blue-400 font-bold">{fleetAssets.length}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Active Squads:</span>
                <span className="text-emerald-400 font-bold">{squads.length}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Distress Signals:</span>
                <span className={`font-bold ${distressSignals.length > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-600'}`}>
                  {distressSignals.length}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Known Sectors:</span>
                <span className="text-zinc-400 font-bold">{sectorsData.length}</span>
              </div>
            </div>
          </div>

          {/* Control Panel - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-20 bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-emerald-500 mb-2 px-1">MAP CONTROLS</div>
            <div className="space-y-1">
              <div className="text-[9px] text-zinc-500 px-1 mb-1">
                • Right-click assets for actions<br />
                • Drag blue assets to move<br />
                • Scroll to zoom<br />
                • Drag background to pan
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] bg-zinc-950/50 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                onClick={() => toast.info('Center view feature coming soon')}
              >
                <Crosshair className="w-3 h-3 mr-1" />
                Reset View
              </Button>
            </div>
          </div>

          {/* Empty State Overlay */}
          {!hasData && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
              <div className="text-center max-w-md p-6 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                <Ship className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                <div className="text-sm font-bold text-emerald-500 mb-2">NO TACTICAL DATA</div>
                <div className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  The tactical map displays fleet assets, squad positions, distress signals, and operational sectors.
                  Currently no data is available for display.
                </div>
                <div className="text-[10px] text-zinc-500 mb-3">
                  Fleet assets can be added through Fleet Manager.<br />
                  Squads and sectors are created during operations.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] bg-emerald-900/20 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/30"
                  onClick={() => toast.info('Fleet Manager integration coming soon')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Configure Fleet Assets
                </Button>
              </div>
            </div>
          )}

          {/* Main Map */}
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