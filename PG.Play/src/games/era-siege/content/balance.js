// Era Siege global balance constants. Tunable; see
// docs/ERA_SIEGE_BALANCE_FRAMEWORK.md for design intent.

export const BALANCE = {
  BASE_HP:            1400,
  BASE_HIT_GOLD:      1,        // gold awarded per base-hit damage point
  XP_KILL_RATIO:      0.6,      // bountyXp = bountyGold * 0.6 by default (per unit)
  GOLD_TRICKLE_BASE:  12,       // era 1 gold/sec
  EVOLVE_HEAL_PCT:    0.20,     // % HP refilled on every owned unit at evolve
  TURRET_SLOT_COUNT:  3,        // per side
  MAX_UNITS_PER_SIDE: 40,
  LANE_LEFT_OFFSET:   110,      // px from left edge to player base column
  LANE_RIGHT_OFFSET:  110,      // px from right edge to enemy base column
  GROUND_BOTTOM_PAD:  100,      // px from bottom edge to ground line
  UNIT_REPULSE_PX:    22,       // friendly unit minimum spacing along the lane
  TURRET_ROW_Y_PX:    72,       // turret rack y-offset from base top
  ATTACK_TICK_MS:     600,      // unit melee re-attack baseline (overridden per unit)
  SCORE_MAX:          100,      // matches existing supabase rule for 'aow'
  PARTICLE_CAP:       80,       // hard cap on simultaneous particles (low-effects: 24)
  DAMAGE_NUM_CAP:     24,       // hard cap on simultaneous damage numbers (low-effects: 8)
  TUTORIAL_SPAWN_CT:  3,        // first N spawns trigger tutorial hints
  RESULT_SUBMIT_DELAY_MS: 700,  // brief delay before score submit so the player sees the result
};
