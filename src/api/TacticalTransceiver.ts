import { Room, RoomEvent, LocalParticipant, RemoteParticipant } from 'livekit-client';

interface FlarePayload {
  type: 'FLARE';
  variant: 'COMBAT' | 'MEDICAL';
  loc: string; // e.g., 'HUR-L1'
}

interface MuteAllPayload {
    type: 'MUTE_ALL';
}

type TacticalPayload = FlarePayload | MuteAllPayload;

class TacticalTransceiver {
  private room: Room;
  private onFlareReceived: (payload: FlarePayload) => void = () => {};
  private onMuteAllReceived: () => void = () => {};

  constructor(room: Room) {
    this.room = room;
    this.setupListeners();
  }

  public setOnFlareReceived(callback: (payload: FlarePayload) => void) {
      this.onFlareReceived = callback;
  }

  public setOnMuteAllReceived(callback: () => void) {
    this.onMuteAllReceived = callback;
  }

  private setupListeners() {
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(payload));
      
      if (this.isTacticalPayload(data)) {
        this.handlePayload(data, participant);
      }
    });
  }

  private isTacticalPayload(data: any): data is TacticalPayload {
    return data.type === 'FLARE' || data.type === 'MUTE_ALL';
  }

  private handlePayload(data: TacticalPayload, participant?: RemoteParticipant) {
    switch(data.type) {
        case 'FLARE':
            this.onFlareReceived(data);
            break;
        case 'MUTE_ALL':
            // In a real app, you would have the user's rank available here
            // const rank = getUserRank(participant.identity);
            const rank = 'Pioneer'; // For demonstration
            if (rank === 'Pioneer') {
                this.onMuteAllReceived();
            }
            break;
    }
  }

  public publishFlare(variant: 'COMBAT' | 'MEDICAL', location: string) {
    const payload: FlarePayload = {
      type: 'FLARE',
      variant,
      loc: location,
    };
    this.publishData(payload);
  }

  public publishMuteAll() {
    const payload: MuteAllPayload = {
      type: 'MUTE_ALL',
    };
    this.publishData(payload);
  }

  private publishData(data: TacticalPayload) {
    const encoder = new TextEncoder();
    const payload = encoder.encode(JSON.stringify(data));
    this.room.localParticipant.publishData(payload, { reliable: true });
  }
}

export default TacticalTransceiver;
