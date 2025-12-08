import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track, createLocalAudioTrack, ConnectionQuality } from 'livekit-client';
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

const isCommanderRank = (rank) => {
  if (!rank) return false;
  const upper = rank.toUpperCase();
  const ladder = ['CADET', 'ENSIGN', 'LIEUTENANT', 'COMMANDER', 'CAPTAIN', 'ADMIRAL'];
  const idx = ladder.indexOf(upper);
  const commanderIndex = ladder.indexOf('COMMANDER');
  return idx >= commanderIndex || upper.includes('COMMAND');
};

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
  const [remoteAudioTracks, setRemoteAudioTracks] = useState({});
  const [soloTrack, setSoloTrack] = useState(null);
  const [prioritySpeaker, setPrioritySpeaker] = useState(null);
  const whisperTrackRef = useRef(null);
  const [devices, setDevices] = useState({ microphones: [], speakers: [] });
  const [devicePreferences, setDevicePreferences] = useState({
    microphoneId: null,
    speakerId: null,
    noiseSuppression: true,
    echoCancellation: true,
    highPassFilter: false,
  });
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [currentWhisperTarget, setCurrentWhisperTarget] = useState(null);
  const [connectionMetrics, setConnectionMetrics] = useState({
    quality: 'offline',
    latencyMs: 0,
    packetLoss: 0,
    jitter: 0,
    bandwidth: { inKbps: 0, outKbps: 0 },
  });

  useEffect(() => {
    // Initialize ShipVoice with a sane default voice to avoid undefined profile logs.
    shipVoiceRef.current = new ShipVoice('Microsoft Zira - English (United States)');
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const microphones = mediaDevices.filter((d) => d.kind === 'audioinput');
        const speakers = mediaDevices.filter((d) => d.kind === 'audiooutput');
        setDevices({ microphones, speakers });
      } catch (err) {
        console.warn('Device enumeration failed', err);
      }
    };
    loadDevices();
  }, []);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setConnectionMetrics({
        quality: 'offline',
        latencyMs: 0,
        packetLoss: 0,
        jitter: 0,
        bandwidth: { inKbps: 0, outKbps: 0 },
      });
    };
  }, []);

  useEffect(() => {
    Object.keys(remoteAudioTracks).forEach((sid) => applyMixForTrack(sid));
  }, [soloTrack, prioritySpeaker, remoteAudioTracks]);

  const applyMixForTrack = (trackSid, override = {}) => {
    const trackInfo = remoteAudioTracks[trackSid];
    if (!trackInfo) return;
    const soloActive = soloTrack && soloTrack !== trackSid;
    const effective = {
      pan: override.pan ?? trackInfo.pan ?? 0,
      volume: override.volume ?? trackInfo.volume ?? 1,
      muted: override.muted ?? trackInfo.muted ?? false,
    };
    const isDucked = prioritySpeaker && prioritySpeaker.participantId !== trackInfo.participantId;
    let gain = effective.muted ? 0 : effective.volume;
    if (soloActive) gain = 0;
    if (isDucked) gain *= 0.5;
    AudioProcessor.getInstance().updatePanAndGain?.(trackSid, effective.pan, gain);
  };

  const upsertRemoteTrack = (track, publication, participant, initial = {}) => {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
    setRemoteAudioTracks((prev) => {
      const next = {
        ...prev,
        [track.sid]: {
          sid: track.sid,
          participantId: participant.identity,
          userId: metadata.userId,
          participantName: participant.name || participant.identity,
          publicationName: publication?.name || track.sid,
          role: metadata.role,
          rank: metadata.rank || metadata.role,
          pan: initial.pan ?? 0,
          volume: initial.volume ?? 1,
          muted: initial.muted ?? false,
        },
      };
      return next;
    });
    applyMixForTrack(track.sid, initial);
  };

  const removeRemoteTrack = (sid) => {
    setRemoteAudioTracks((prev) => {
      const next = { ...prev };
      delete next[sid];
      return next;
    });
    AudioProcessor.getInstance().stopProcessing?.(sid);
  };

  const connect = async ({ roomName, participantName, listenerPosition, role, userId, tokenOverride, serverUrlOverride }) => {
    if (!roomName) return;
    setConnectionState('connecting');
    setError(null);
    try {
      const tokenPayload = tokenOverride
        ? { token: tokenOverride, livekitUrl: serverUrlOverride }
        : await fetchToken({ roomName, participantName });

      const livekitUrl = tokenPayload.livekitUrl || serverUrlOverride;
      const authToken = tokenOverride || tokenPayload.token;

      if (!authToken || !livekitUrl) {
        throw new Error('LiveKit credentials missing (token or serverUrl)');
      }
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
                { x: meta.x || 0, y: meta.y || 0, squadId: meta.squadId },
                listenerPosition,
                meta.relativeSquadPosition
              );
              AudioProcessor.getInstance().updatePanAndGain?.(track.sid, mix.pan, mix.gain);
              upsertRemoteTrack(track, publication, participant, { pan: mix.pan, volume: mix.gain });
            } catch (err) {
              console.warn('Metadata parse failed for spatial mix', err);
              upsertRemoteTrack(track, publication, participant);
            }
          } else {
            upsertRemoteTrack(track, publication, participant);
          }
        }
      });

      lkRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          removeRemoteTrack(track.sid);
        }
      });

      lkRoom.on(RoomEvent.TrackPublished, async (publication, participant) => {
        if (publication.kind !== Track.Kind.Audio) return;
        const isWhisper = publication.name?.startsWith('whisper-');
        const targetId = publication.name?.split('whisper-')[1];
        try {
          if (!isWhisper || (targetId && targetId === userId)) {
            await publication.setSubscribed(true);
          } else {
            await publication.setSubscribed(false);
          }
        } catch (err) {
          console.warn('Subscription control failed', err);
        }
      });

      lkRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const commanderSpeaker = speakers.find((s) => {
          const meta = s.metadata ? JSON.parse(s.metadata) : {};
          return isCommanderRank(meta.rank || meta.role);
        });
        if (commanderSpeaker) {
          setPrioritySpeaker({ participantId: commanderSpeaker.identity });
        } else {
          setPrioritySpeaker(null);
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
        if (data.type === 'BROADCAST_STATE') {
          setBroadcastMode(Boolean(data.enabled));
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
        if (state !== 'connected') {
          setConnectionMetrics((prev) => ({
            ...prev,
            quality: state === 'reconnecting' ? 'fair' : 'offline',
            bandwidth: { inKbps: 0, outKbps: 0 },
          }));
        }
      });

      // Track connection quality updates for the local participant
      const handleQuality = (participant, quality) => {
        if (!participant.isLocal) return;
        const qualityMap = {
          [ConnectionQuality.Excellent]: 'excellent',
          [ConnectionQuality.Good]: 'good',
          [ConnectionQuality.Poor]: 'poor',
          [ConnectionQuality.Lost]: 'offline',
        };
        setConnectionMetrics((prev) => ({
          ...prev,
          quality: qualityMap[quality] || 'fair',
        }));
      };
      lkRoom.on(RoomEvent.ConnectionQualityChanged, handleQuality);

      // Seed initial quality if available
      if (lkRoom.localParticipant?.connectionQuality !== undefined) {
        handleQuality(lkRoom.localParticipant, lkRoom.localParticipant.connectionQuality);
      }

      // Poll WebRTC stats when available for latency / packet loss
      let statsInterval = null;
      const startStatsPoll = () => {
        if (statsInterval) return;
        statsInterval = setInterval(async () => {
          try {
            const pc = lkRoom.engine?.client?.publisher?.pc || lkRoom.engine?.client?.pc;
            if (!pc || !pc.getStats) return;
            const stats = await pc.getStats();
            let rtt = 0;
            let loss = 0;
            let jitter = 0;
            let inKbps = 0;
            let outKbps = 0;

            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                rtt = Math.round((report.currentRoundTripTime || 0) * 1000);
                if (report.currentPacketsLost !== undefined && report.currentPacketsReceived !== undefined) {
                  const total = (report.currentPacketsReceived || 0) + (report.currentPacketsLost || 0);
                  loss = total > 0 ? Math.min(100, ((report.currentPacketsLost || 0) / total) * 100) : 0;
                }
              }
              if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                jitter = Math.max(jitter, Math.round((report.jitter || 0) * 1000));
              }
              if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
                jitter = Math.max(jitter, Math.round((report.jitter || 0) * 1000));
              }
              if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                if (report.bitrateMean) outKbps = Math.max(outKbps, Math.round(report.bitrateMean / 1000));
              }
              if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                if (report.bitrateMean) inKbps = Math.max(inKbps, Math.round(report.bitrateMean / 1000));
              }
            });

            setConnectionMetrics((prev) => ({
              ...prev,
              latencyMs: rtt,
              packetLoss: Number(loss.toFixed(2)),
              jitter,
              bandwidth: { inKbps, outKbps },
            }));
          } catch (err) {
            // Swallow stats failures silently to avoid UI spam
          }
        }, 2500);
      };

      if (lkRoom.engine?.client) {
        startStatsPoll();
      }

      // Cleanup listeners and intervals on disconnect
      const cleanupMetrics = () => {
        lkRoom.off(RoomEvent.ConnectionQualityChanged, handleQuality);
        if (statsInterval) {
          clearInterval(statsInterval);
          statsInterval = null;
        }
      };

      lkRoom.on(RoomEvent.Disconnected, cleanupMetrics);

      await lkRoom.connect(livekitUrl, token);
      const resolvedRole = role || roleProfile || 'Vagrant';
      const metaPayload = {
        ...(listenerPosition || {}),
        role: resolvedRole,
        rank: resolvedRole,
        userId,
      };
      lastMetadataRef.current = metaPayload;
      try {
        await lkRoom.localParticipant.setMetadata(JSON.stringify(metaPayload));
      } catch (err) {
        console.warn('Metadata set failed', err);
      }
      roomRef.current = lkRoom;
      setRoom(lkRoom);
      // Ensure ShipVoice has a profile aligned to role so voice lines pick a defined profile.
      try {
        shipVoiceRef.current?.setVoiceProfile?.(resolvedRole);
      } catch (err) {
        console.warn('ShipVoice profile set failed', err);
      }
      if (devicePreferences.microphoneId) {
        try {
          await lkRoom.switchActiveDevice('audioinput', devicePreferences.microphoneId);
        } catch (err) {
          console.warn('Mic switch failed', err);
        }
      }
      if (devicePreferences.speakerId) {
        try {
          await lkRoom.switchActiveDevice('audiooutput', devicePreferences.speakerId);
        } catch (err) {
          console.warn('Speaker switch failed', err);
        }
      }
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
    if (whisperTrackRef.current) {
      whisperTrackRef.current.stop?.();
      whisperTrackRef.current = null;
    }
    setRoom(null);
    setRemoteAudioTracks({});
    setSoloTrack(null);
    setPrioritySpeaker(null);
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
      if (enabled && broadcastMode) {
        publishData({ type: 'BROADCAST_STATE', enabled: true });
      }
    } catch (err) {
      console.error('Mic toggle failed', err);
      setError(err);
    }
  };

  const updateTrackMix = (trackSid, payload) => {
    setRemoteAudioTracks((prev) => {
      const next = { ...prev };
      if (!next[trackSid]) return prev;
      next[trackSid] = { ...next[trackSid], ...payload };
      return next;
    });
    applyMixForTrack(trackSid, payload);
  };

  const toggleSoloTrack = (trackSid) => {
    setSoloTrack((current) => (current === trackSid ? null : trackSid));
  };

  const enforceParticipantMute = (participantId, muted) => {
    Object.values(remoteAudioTracks).forEach((track) => {
      if (track.participantId === participantId || track.userId === participantId) {
        updateTrackMix(track.sid, { muted });
      }
    });
  };

  const publishWhisper = async (targetId) => {
    if (!roomRef.current) return;
    try {
      if (whisperTrackRef.current) {
        await roomRef.current.localParticipant.unpublishTrack(whisperTrackRef.current);
        whisperTrackRef.current.stop();
        whisperTrackRef.current = null;
      }
      const track = await createLocalAudioTrack({ deviceId: devicePreferences.microphoneId || undefined });
      whisperTrackRef.current = track;
      await roomRef.current.localParticipant.publishTrack(track, { name: `whisper-${targetId}` });
      setCurrentWhisperTarget(targetId);
      setBroadcastMode(false);
    } catch (err) {
      console.error('Whisper publish failed', err);
    }
  };

  const stopWhisper = async () => {
    if (!roomRef.current || !whisperTrackRef.current) return;
    try {
      await roomRef.current.localParticipant.unpublishTrack(whisperTrackRef.current);
    } catch (err) {
      console.warn('Failed to unpublish whisper', err);
    }
    whisperTrackRef.current.stop?.();
    whisperTrackRef.current = null;
    setCurrentWhisperTarget(null);
  };

  const setBroadcast = (enabled) => {
    setBroadcastMode(enabled);
    publishData({ type: 'BROADCAST_STATE', enabled });
  };

  const publishData = (payload, reliable = true) => {
    if (!roomRef.current) return;
    const encoder = new TextEncoder();
    roomRef.current.localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable });
  };

  const updateDevicePreference = async (kind, deviceId) => {
    const preferenceKey = kind === 'audioinput' ? 'microphoneId' : 'speakerId';
    setDevicePreferences((prev) => ({ ...prev, [preferenceKey]: deviceId }));
    if (roomRef.current && deviceId) {
      try {
        await roomRef.current.switchActiveDevice(kind, deviceId);
      } catch (err) {
        console.warn('Device switch failed', err);
      }
    }
  };

  const updateProcessingPreference = (key, value) => {
    setDevicePreferences((prev) => ({ ...prev, [key]: value }));
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

  const remoteAudioList = useMemo(() => Object.values(remoteAudioTracks), [remoteAudioTracks]);

  const value = {
    audioState,
    connectionState,
    room,
    error,
    connectionMetrics,
    lastFlare,
    lastMuteAll,
    roleProfile,
    dataFeed,
    remoteAudioTracks: remoteAudioList,
    prioritySpeaker,
    soloTrack,
    devices,
    devicePreferences,
    broadcastMode,
    currentWhisperTarget,
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
    updateTrackMix,
    toggleSoloTrack,
    enforceParticipantMute,
    publishWhisper,
    stopWhisper,
    setBroadcast,
    publishData,
    publishAck,
    publishFlare,
    publishMuteAll,
    updateDevicePreference,
    updateProcessingPreference,
    muteAcked,
  };

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>;
};

export const useLiveKit = () => {
  return useContext(LiveKitContext);
};
