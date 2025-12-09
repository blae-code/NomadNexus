import { Room, RoomEvent, LocalParticipant, RemoteParticipant } from 'livekit-client';

// Define specific payload types for each message
export interface FlarePayload {
  type: 'FLARE';
  variant: 'COMBAT' | 'MEDICAL';
  loc: string;
}

export interface MuteAllPayload {
  type: 'MUTE_ALL';
}

export interface MuteAckPayload {
  type: 'MUTE_ACK';
  ts: number;
}

export interface BroadcastStatePayload {
  type: 'BROADCAST_STATE';
  enabled: boolean;
}

export interface HolotableStatePayload {
  type: 'HOLOTABLE_STATE';
  // Example payload: replace with actual holotable state
  objects: { id: string, position: { x: number, y: number, z: number } }[];
}

export interface DataSlateMessagePayload {
  type: 'DATA_SLATE_MESSAGE';
  message: string;
  sender: string;
}

export interface RouteUpdatePayload {
  type: 'ROUTE_UPDATE';
  fleet: string;
  destination: string;
}

// Union of all possible tactical payloads
export type TacticalPayload = 
  | FlarePayload 
  | MuteAllPayload
  | MuteAckPayload
  | BroadcastStatePayload
  | HolotableStatePayload
  | DataSlateMessagePayload
  | RouteUpdatePayload
  | RiggsyQueryPayload
  | RiggsyResponsePayload;

type TacticalCallback<T> = (payload: T, participant?: RemoteParticipant) => void;

export interface RiggsyQueryPayload {
  type: 'RIGGSY_QUERY';
  query: string;
}

export interface RiggsyResponsePayload {
  type: 'RIGGSY_RESPONSE';
  response: string;
}

class TacticalTransceiver {
  private room: Room;
  
  // Callback handlers for each message type
  private onFlareReceived: TacticalCallback<FlarePayload> = () => {};
  private onMuteAllReceived: TacticalCallback<MuteAllPayload> = () => {};
  private onMuteAckReceived: TacticalCallback<MuteAckPayload> = () => {};
  private onBroadcastStateReceived: TacticalCallback<BroadcastStatePayload> = () => {};
  private onHolotableStateReceived: TacticalCallback<HolotableStatePayload> = () => {};
  private onDataSlateMessageReceived: TacticalCallback<DataSlateMessagePayload> = () => {};
  private onRouteUpdateReceived: TacticalCallback<RouteUpdatePayload> = () => {};
  private onRiggsyResponseReceived: TacticalCallback<RiggsyResponsePayload> = () => {};

  constructor(room: Room) {
    this.room = room;
    this.setupListeners();
  }
  
  // Central listener for all data packets
  private setupListeners() {
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      const decoder = new TextDecoder();
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (this.isTacticalPayload(data)) {
          this.handlePayload(data, participant);
        }
      } catch (e) {
        console.warn('Failed to parse tactical data packet', e);
      }
    });
  }
  
  private isTacticalPayload(data: any): data is TacticalPayload {
    return typeof data === 'object' && data !== null && 'type' in data;
  }

  // Type-safe payload handler
  private handlePayload(data: TacticalPayload, participant?: RemoteParticipant) {
    switch(data.type) {
        case 'FLARE':
            this.onFlareReceived(data, participant);
            break;
        case 'MUTE_ALL':
            this.onMuteAllReceived(data, participant);
            break;
        case 'MUTE_ACK':
            this.onMuteAckReceived(data, participant);
            break;
        case 'BROADCAST_STATE':
            this.onBroadcastStateReceived(data, participant);
            break;
        case 'HOLOTABLE_STATE':
            this.onHolotableStateReceived(data, participant);
            break;
        case 'DATA_SLATE_MESSAGE':
            this.onDataSlateMessageReceived(data, participant);
            break;
        case 'ROUTE_UPDATE':
            this.onRouteUpdateReceived(data, participant);
            break;
        case 'RIGGSY_RESPONSE':
            this.onRiggsyResponseReceived(data, participant);
            break;
    }
  }

  // --- Callback Registration ---
  public setOnFlareReceived(callback: TacticalCallback<FlarePayload>) { this.onFlareReceived = callback; }
  public setOnMuteAllReceived(callback: TacticalCallback<MuteAllPayload>) { this.onMuteAllReceived = callback; }
  public setOnMuteAckReceived(callback: TacticalCallback<MuteAckPayload>) { this.onMuteAckReceived = callback; }
  public setOnBroadcastStateReceived(callback: TacticalCallback<BroadcastStatePayload>) { this.onBroadcastStateReceived = callback; }
  public setOnHolotableStateReceived(callback: TacticalCallback<HolotableStatePayload>) { this.onHolotableStateReceived = callback; }
  public setOnDataSlateMessageReceived(callback: TacticalCallback<DataSlateMessagePayload>) { this.onDataSlateMessageReceived = callback; }
  public setOnRouteUpdateReceived(callback: TacticalCallback<RouteUpdatePayload>) { this.onRouteUpdateReceived = callback; }
  public setOnRiggsyResponse(callback: TacticalCallback<RiggsyResponsePayload>) { this.onRiggsyResponseReceived = callback; }

  // --- Strongly-typed Publish Helpers ---
  public publishFlare(variant: 'COMBAT' | 'MEDICAL', location: string) {
    this.publishData({ type: 'FLARE', variant, loc: location });
  }

  public publishMuteAll() {
    this.publishData({ type: 'MUTE_ALL' });
  }

  public publishMuteAck() {
    this.publishData({ type: 'MUTE_ACK', ts: Date.now() });
  }

  public publishBroadcastState(enabled: boolean) {
    this.publishData({ type: 'BROADCAST_STATE', enabled });
  }
  
  public publishHolotableState(state: Omit<HolotableStatePayload, 'type'>) {
    this.publishData({ type: 'HOLOTABLE_STATE', ...state });
  }

  public publishDataSlateMessage(message: string, sender: string) {
    this.publishData({ type: 'DATA_SLATE_MESSAGE', message, sender });
  }

  public publishRouteUpdate(fleet: string, destination: string) {
    this.publishData({ type: 'ROUTE_UPDATE', fleet, destination });
  }

  public publishRiggsyQuery(query: string) {
    this.publishData({ type: 'RIGGSY_QUERY', query });
  }

  // Generic publish method
  public publishData(data: Partial<TacticalPayload>, reliable: boolean = true) {
    const encoder = new TextEncoder();
    const payload = encoder.encode(JSON.stringify(data));
    this.room.localParticipant.publishData(payload, { reliable });
  }
}

export default TacticalTransceiver;
