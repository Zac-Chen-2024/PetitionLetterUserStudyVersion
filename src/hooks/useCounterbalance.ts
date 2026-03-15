import { useMemo } from 'react';
import type { CounterbalanceConfig } from '../types/index.ts';

// All 6 permutations of 3 items
const PERMUTATIONS: number[][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

const PHASE2_CONDITIONS = [
  ['conditionA', 'conditionB'],
  ['conditionB', 'conditionA'],
];

/**
 * Deterministic counterbalance based on participant ID.
 * Hashes the ID string to a numeric seed, then selects permutations.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function useCounterbalance(participantId: string): CounterbalanceConfig {
  return useMemo(() => {
    const seed = hashString(participantId);
    const phase1Index = seed % PERMUTATIONS.length;
    const phase2Index = seed % PHASE2_CONDITIONS.length;

    return {
      phase1ColumnOrder: PERMUTATIONS[phase1Index],
      phase2ConditionOrder: PHASE2_CONDITIONS[phase2Index],
      seed,
    };
  }, [participantId]);
}
