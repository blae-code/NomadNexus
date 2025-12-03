import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import AudioProcessor from '../api/AudioProcessor';
import SpatialMixer from '../api/SpatialMixer';
import TacticalTransceiver from '../api/TacticalTransceiver';
import ShipVoice from '../api/ShipVoice';

const ROLE_AUDIO_PROFILES = {
  Ranger: { type: 'radio', distortion: 0.3, highPass: 500, lowPass: 3500 },
  Industry: { type: 'industrial', distortion: 0.1, highPass: 200, lowPass: 4000 },
  Command: { type: 'command', distortion: 0.05, highPass: 120, lowPass: 5000, compression: true },
};

const PIONEER_ROLES = ['Pioneer', 'Command'];
const RESCUE_ROLES = ['Ranger', 'Rescue', 'Medic'];

export const AUDIO_STATE = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTED_MUTED: 'CONNECTED_MUTED',
  CONNECTED_OPEN: 'CONNECTED_OPEN',
};

const LiveKitContext = createContext();

const fetchToken = async ({ roomName, participantName }) => {
  const res = await fetch('/functions/generateLiveKitToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ roomName, participantName }),
  });
  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }
  const data = await res.json();
  const token = data.tokens ? data.tokens[roomName] : data.token;
  return { token, livekitUrl: data.livekitUrl };
};

export const LiveKitProvider = ({ children }) => {
  const [audioState, setAudioState] = useState(AUDIO_STATE.DISCONNECTED);
  const [connectionState, setConnectionState] = useState('idle');
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const roomRef = useRef(null);
  const spatialMixer = useRef(new SpatialMixer());
  const transceiverRef = useRef(null);
  const [lastFlare, setLastFlare] = useState(null);
  const [lastMuteAll, setLastMuteAll] = useState(null);
  const [muteAcked, setMuteAcked] = useState(false);
  const [dataFeed, setDataFeed] = useState([]);
  const shipVoiceRef = useRef(null);
  const [listenerPosition, setListenerPosition] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const lastMetadataRef = useRef(null);
  const pioneerHot = useRef(false);

  useEffect(() => {
    shipVoiceRef.current = new ShipVoice();
  }, []);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  const connect = async ({ roomName, participantName, listenerPosition, role }) => {
    if (!roomName) return;
    setConnectionState('connecting');
    setError(null);
    try {
      const { token, livekitUrl } = await fetchToken({ roomName, participantName });
      const lkRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });
      const tactical = new TacticalTransceiver(lkRoom);
      tactical.setOnFlareReceived((payload) => {
        setLastFlare(payload);
        shipVoiceRef.current?.playFlareAlert(payload.variant);
      });
      tactical.setOnMuteAllReceived(() => {
        setLastMuteAll(Date.now());
        setMuteAcked(false);
        setMicrophoneEnabled(false);
        shipVoiceRef.current?.playMuteAllAlert();
      });
      transceiverRef.current = tactical;

      lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && track.mediaStream) {
          const meta = participant.metadata ? JSON.parse(participant.metadata) : {};
          const profile = ROLE_AUDIO_PROFILES[meta.role] || null;
          AudioProcessor.getInstance().processRemoteTrack(track, profile);
          if (listenerPosition) {
            try {
              const mix = spatialMixer.current.calculateMix(
                { x: meta.x || 0, y: meta.y || 0 },
                listenerPosition
              );
              AudioProcessor.getInstance().updatePanAndGain?.(track.sid, mix.pan, mix.gain);
            } catch (err) {
              console.warn('Metadata parse failed for spatial mix', err);
            }
          }
        }
      });

      lkRoom.on(RoomEvent.DataReceived, (payload) => {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === 'FLARE') return;
        if (data.type === 'MUTE_ALL') {
          setLastMuteAll(Date.now());
          setMuteAcked(false);
          setMicrophoneEnabled(false);
          shipVoiceRef.current?.playMuteAllAlert();
          return;
        }
        if (data.type === 'MUTE_ACK') {
          setMuteAcked(true);
          shipVoiceRef.current?.announce?.('Priority override acknowledged.');
          return;
        }
        setDataFeed((prev) => [...prev.slice(-49), data]);
      });

      lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
        if (state === 'connected') {
          setAudioState(AUDIO_STATE.CONNECTED_MUTED);
        }
        if (state === 'disconnected') {
          setAudioState(AUDIO_STATE.DISCONNECTED);
          setRoom(null);
        }
      });

      await lkRoom.connect(livekitUrl, token);
      const metaPayload = { ...(listenerPosition || {}), role: role || roleProfile || 'Vagrant' };
      lastMetadataRef.current = metaPayload;
      try {
        await lkRoom.localParticipant.setMetadata(JSON.stringify(metaPayload));
      } catch (err) {
        console.warn('Metadata set failed', err);
      }
      roomRef.current = lkRoom;
      setRoom(lkRoom);
      if (role) setRoleProfile(role);
    } catch (err) {
      console.error('LiveKit connect failed', err);
      setError(err);
      setConnectionState('error');
      setAudioState(AUDIO_STATE.DISCONNECTED);
    }
  };

  const disconnect = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setRoom(null);
    setAudioState(AUDIO_STATE.DISCONNECTED);
    setConnectionState('idle');
  };

  const setMicrophoneEnabled = async (enabled) => {
    if (!roomRef.current) {
      return;
    }
    try {
      if (enabled && roleProfile && PIONEER_ROLES.includes(roleProfile)) {
        pioneerHot.current = true;
        // Basic ducking: reduce all remote track gains
        roomRef.current.remoteParticipants.forEach((p) => {
          p.tracks.forEach((pub) => {
            if (pub.track) {
              AudioProcessor.getInstance().updatePanAndGain?.(pub.track.sid, 0, 0.2);
            }
          });
        });
        publishData({ type: 'MUTE_ALL' });
      } else if (!enabled && pioneerHot.current) {
        pioneerHot.current = false;
        roomRef.current.remoteParticipants.forEach((p) => {
          p.tracks.forEach((pub) => {
            if (pub.track) {
              AudioProcessor.getInstance().updatePanAndGain?.(pub.track.sid, 0, 1);
            }
          });
        });
      }
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setAudioState(enabled ? AUDIO_STATE.CONNECTED_OPEN : AUDIO_STATE.CONNECTED_MUTED);
      if (transceiverRef.current && enabled && roleProfile && PIONEER_ROLES.includes(roleProfile)) {
        publishData({ type: 'MUTE_ALL' });
      }
    } catch (err) {
      console.error('Mic toggle failed', err);
      setError(err);
    }
  };

  const publishData = (payload, reliable = true) => {
    if (!roomRef.current) return;
    const encoder = new TextEncoder();
    roomRef.current.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable });
  };

  const setRole = (role) => setRoleProfile(role);
  const updateMetadata = async (meta) => {
    lastMetadataRef.current = meta;
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setMetadata(JSON.stringify(meta));
      } catch (err) {
        console.warn('Metadata set failed', err);
      }
    }
  };

  const publishFlare = (variant, location = 'UNKNOWN') => {
    if (transceiverRef.current) {
      transceiverRef.current.publishFlare(variant, location);
    } else {
      publishData({ type: 'FLARE', variant, loc: location });
    }
  };

  const publishMuteAll = () => {
    if (transceiverRef.current) {
      transceiverRef.current.publishMuteAll();
    } else {
      publishData({ type: 'MUTE_ALL' });
    }
  };
  const publishAck = (payload) => publishData(payload, true);

  const value = {
    audioState,
    connectionState,
    room,
    error,
    lastFlare,
    lastMuteAll,
    roleProfile,
    dataFeed,
    setListenerPosition: (pos) => {
      setListenerPosition(pos);
      const meta = { ...(lastMetadataRef.current || {}), ...pos };
      updateMetadata(meta);
    },
    setRole: (role) => {
      setRoleProfile(role);
      const meta = { ...(lastMetadataRef.current || {}), role };
      updateMetadata(meta);
    },
    connect,
    disconnect,
    setMicrophoneEnabled,
    publishData,
    publishAck,
    publishFlare,
    publishMuteAll,
    muteAcked,
  };

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>;
};

export const useLiveKit = () => {
  return useContext(LiveKitContext);
};
