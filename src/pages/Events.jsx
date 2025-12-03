import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ArrowLeft, Sparkles } from 'lucide-react';
import { canCreateEvent, canEditEvent } from '@/components/permissions';
import EventForm from '@/components/events/EventForm';
import CommsPanel from '@/components/events/CommsPanel';
import SquadManager from '@/components/events/SquadManager';
import PlayerStatusSection from '@/components/events/PlayerStatusSection';
import EventParticipants from '@/components/events/EventParticipants';
import EventEconomy from '@/components/events/EventEconomy';
import CommsConfig from '@/components/events/CommsConfig';
import AIInsightsPanel from '@/components/ai/AIInsightsPanel';
import EventObjectives from '@/components/events/EventObjectives';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function EventDetail({ id, onBack }) {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('intel');

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    fetchUser().catch(() => {});
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      if (!id || !supabase) return null;
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error('Error fetching event', error);
        return null;
      }
      return data;
    },
    enabled: !!id,
  });

  const { data: creator } = useQuery({
    queryKey: ['event-creator', event?.created_by],
    queryFn: async () => {
      if (!supabase || !event?.created_by) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, rsi_handle, email')
        .eq('id', event.created_by)
        .maybeSingle();
      if (error) {
        console.error('Error fetching creator', error);
        return null;
      }
      return data;
    },
    enabled: !!event?.created_by,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['event-users-detail'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching users', error);
        return [];
      }
      return data || [];
    },
    initialData: [],
  });

  const { data: allAssets } = useQuery({
    queryKey: ['event-assets-detail'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('fleet_assets').select('*');
      if (error) {
        console.error('Error fetching assets', error);
        return [];
      }
      return data || [];
    },
    initialData: [],
  });

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-zinc-500">Loading operation...</div>;
  }

  if (!event) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
        <p>Operation not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full grid grid-rows-[auto_1fr] bg-zinc-950/60 border border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center text-zinc-500 hover:text-white text-xs uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Operations
          </button>
          <Badge
            variant="outline"
            className={
              event.event_type === 'focused'
                ? 'text-red-500 border-red-900 bg-red-950/10'
                : 'text-emerald-500 border-emerald-900 bg-emerald-950/10'
            }
          >
            {event.event_type.toUpperCase()}
          </Badge>
          <span className="text-zinc-500 text-xs font-mono">
            {new Date(event.start_time).toLocaleDateString()} |{' '}
            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {creator && (
            <div className="text-right">
              <div className="text-[10px] uppercase text-zinc-500">Host</div>
              <div className="text-xs text-white font-semibold">{creator.rsi_handle || creator.email}</div>
            </div>
          )}
          {canEditEvent(currentUser, event) && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="border-zinc-700 text-zinc-300">
                Edit
              </Button>
              <EventForm event={event} open={isEditOpen} onOpenChange={setIsEditOpen} onSuccess={() => {}} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-rows-[auto_1fr] h-full">
        <div className="grid grid-cols-3 gap-4 px-4 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div>
            <div className="text-[10px] uppercase text-zinc-500 tracking-[0.2em]">Operation</div>
            <div className="text-lg font-bold text-white">{event.title}</div>
            <div className="text-xs text-zinc-500 line-clamp-2">{event.description}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-500 tracking-[0.2em]">Location</div>
            <div className="text-sm font-semibold text-white">{event.location || 'TBD'}</div>
            <div className="text-xs text-zinc-500">Priority: {event.priority || 'STANDARD'}</div>
          </div>
          <div className="flex items-center gap-4 justify-end">
            <div className="text-right">
              <div className="text-[10px] uppercase text-zinc-500">Status</div>
              <div className="text-sm font-semibold text-white">{event.status || 'scheduled'}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-zinc-500">Created</div>
              <div className="text-sm font-semibold text-white">
                {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-6 bg-zinc-900 border-b border-zinc-800 h-10 rounded-none">
            <TabsTrigger value="intel" className="text-[11px] uppercase tracking-[0.15em]">Intel</TabsTrigger>
            <TabsTrigger value="roster" className="text-[11px] uppercase tracking-[0.15em]">Roster</TabsTrigger>
            <TabsTrigger value="comms" className="text-[11px] uppercase tracking-[0.15em]">Comms</TabsTrigger>
            <TabsTrigger value="economy" className="text-[11px] uppercase tracking-[0.15em]">Economy</TabsTrigger>
            <TabsTrigger value="objectives" className="text-[11px] uppercase tracking-[0.15em]">Objectives</TabsTrigger>
            <TabsTrigger value="ops" className="text-[11px] uppercase tracking-[0.15em]">Ops</TabsTrigger>
          </TabsList>

          <TabsContent value="intel" className="flex-1 overflow-auto p-4 space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Intel Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-4 h-4" /> {new Date(event.start_time).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <MapPin className="w-4 h-4" /> {event.location || 'TBD'}
                </div>
                <p>{event.description}</p>
              </CardContent>
            </Card>
            <AIInsightsPanel />
          </TabsContent>

          <TabsContent value="roster" className="flex-1 overflow-auto p-4 space-y-4">
            <PlayerStatusSection eventId={event.id} />
            <EventParticipants eventId={event.id} />
          </TabsContent>

          <TabsContent value="comms" className="flex-1 overflow-auto p-4 space-y-4">
            <CommsPanel eventId={event.id} />
            <CommsConfig eventId={event.id} />
          </TabsContent>

          <TabsContent value="economy" className="flex-1 overflow-auto p-4">
            <EventEconomy eventId={event.id} />
          </TabsContent>

          <TabsContent value="objectives" className="flex-1 overflow-auto p-4">
            <EventObjectives eventId={event.id} />
          </TabsContent>

          <TabsContent value="ops" className="flex-1 overflow-auto p-4 space-y-4">
            <SquadManager eventId={event.id} users={allUsers} assets={allAssets} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      if (error) {
        console.error('Error fetching events', error);
        return [];
      }
      return data || [];
    },
    initialData: [],
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    fetchUser().catch(() => {});
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setSelectedEventId(id);
    } else if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  return (
    <div className="h-full bg-zinc-950 text-zinc-100 p-4 overflow-hidden">
      <div className="h-full grid grid-cols-[340px_1fr] gap-4">
        <div className="h-full border border-zinc-800 bg-black/60 grid grid-rows-[auto_1fr]">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">Operations Board</h1>
              <p className="text-[11px] text-zinc-500">Tabbed, no-scroll workspace</p>
            </div>
            {canCreateEvent(currentUser) && (
              <>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="sm"
                  className="bg-red-900 hover:bg-red-800 text-white"
                >
                  New
                </Button>
                <EventForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
              </>
            )}
          </div>
          <div className="overflow-auto">
            {isLoading ? (
              <div className="text-center py-10 text-zinc-500">Loading operations...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">No active operations.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {events.map((event) => {
                  const active = selectedEventId === event.id;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-zinc-900 transition-colors ${
                        active ? 'bg-zinc-900 border-l-2 border-burnt-orange' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white">{event.title}</div>
                        <Badge
                          variant="outline"
                          className={
                            event.event_type === 'focused'
                              ? 'text-red-500 border-red-900 bg-red-950/10'
                              : 'text-emerald-500 border-emerald-900 bg-emerald-950/10'
                          }
                        >
                          {event.event_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.start_time).toLocaleDateString()} |{' '}
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <MapPin className="w-3 h-3" /> {event.location || 'TBD'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="h-full overflow-hidden">
          {selectedEventId ? (
            <EventDetail id={selectedEventId} onBack={() => setSelectedEventId(null)} />
          ) : (
            <div className="h-full border border-dashed border-zinc-800 bg-black/40 flex items-center justify-center text-zinc-500">
              Select an operation to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
