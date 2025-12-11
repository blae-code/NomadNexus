import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track, createLocalAudioTrack, ConnectionQuality } from 'livekit-client';
import AudioProcessor from '../api/AudioProcessor';
import SpatialMixer from '../api/SpatialMixer';
import TacticalTransceiver from '../api/TacticalTransceiver';
import ShipVoice from '../api/ShipVoice';

// Tokens must come from the Supabase Edge function via useLiveKitToken; legacy /functions/generateLiveKitToken is removed.

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

export const LiveKitProvider = ({ children }) => {
  // Shell room = always-on data plane (system events, Riggsy, telemetry)
  const [shellRoom, setShellRoom] = useState(null);
  const [shellConnectionState, setShellConnectionState] = useState('idle');
  const shellRoomRef = useRef(null);
  const shellJoinNonceRef = useRef(0);

  // Active net room = voice traffic for selected net (Campfire, Bonfire, Squad, Command)
  const [room, setRoom] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');
  const roomRef = useRef(null);
  const netJoinNonceRef = useRef(0);
  const [activeNet, setActiveNet] = useState({ code: null, id: null });

  const [audioState, setAudioState] = useState(AUDIO_STATE.DISCONNECTED);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [error, setError] = useState(null);
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
  const [vadThreshold, setVadThreshold] = useState(0.4);

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('nomad-nexus-device-prefs');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setDevicePreferences(prev => ({ ...prev, ...parsed.devicePreferences }));
        if (parsed.vadThreshold) {
          setVadThreshold(parsed.vadThreshold);
        }
      }
    } catch (err) {
      console.warn('Could not load device preferences', err);
    }
  }, []);

  // Save preferences to local storage on change
  useEffect(() => {
    try {
      const prefsToSave = {
        devicePreferences,
        vadThreshold,
      };
      localStorage.setItem('nomad-nexus-device-prefs', JSON.stringify(prefsToSave));
    } catch (err) {
      console.warn('Could not save device preferences', err);
    }
  }, [devicePreferences, vadThreshold]);

  const [broadcastMode, setBroadcastMode] = useState(false);
  const [currentWhisperTarget, setCurrentWhisperTarget] = useState(null);
  const [connectionMetrics, setConnectionMetrics] = useState({
    quality: 'offline',
    latencyMs: 0,
    packetLoss: 0,
    jitter: 0,
    bandwidth: { inKbps: 0, outKbps: 0 },
  });
  const userInitiatedDisconnect = useRef(false);
  const lastConnectionOptions = useRef(null);

  useEffect(() => {
    // Initialize ShipVoice with a sane default voice to avoid undefined profile logs.
    shipVoiceRef.current = new ShipVoice('Microsoft Zira - English (United States)');
    console.log('[LiveKit Provider] Initialized');
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
  
  // Local audio level monitoring
  useEffect(() => {
    if (audioState !== AUDIO_STATE.CONNECTED_OPEN || !roomRef.current?.localParticipant?.audioTrack?.mediaStreamTrack) {
      setLocalAudioLevel(0);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(new MediaStream([roomRef.current.localParticipant.audioTrack.mediaStreamTrack]));
    
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let rafId;
    let lastUpdate = 0;

    const update = (now) => {
      rafId = requestAnimationFrame(update);
      if (now - lastUpdate < 1000 / 15) return; // ~15fps
      lastUpdate = now;

      analyser.getByteFrequencyData(dataArray);
      const level = Math.max(...dataArray) / 255;
      setLocalAudioLevel(level);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [audioState, roomRef.current?.localParticipant?.audioTrack]);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        userInitiatedDisconnect.current = true;
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

  // Reconnection Logic
  useEffect(() => {
    let reconnectionTimer;
    let reconnectionAttempt = 0;
    
    const handleReconnect = () => {
      if (connectionState === 'disconnected' && !userInitiatedDisconnect.current && lastConnectionOptions.current) {
        const delay = Math.min(20000, 1000 * Math.pow(2, reconnectionAttempt));
        reconnectionAttempt++;
        
        reconnectionTimer = setTimeout(() => {
          console.log(`[LiveKit] Reconnecting... (attempt ${reconnectionAttempt})`);
          connect(lastConnectionOptions.current);
        }, delay);
      }
    };

    handleReconnect();

    return () => {
      if (reconnectionTimer) {
        clearTimeout(reconnectionTimer);
      }
    };
  }, [connectionState]);


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
          isSpeaking: false,
          audioLevel: 0,
          connectionQuality: participant.connectionQuality,
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

  /**
   * Connect to LiveKit room
   * 
   * @param {Object} params Connection parameters
   * @param {string} params.roomName LiveKit room name to join
   * @param {string} params.participantName Display name for this participant
   * @param {Object} params.listenerPosition Spatial audio position {x, y, squadId}
   * @param {string} params.role User role (determines audio profile and permissions)
   * @param {string} params.userId Unique user identifier for whisper targeting
   * @param {string} params.tokenOverride JWT token from useLiveKitToken (REQUIRED in production)
   * @param {string} params.serverUrlOverride LiveKit server URL from token response
   * 
   * Production Best Practice:
   * All tokens MUST come from tokenOverride parameter, fetched via useLiveKitToken hook
   * which calls supabase/functions/livekit-token edge function. This ensures:
   * - Secure token generation on server side
   * - Proper JWT validation with API secrets
   * - Role-based permissions (canPublish based on role)
   */
  const connectShell = async ({ roomName = 'nomad-ops-shell', participantName, role, userId, tokenOverride, serverUrlOverride }) => {
    console.log('[LiveKit Shell] connectShell called with:', { 
      roomName, 
      participantName, 
      role, 
      userId, 
      hasToken: !!tokenOverride,
      tokenType: typeof tokenOverride,
      tokenIsString: typeof tokenOverride === 'string',
      tokenLength: typeof tokenOverride === 'string' ? tokenOverride.length : 'N/A',
      hasUrl: !!serverUrlOverride 
    });
    if (!roomName) {
      console.warn('[LiveKit Shell] No roomName provided, aborting');
      return;
    }
    const joinNonce = ++shellJoinNonceRef.current;
    setShellConnectionState('connecting');
    try {
      console.log('[LiveKit Shell] Connecting to shell room:', roomName);
      const authToken = tokenOverride;
      const livekitUrl = serverUrlOverride;
      if (!authToken || !livekitUrl) {
        console.error('[LiveKit Shell] Missing credentials:', { hasToken: !!authToken, hasUrl: !!livekitUrl });
        throw new Error('Shell LiveKit credentials missing - tokenOverride and serverUrlOverride are required.');
      }
      if (typeof authToken !== 'string') {
        console.error('[LiveKit Shell] Token is not a string!', { tokenType: typeof authToken, token: authToken });
        throw new Error(`Token must be a string, got ${typeof authToken}`);
      }
      console.log('[LiveKit Shell] Credentials validated. URL:', livekitUrl, 'Token length:', authToken?.length, 'Token prefix:', authToken.substring(0, 50));
      // Minimal listeners for shell; primarily used for data-plane/system events.
      console.log('[LiveKit Shell] Creating Room instance...');
      const lkRoom = new Room({ adaptiveStream: true, dynacast: true, stopLocalTrackOnUnpublish: true });
      
      // Track participant connections
      lkRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        const meta = participant.metadata ? JSON.parse(participant.metadata) : {};
        console.log('[LiveKit Shell] Participant connected:', { 
          name: participant.name, 
          identity: participant.identity,
          rank: meta.rank,
          role: meta.role,
          totalParticipants: lkRoom.participants.size + 1
        });
      });
      
      lkRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('[LiveKit Shell] Participant disconnected:', { 
          name: participant.name,
          totalParticipants: lkRoom.participants.size 
        });
      });
      
      lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('[LiveKit Shell] Connection state changed:', state);
        if (joinNonce !== shellJoinNonceRef.current) return;
        setShellConnectionState(state);
        if (state === 'disconnected') {
          setShellRoom(null);
        }
      });
      console.log('[LiveKit Shell] Calling room.connect() with URL:', livekitUrl);
      await lkRoom.connect(livekitUrl, authToken);
      console.log('[LiveKit Shell] room.connect() completed successfully');
      if (joinNonce !== shellJoinNonceRef.current) {
        lkRoom.disconnect();
        return;
      }
      
      // Log initial participants
      const initialParticipants = Array.from(lkRoom.participants.values());
      console.log('[LiveKit Shell] Initial participants in room:', {
        count: initialParticipants.length + 1,
        participants: [
          { name: lkRoom.localParticipant.name, isLocal: true },
          ...initialParticipants.map(p => ({ name: p.name, identity: p.identity }))
        ]
      });
      
      // Attach metadata for system presence
      const metaPayload = {
        role: role || 'Observer',
        rank: role || 'Observer',
        userId,
        netCode: roomName,
      };
      try {
        await lkRoom.localParticipant.setMetadata(JSON.stringify(metaPayload));
      } catch (err) {
        console.warn('Shell metadata set failed', err);
      }
      shellRoomRef.current = lkRoom;
      setShellRoom(lkRoom);
      setShellConnectionState('connected');
      console.log('[LiveKit Shell] ✅ Shell connected successfully to', roomName);
    } catch (err) {
      if (joinNonce !== shellJoinNonceRef.current) {
        console.warn('[LiveKit Shell] Connection attempt cancelled (stale nonce)');
        return;
      }
      console.error('[LiveKit Shell] ❌ Connect failed:', err);
      console.error('[LiveKit Shell] Error details:', { message: err.message, stack: err.stack, code: err.code });
      setError(err);
      setShellConnectionState('error');
    }
  };

  const connect = async (options) => {
    lastConnectionOptions.current = options;
    userInitiatedDisconnect.current = false;
    const { roomName, participantName, listenerPosition, role, userId, tokenOverride, serverUrlOverride, netId, linkedSquadId, position } = options;

    if (!roomName) return;
    const joinNonce = ++netJoinNonceRef.current;
    setConnectionState('connecting');
    setError(null);
    // Disconnect any existing net room immediately to avoid double mic publish
    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch (err) {
        console.warn('Previous net disconnect failed', err);
      }
      roomRef.current = null;
      setRoom(null);
    }
    try {
      const authToken = tokenOverride;
      const livekitUrl = serverUrlOverride;

      if (!authToken || !livekitUrl) {
        throw new Error('LiveKit credentials missing - tokenOverride and serverUrlOverride are required. Ensure useLiveKitToken hook has returned valid token.');
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
      tactical.setOnMuteAckReceived(() => {
        setMuteAcked(true);
        shipVoiceRef.current?.announce?.('Priority override acknowledged.');
      });
      tactical.setOnBroadcastStateReceived((payload) => {
        setBroadcastMode(payload.enabled);
      });
      tactical.setOnDataSlateMessageReceived((payload) => {
        setDataFeed((prev) => [...prev.slice(-49), payload]);
      });
      tactical.setOnRiggsyResponse((payload) => {
        setDataFeed((prev) => [...prev.slice(-49), { type: 'RIGGSY_RESPONSE', response: payload.response }]);
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
        const speakerIdentities = speakers.map(s => s.identity);
        
        setRemoteAudioTracks(prev => {
          const next = {...prev};
          // Reset all speakers
          Object.keys(next).forEach(sid => {
            next[sid].isSpeaking = false;
            next[sid].audioLevel = 0;
          });
          // Set active speakers
          speakers.forEach(speaker => {
            const track = Object.values(next).find(t => t.participantId === speaker.identity);
            if(track) {
              track.isSpeaking = true;
              track.audioLevel = speaker.audioLevel;
            }
          });
          return next;
        });

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

      lkRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        if (joinNonce !== netJoinNonceRef.current) return;
        setConnectionState(state);
        if (state === 'connected') {
          setAudioState(AUDIO_STATE.CONNECTED_MUTED);
          setActiveNet({ code: roomName, id: netId || null });
        }
        if (state === 'disconnected') {
          setAudioState(AUDIO_STATE.DISCONNECTED);
          setRoom(null);
          setActiveNet({ code: null, id: null });
        }
        if (state !== 'connected') {
          setConnectionMetrics((prev) => ({
            ...prev,
            quality: state === 'reconnecting' ? 'fair' : 'offline',
            bandwidth: { inKbps: 0, outKbps: 0 },
          }));
        }
      });

      // Track connection quality updates for all participants
      const handleQuality = (quality, participant) => {
        const qualityMap = {
          [ConnectionQuality.Excellent]: 'excellent',
          [ConnectionQuality.Good]: 'good',
          [ConnectionQuality.Poor]: 'poor',
          [ConnectionQuality.Lost]: 'offline',
        };
        const qualityStr = qualityMap[quality] || 'fair';

        if (participant.isLocal) {
          setConnectionMetrics((prev) => ({ ...prev, quality: qualityStr }));
        } else {
          setRemoteAudioTracks(prev => {
            const track = Object.values(prev).find(t => t.participantId === participant.identity);
            if (track) {
              return {...prev, [track.sid]: {...track, connectionQuality: qualityStr}};
            }
            return prev;
          });
        }
      };
      lkRoom.on(RoomEvent.ConnectionQualityChanged, handleQuality);

      // Seed initial quality if available
      if (lkRoom.localParticipant?.connectionQuality !== undefined) {
        handleQuality(lkRoom.localParticipant.connectionQuality, lkRoom.localParticipant);
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

      await lkRoom.connect(livekitUrl, authToken);
      if (joinNonce !== netJoinNonceRef.current) {
        lkRoom.disconnect();
        return;
      }
      const resolvedRole = role || roleProfile || 'Vagrant';
      const metaPayload = {
        ...(listenerPosition || {}),
        ...(position || {}),
        role: resolvedRole,
        rank: resolvedRole,
        userId,
        linked_squad_id: linkedSquadId || null,
        netCode: roomName,
      };
      lastMetadataRef.current = metaPayload;
      try {
        await lkRoom.localParticipant.setMetadata(JSON.stringify(metaPayload));
      } catch (err) {
        console.warn('Metadata set failed', err);
      }
      roomRef.current = lkRoom;
      setRoom(lkRoom);
      console.log('[LiveKit] Net connected to', roomName);
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
    userInitiatedDisconnect.current = true;
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
    setActiveNet({ code: null, id: null });
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
    transceiverRef.current?.publishBroadcastState(enabled);
  };

  const publishData = (payload, reliable = true) => {
    transceiverRef.current?.publishData(payload, reliable);
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
    transceiverRef.current?.publishFlare(variant, location);
  };

  const publishMuteAll = () => {
    transceiverRef.current?.publishMuteAll();
  };
  
  const publishAck = () => {
    transceiverRef.current?.publishMuteAck();
  };

  const publishRiggsyQuery = (query) => {
    transceiverRef.current?.publishRiggsyQuery(query);
  };

  const remoteAudioList = useMemo(() => Object.values(remoteAudioTracks), [remoteAudioTracks]);

  const value = {
    audioState,
    localAudioLevel,
    connectionState,
    shellConnectionState,
    room,
    shellRoom,
    error,
    connectionMetrics,
    activeNet,
    lastFlare,
    lastMuteAll,
    roleProfile,
    dataFeed,
    remoteAudioTracks: remoteAudioList,
    prioritySpeaker,
    soloTrack,
    devices,
    devicePreferences,
    vadThreshold,
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
    connect, // connect active net room
    connectNet: connect,
    connectShell,
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
    publishRiggsyQuery,
    updateDevicePreference,
    updateProcessingPreference,
    setVadThreshold,
    muteAcked,
  };

  // Expose context for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__LIVEKIT_CONTEXT__ = {
        shellRoom,
        room,
        publishFlare,
        publishWhisper,
        setBroadcast,
        publishMuteAll,
        audioState,
        connectionState,
        shellConnectionState
      };
    }
  }, [shellRoom, room, audioState, connectionState, shellConnectionState]);

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>;
};

export const useLiveKit = () => {
  return useContext(LiveKitContext);
};
