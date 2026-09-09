/**
 * AuraFit Unified Gamification & Achievement Engine
 * Universal XP calculations, Badge registry, and Boss Quest state machines.
 */

export const BADGE_TIERS = {
  bronze: { label: 'Bronze', color: '#cd7f32', border: 'rgba(205, 127, 50, 0.4)' },
  silver: { label: 'Silver', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
  gold: { label: 'Gold', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)' },
  diamond: { label: 'Diamond', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.5)' }
};

export const BADGES_REGISTRY = [
  // Physical & Vision Badges
  {
    id: 'b_iron_posture',
    title: 'Iron Posture',
    desc: 'Complete an AI Camera session with > 90% form accuracy.',
    category: 'physical',
    tier: 'bronze',
    icon: 'ShieldCheck',
    xpAward: 50,
    checkUnlocked: (profile) => (profile?.squatCount || 0) >= 10
  },
  {
    id: 'b_centurion_reps',
    title: 'Centurion Reps',
    desc: 'Log over 100 verified AI Camera reps across all sessions.',
    category: 'physical',
    tier: 'silver',
    icon: 'Dumbbell',
    xpAward: 100,
    checkUnlocked: (profile) => (profile?.squatCount || 0) >= 100
  },
  {
    id: 'b_titan_slayer',
    title: 'Titan Slayer',
    desc: 'Defeat the Fatigue Titan Boss in the Gaming Arena.',
    category: 'arena',
    tier: 'gold',
    icon: 'Swords',
    xpAward: 200,
    checkUnlocked: () => {
      return localStorage.getItem('aurafit_boss_defeated') === 'true';
    }
  },

  // Mental Wellness Badges
  {
    id: 'b_zen_monk',
    title: 'Zen Monk',
    desc: 'Complete your first 4-4-4-4 Box Breathing or Pranayama session.',
    category: 'mental',
    tier: 'bronze',
    icon: 'HeartPulse',
    xpAward: 40,
    checkUnlocked: () => {
      return localStorage.getItem('aurafit_meditation_done') === 'true';
    }
  },
  {
    id: 'b_mudra_scholar',
    title: 'Mudra Scholar',
    desc: 'Complete a guided 15-minute Mudra hold practice.',
    category: 'mental',
    tier: 'silver',
    icon: 'Sparkles',
    xpAward: 75,
    checkUnlocked: () => {
      return localStorage.getItem('aurafit_mudra_done') === 'true';
    }
  },

  // Cognitive Chess Badges
  {
    id: 'b_tactical_sniper',
    title: 'Tactical Sniper',
    desc: 'Solve 3 Tactical Chess Puzzles with zero blunders.',
    category: 'chess',
    tier: 'bronze',
    icon: 'Brain',
    xpAward: 60,
    checkUnlocked: () => {
      const chess = localStorage.getItem('aurafit_chess_profile');
      if (chess) {
        try { return JSON.parse(chess).puzzlesSolved >= 3; } catch (e) {}
      }
      return false;
    }
  },
  {
    id: 'b_grandmaster_mind',
    title: 'Grandmaster Mind',
    desc: 'Attain a dynamic Chess Elo rating of 1300+.',
    category: 'chess',
    tier: 'gold',
    icon: 'Crown',
    xpAward: 150,
    checkUnlocked: () => {
      const chess = localStorage.getItem('aurafit_chess_profile');
      if (chess) {
        try { return JSON.parse(chess).elo >= 1300; } catch (e) {}
      }
      return false;
    }
  },

  // Consistency & Daily Streak Badges
  {
    id: 'b_7day_titan',
    title: '7-Day Titan',
    desc: 'Maintain an active daily workout and wellness streak for 7 consecutive days.',
    category: 'streak',
    tier: 'gold',
    icon: 'Flame',
    xpAward: 150,
    checkUnlocked: (profile) => (profile?.currentStreak || 7) >= 7
  },
  {
    id: 'b_unstoppable_aura',
    title: 'Unstoppable Aura',
    desc: 'Surpass 500 total Aura XP across physical, mental, and cognitive chambers.',
    category: 'streak',
    tier: 'diamond',
    icon: 'Trophy',
    xpAward: 300,
    checkUnlocked: (profile) => (profile?.totalPoints || 0) >= 500
  }
];

export const GHOST_ATHLETES = [
  {
    id: 'g1',
    name: 'Aarav (CSE Champ Ghost)',
    department: 'CSE',
    targetReps60s: 22,
    avatarColor: '#10b981',
    desc: 'Campus record holder with explosive squat cadence.'
  },
  {
    id: 'g2',
    name: 'Priya (ECE Speedster Ghost)',
    department: 'ECE',
    targetReps60s: 26,
    avatarColor: '#06b6d4',
    desc: 'Rapid push-up and jumping jack champion.'
  },
  {
    id: 'g3',
    name: 'Vikram (Mech Titan Ghost)',
    department: 'MECH',
    targetReps60s: 30,
    avatarColor: '#f59e0b',
    desc: 'Unrelenting endurance specialist.'
  }
];
