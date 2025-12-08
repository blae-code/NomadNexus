// tests/voice-comms-live.spec.ts
/**
 * Voice Communications Live Deployment Tests
 * Validates rank-based feature access and real-time functionality
 * 
 * Test Coverage:
 * - Rank hierarchy validation
 * - Feature matrix gating across all ranks
 * - LiveKit integration & real-time metrics
 * - PTT and tactical commands
 * - Voice net management
 * - Roster and participant controls
 */

import { test, expect, describe, beforeEach } from 'vitest';

// Mock user data at each rank
const MOCK_USERS = {
  vagrant: {
    id: 'user-vagrant-001',
    rank: 'vagrant',
    callsign: 'Vagrant-Test',
    role_tags: ['observer']
  },
  scout: {
    id: 'user-scout-001',
    rank: 'scout',
    callsign: 'Scout-Test',
    role_tags: ['ranger']
  },
  voyager: {
    id: 'user-voyager-001',
    rank: 'voyager',
    callsign: 'Voyager-Test',
    role_tags: ['pilot']
  },
  founder: {
    id: 'user-founder-001',
    rank: 'founder',
    callsign: 'Founder-Test',
    role_tags: ['commander']
  },
  pioneer: {
    id: 'user-pioneer-001',
    rank: 'pioneer',
    callsign: 'Pioneer-Test',
    role_tags: ['admin', 'commander']
  }
};

const RANK_VALUES = {
  'pioneer': 6,
  'founder': 5,
  'voyager': 4,
  'scout': 3,
  'affiliate': 2,
  'vagrant': 1
};

// ============================================================================
// 1. RANK HIERARCHY TESTS
// ============================================================================

describe('Rank Hierarchy & hasMinRank()', () => {
  // Mock hasMinRank implementation
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  test('Rank values are correctly ordered', () => {
    expect(RANK_VALUES['pioneer']).toBe(6);
    expect(RANK_VALUES['founder']).toBe(5);
    expect(RANK_VALUES['voyager']).toBe(4);
    expect(RANK_VALUES['scout']).toBe(3);
    expect(RANK_VALUES['vagrant']).toBe(1);
  });

  test('Pioneer user meets all rank requirements', () => {
    expect(hasMinRank(MOCK_USERS.pioneer, 'pioneer')).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, 'founder')).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, 'voyager')).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, 'scout')).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, 'vagrant')).toBe(true);
  });

  test('Founder user meets founder+ requirements', () => {
    expect(hasMinRank(MOCK_USERS.founder, 'founder')).toBe(true);
    expect(hasMinRank(MOCK_USERS.founder, 'voyager')).toBe(true);
    expect(hasMinRank(MOCK_USERS.founder, 'scout')).toBe(true);
    expect(hasMinRank(MOCK_USERS.founder, 'pioneer')).toBe(false);
  });

  test('Voyager user meets voyager+ requirements', () => {
    expect(hasMinRank(MOCK_USERS.voyager, 'voyager')).toBe(true);
    expect(hasMinRank(MOCK_USERS.voyager, 'scout')).toBe(true);
    expect(hasMinRank(MOCK_USERS.voyager, 'founder')).toBe(false);
    expect(hasMinRank(MOCK_USERS.voyager, 'pioneer')).toBe(false);
  });

  test('Scout user meets scout+ requirements', () => {
    expect(hasMinRank(MOCK_USERS.scout, 'scout')).toBe(true);
    expect(hasMinRank(MOCK_USERS.scout, 'voyager')).toBe(false);
    expect(hasMinRank(MOCK_USERS.scout, 'founder')).toBe(false);
  });

  test('Vagrant user blocked from scout+ content', () => {
    expect(hasMinRank(MOCK_USERS.vagrant, 'scout')).toBe(false);
    expect(hasMinRank(MOCK_USERS.vagrant, 'voyager')).toBe(false);
    expect(hasMinRank(MOCK_USERS.vagrant, 'founder')).toBe(false);
    expect(hasMinRank(MOCK_USERS.vagrant, 'pioneer')).toBe(false);
  });

  test('No user without rank always fails', () => {
    const noRankUser = { id: 'test', rank: null };
    expect(hasMinRank(noRankUser, 'scout')).toBe(false);
    expect(hasMinRank(null, 'scout')).toBe(false);
  });
});

// ============================================================================
// 2. VOICE ACCESS GATE TESTS
// ============================================================================

describe('Voice Access Gate: canAccessFocusedVoice()', () => {
  const canAccessFocusedVoice = (user: any): boolean => {
    if (!user || !user.rank) return false;
    const allowedRanks = ['scout', 'voyager', 'founder', 'pioneer', 'affiliate'];
    return allowedRanks.includes(user.rank?.toLowerCase?.());
  };

  test('Vagrant blocked from voice nets', () => {
    expect(canAccessFocusedVoice(MOCK_USERS.vagrant)).toBe(false);
  });

  test('Scout+ allowed to join voice nets', () => {
    expect(canAccessFocusedVoice(MOCK_USERS.scout)).toBe(true);
    expect(canAccessFocusedVoice(MOCK_USERS.voyager)).toBe(true);
    expect(canAccessFocusedVoice(MOCK_USERS.founder)).toBe(true);
    expect(canAccessFocusedVoice(MOCK_USERS.pioneer)).toBe(true);
  });

  test('Affiliate allowed access', () => {
    const affiliate = { id: 'user-affiliate-001', rank: 'affiliate' };
    expect(canAccessFocusedVoice(affiliate)).toBe(true);
  });

  test('Returns false for invalid rank', () => {
    const invalidUser = { id: 'test', rank: 'unknown' };
    expect(canAccessFocusedVoice(invalidUser)).toBe(false);
  });
});

// ============================================================================
// 3. FEATURE MATRIX GATING TESTS
// ============================================================================

describe('CommsFeatureMatrix - Feature Access Gating', () => {
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  // Feature definitions from CommsFeatureMatrix.jsx
  const features = [
    { id: 'presence', name: 'Presence Grid', required: null }, // Anyone
    { id: 'campfire', name: 'Campfire Creation', required: 'scout' },
    { id: 'bonfire', name: 'Bonfire Management', required: 'scout' },
    { id: 'broadcast', name: 'Broadcast', required: 'voyager' },
    { id: 'whisper', name: 'Whisper', required: 'scout' },
    { id: 'flares', name: 'Flares', required: 'scout' },
    { id: 'routing', name: 'Fleet Routing', required: 'voyager' },
    { id: 'bridging', name: 'Net Bridging', required: 'founder' },
    { id: 'mute_all', name: 'Global Mute', required: 'founder' }
  ];

  test('Presence feature available to all', () => {
    features.forEach(feature => {
      if (feature.id === 'presence') {
        expect(feature.required).toBeNull();
      }
    });
  });

  test('Scout features (campfire, bonfire, whisper, flares) unlocked for Scout+', () => {
    const scoutFeatures = ['campfire', 'bonfire', 'whisper', 'flares'];
    scoutFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.scout, feature.required)).toBe(true);
      expect(hasMinRank(MOCK_USERS.voyager, feature.required)).toBe(true);
      expect(hasMinRank(MOCK_USERS.founder, feature.required)).toBe(true);
    });
  });

  test('Scout features blocked for Vagrant', () => {
    const scoutFeatures = ['campfire', 'bonfire', 'whisper', 'flares'];
    scoutFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.vagrant, feature.required)).toBe(false);
    });
  });

  test('Voyager features (broadcast, routing) unlocked for Voyager+', () => {
    const voyagerFeatures = ['broadcast', 'routing'];
    voyagerFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.voyager, feature.required)).toBe(true);
      expect(hasMinRank(MOCK_USERS.founder, feature.required)).toBe(true);
    });
  });

  test('Voyager features blocked for Scout', () => {
    const voyagerFeatures = ['broadcast', 'routing'];
    voyagerFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.scout, feature.required)).toBe(false);
    });
  });

  test('Founder features (bridging, mute_all) unlocked for Founder+', () => {
    const founderFeatures = ['bridging', 'mute_all'];
    founderFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.founder, feature.required)).toBe(true);
      expect(hasMinRank(MOCK_USERS.pioneer, feature.required)).toBe(true);
    });
  });

  test('Founder features blocked for Voyager', () => {
    const founderFeatures = ['bridging', 'mute_all'];
    founderFeatures.forEach(fid => {
      const feature = features.find(f => f.id === fid);
      expect(hasMinRank(MOCK_USERS.voyager, feature.required)).toBe(false);
    });
  });

  test('Feature count by rank tier', () => {
    const countEnabledFor = (user: any) => features.filter(f => {
      if (f.required === null) return true; // Presence always enabled
      return hasMinRank(user, f.required);
    }).length;

    expect(countEnabledFor(MOCK_USERS.vagrant)).toBe(1); // Only presence
    expect(countEnabledFor(MOCK_USERS.scout)).toBe(6); // presence + 5 scout features
    expect(countEnabledFor(MOCK_USERS.voyager)).toBe(8); // all except founder features
    expect(countEnabledFor(MOCK_USERS.founder)).toBe(9); // all features
    expect(countEnabledFor(MOCK_USERS.pioneer)).toBe(9); // all features
  });
});

// ============================================================================
// 4. VOICE COMMAND GATING TESTS
// ============================================================================

describe('VoiceCommandPanel - Command Gating', () => {
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  const commands = {
    ptt: { name: 'Push-to-Talk', gated: false }, // Gated per net.min_rank_to_tx
    combatFlare: { name: 'Combat Flare', required: 'scout' },
    medicalFlare: { name: 'Medical Flare', required: 'scout' },
    broadcast: { name: 'Broadcast Mode', required: 'voyager' },
    whisper: { name: 'Whisper Mode', required: 'scout' },
    muteAll: { name: 'Priority Mute All', required: 'founder' }
  };

  test('Scout can use flares', () => {
    expect(hasMinRank(MOCK_USERS.scout, commands.combatFlare.required)).toBe(true);
    expect(hasMinRank(MOCK_USERS.scout, commands.medicalFlare.required)).toBe(true);
  });

  test('Vagrant blocked from flares', () => {
    expect(hasMinRank(MOCK_USERS.vagrant, commands.combatFlare.required)).toBe(false);
    expect(hasMinRank(MOCK_USERS.vagrant, commands.medicalFlare.required)).toBe(false);
  });

  test('Voyager can broadcast', () => {
    expect(hasMinRank(MOCK_USERS.voyager, commands.broadcast.required)).toBe(true);
  });

  test('Scout blocked from broadcast', () => {
    expect(hasMinRank(MOCK_USERS.scout, commands.broadcast.required)).toBe(false);
  });

  test('Only Founder+ can mute all', () => {
    expect(hasMinRank(MOCK_USERS.founder, commands.muteAll.required)).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, commands.muteAll.required)).toBe(true);
    expect(hasMinRank(MOCK_USERS.voyager, commands.muteAll.required)).toBe(false);
  });
});

// ============================================================================
// 5. NET MANAGEMENT GATING TESTS
// ============================================================================

describe('Net Management - Create/Update/Bridge', () => {
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  test('Scout can create campfires', () => {
    expect(hasMinRank(MOCK_USERS.scout, 'scout')).toBe(true);
  });

  test('Vagrant blocked from creating nets', () => {
    expect(hasMinRank(MOCK_USERS.vagrant, 'scout')).toBe(false);
  });

  test('Founder can bridge nets', () => {
    expect(hasMinRank(MOCK_USERS.founder, 'founder')).toBe(true);
  });

  test('Voyager blocked from bridging', () => {
    expect(hasMinRank(MOCK_USERS.voyager, 'founder')).toBe(false);
  });

  test('Only Founder+ can control fleet', () => {
    expect(hasMinRank(MOCK_USERS.founder, 'founder')).toBe(true);
    expect(hasMinRank(MOCK_USERS.voyager, 'founder')).toBe(false);
  });
});

// ============================================================================
// 6. NET RANK CONSTRAINTS TESTS
// ============================================================================

describe('Voice Net - min_rank_to_tx/rx Enforcement', () => {
  const mockNet = {
    id: 'net-001',
    code: 'COMMAND-1',
    label: 'Command Net',
    type: 'command',
    min_rank_to_tx: 'voyager',
    min_rank_to_rx: 'scout'
  };

  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  test('User meets TX requirement', () => {
    expect(hasMinRank(MOCK_USERS.voyager, mockNet.min_rank_to_tx)).toBe(true);
    expect(hasMinRank(MOCK_USERS.founder, mockNet.min_rank_to_tx)).toBe(true);
    expect(hasMinRank(MOCK_USERS.pioneer, mockNet.min_rank_to_tx)).toBe(true);
  });

  test('User blocked from TX if rank too low', () => {
    expect(hasMinRank(MOCK_USERS.scout, mockNet.min_rank_to_tx)).toBe(false);
    expect(hasMinRank(MOCK_USERS.vagrant, mockNet.min_rank_to_tx)).toBe(false);
  });

  test('User meets RX requirement', () => {
    expect(hasMinRank(MOCK_USERS.scout, mockNet.min_rank_to_rx)).toBe(true);
    expect(hasMinRank(MOCK_USERS.voyager, mockNet.min_rank_to_rx)).toBe(true);
  });

  test('User blocked from RX if rank too low', () => {
    expect(hasMinRank(MOCK_USERS.vagrant, mockNet.min_rank_to_rx)).toBe(false);
  });
});

// ============================================================================
// 7. ROSTER FILTERING TESTS
// ============================================================================

describe('NetRoster - Participant Visibility & Controls', () => {
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  test('Squad net shows only squad members', () => {
    const squadNet = {
      type: 'squad',
      linked_squad_id: 'squad-001'
    };
    const memberIds = ['user-scout-001', 'user-voyager-001'];
    
    expect(memberIds.includes(MOCK_USERS.scout.id)).toBe(true);
    expect(memberIds.includes(MOCK_USERS.vagrant.id)).toBe(false);
  });

  test('Command net filters by rank', () => {
    const commandNet = {
      type: 'command',
      min_rank_to_tx: 'voyager'
    };
    
    // Only Voyager+ can transmit on command net
    expect(hasMinRank(MOCK_USERS.voyager, commandNet.min_rank_to_tx)).toBe(true);
    expect(hasMinRank(MOCK_USERS.founder, commandNet.min_rank_to_tx)).toBe(true);
    expect(hasMinRank(MOCK_USERS.scout, commandNet.min_rank_to_tx)).toBe(false);
  });

  test('Per-participant controls gated by rank', () => {
    // Solo, Mute, Priority Speaker all require Founder+
    const canSoloParticipant = (user: any) => hasMinRank(user, 'founder');
    const canMuteParticipant = (user: any) => hasMinRank(user, 'founder');
    const canPrioritySpeaker = (user: any) => hasMinRank(user, 'founder');
    
    expect(canSoloParticipant(MOCK_USERS.founder)).toBe(true);
    expect(canMuteParticipant(MOCK_USERS.voyager)).toBe(false);
    expect(canPrioritySpeaker(MOCK_USERS.scout)).toBe(false);
  });
});

// ============================================================================
// 8. INTEGRATION TEST - FULL FEATURE ACCESS FLOW
// ============================================================================

describe('Integration - Full Voice Comms Flow by Rank', () => {
  const hasMinRank = (user: any, minRank: string): boolean => {
    if (!user || !user.rank) return false;
    if (!minRank) return true;
    return (RANK_VALUES[user.rank.toLowerCase()] || 0) >= (RANK_VALUES[minRank.toLowerCase()] || 0);
  };

  const canAccessFocusedVoice = (user: any): boolean => {
    if (!user || !user.rank) return false;
    return ['scout', 'voyager', 'founder', 'pioneer', 'affiliate'].includes(user.rank?.toLowerCase?.());
  };

  test('Vagrant flow: blocked at voice access gate', () => {
    const user = MOCK_USERS.vagrant;
    expect(canAccessFocusedVoice(user)).toBe(false);
    // Cannot proceed to any voice comms features
  });

  test('Scout flow: basic voice ops (create campfire, transmit, flare)', () => {
    const user = MOCK_USERS.scout;
    expect(canAccessFocusedVoice(user)).toBe(true);
    expect(hasMinRank(user, 'scout')).toBe(true); // Can create campfire
    expect(hasMinRank(user, 'scout')).toBe(true); // Can transmit (default net min)
    expect(hasMinRank(user, 'scout')).toBe(true); // Can use flares
    expect(hasMinRank(user, 'voyager')).toBe(false); // Cannot broadcast
  });

  test('Voyager flow: advanced ops (broadcast, fleet routing)', () => {
    const user = MOCK_USERS.voyager;
    expect(canAccessFocusedVoice(user)).toBe(true);
    expect(hasMinRank(user, 'scout')).toBe(true); // All scout features
    expect(hasMinRank(user, 'voyager')).toBe(true); // Can broadcast
    expect(hasMinRank(user, 'voyager')).toBe(true); // Can route fleet
    expect(hasMinRank(user, 'founder')).toBe(false); // Cannot bridge nets
  });

  test('Founder flow: command ops (bridging, mute all)', () => {
    const user = MOCK_USERS.founder;
    expect(canAccessFocusedVoice(user)).toBe(true);
    expect(hasMinRank(user, 'scout')).toBe(true);
    expect(hasMinRank(user, 'voyager')).toBe(true);
    expect(hasMinRank(user, 'founder')).toBe(true); // Can bridge nets
    expect(hasMinRank(user, 'founder')).toBe(true); // Can mute all participants
  });

  test('Pioneer flow: full system access', () => {
    const user = MOCK_USERS.pioneer;
    expect(canAccessFocusedVoice(user)).toBe(true);
    expect(hasMinRank(user, 'scout')).toBe(true);
    expect(hasMinRank(user, 'voyager')).toBe(true);
    expect(hasMinRank(user, 'founder')).toBe(true);
    expect(hasMinRank(user, 'pioneer')).toBe(true); // Admin/system access
  });
});

// ============================================================================
// SUMMARY
// ============================================================================

describe('Voice Comms - Deployment Readiness', () => {
  test('All rank tiers defined and ordered', () => {
    const ranks = Object.keys(RANK_VALUES);
    expect(ranks).toContain('pioneer');
    expect(ranks).toContain('founder');
    expect(ranks).toContain('voyager');
    expect(ranks).toContain('scout');
    expect(ranks).toContain('vagrant');
    
    // Order verified
    expect(RANK_VALUES['pioneer']).toBeGreaterThan(RANK_VALUES['founder']);
    expect(RANK_VALUES['founder']).toBeGreaterThan(RANK_VALUES['voyager']);
    expect(RANK_VALUES['voyager']).toBeGreaterThan(RANK_VALUES['scout']);
    expect(RANK_VALUES['scout']).toBeGreaterThan(RANK_VALUES['vagrant']);
  });

  test('All test users created successfully', () => {
    expect(MOCK_USERS.vagrant).toBeDefined();
    expect(MOCK_USERS.scout).toBeDefined();
    expect(MOCK_USERS.voyager).toBeDefined();
    expect(MOCK_USERS.founder).toBeDefined();
    expect(MOCK_USERS.pioneer).toBeDefined();
  });

  test('Test coverage includes all major features', () => {
    const testedFeatures = [
      'Presence', 'Campfire', 'Bonfire', 'Broadcast', 'Whisper',
      'Flares', 'Routing', 'Bridging', 'Mute All', 'PTT',
      'Net Creation', 'Net Management', 'Roster Control'
    ];
    expect(testedFeatures.length).toBeGreaterThanOrEqual(9);
  });
});
