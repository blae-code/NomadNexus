import { renderHook, act } from '@testing-library/react';
import { LiveKitProvider, useLiveKit, AUDIO_STATE } from './useLiveKit';
import { Room, RoomEvent } from 'livekit-client';

// Mock livekit-client
jest.mock('livekit-client', () => ({
  Room: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    localParticipant: {
      setMetadata: jest.fn().mockResolvedValue(undefined),
      setMicrophoneEnabled: jest.fn().mockResolvedValue(undefined),
    },
  })),
  RoomEvent: {
    TrackSubscribed: 'trackSubscribed',
    DataReceived: 'dataReceived',
    ConnectionStateChanged: 'connectionStateChanged',
  },
  Track: {
    Kind: {
      Audio: 'audio',
    },
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ token: 'test-token', livekitUrl: 'ws://localhost:7880' }),
  })
);

describe('useLiveKit', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useLiveKit(), { wrapper: LiveKitProvider });
    expect(result.current.audioState).toBe(AUDIO_STATE.DISCONNECTED);
    expect(result.current.connectionState).toBe('idle');
    expect(result.current.room).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should connect to a room', async () => {
    const { result } = renderHook(() => useLiveKit(), { wrapper: LiveKitProvider });

    await act(async () => {
      await result.current.connect({ roomName: 'test-room', participantName: 'test-participant' });
    });

    expect(result.current.room).not.toBeNull();
    expect(result.current.connectionState).toBe('connecting'); 
  });
  
  it('should handle connection state changes', async () => {
    const { result } = renderHook(() => useLiveKit(), { wrapper: LiveKitProvider });
    let roomInstance;
    
    Room.mockImplementationOnce(() => {
        const mockRoom = {
          on: (event, listener) => {
            if (event === RoomEvent.ConnectionStateChanged) {
              setTimeout(() => listener('connected'), 100);
            }
          },
          connect: jest.fn().mockResolvedValue(undefined),
          disconnect: jest.fn(),
          localParticipant: {
            setMetadata: jest.fn().mockResolvedValue(undefined),
          },
        };
        roomInstance = mockRoom;
        return mockRoom;
    });

    await act(async () => {
      await result.current.connect({ roomName: 'test-room', participantName: 'test-participant' });
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(result.current.connectionState).toBe('connected');
    expect(result.current.audioState).toBe(AUDIO_STATE.CONNECTED_MUTED);
  });


  it('should disconnect from a room', async () => {
    const { result } = renderHook(() => useLiveKit(), { wrapper: LiveKitProvider });

    await act(async () => {
      await result.current.connect({ roomName: 'test-room', participantName: 'test-participant' });
    });
    
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.room).toBeNull();
    expect(result.current.connectionState).toBe('idle');
    expect(result.current.audioState).toBe(AUDIO_STATE.DISCONNECTED);
  });
});
