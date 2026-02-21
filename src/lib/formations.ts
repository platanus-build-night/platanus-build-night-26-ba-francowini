import type { FormationCode, FormationDefinition, FormationSlots } from "@/types";

/**
 * All supported formations.
 * Each formation defines exactly 11 starter slots split across positions.
 * GK is always 1 for every formation.
 */
export const FORMATIONS: Record<FormationCode, FormationDefinition> = {
  "4-3-3": {
    code: "4-3-3",
    label: "4-3-3",
    slots: { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  },
  "4-4-2": {
    code: "4-4-2",
    label: "4-4-2",
    slots: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  },
  "3-5-2": {
    code: "3-5-2",
    label: "3-5-2",
    slots: { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  },
  "3-4-3": {
    code: "3-4-3",
    label: "3-4-3",
    slots: { GK: 1, DEF: 3, MID: 4, FWD: 3 },
  },
  "4-5-1": {
    code: "4-5-1",
    label: "4-5-1",
    slots: { GK: 1, DEF: 4, MID: 5, FWD: 1 },
  },
  "5-3-2": {
    code: "5-3-2",
    label: "5-3-2",
    slots: { GK: 1, DEF: 5, MID: 3, FWD: 2 },
  },
  "5-4-1": {
    code: "5-4-1",
    label: "5-4-1",
    slots: { GK: 1, DEF: 5, MID: 4, FWD: 1 },
  },
};

export const FORMATION_CODES = Object.keys(FORMATIONS) as FormationCode[];

export const MAX_SQUAD_SIZE = 18;
export const MAX_STARTERS = 11;
export const MAX_BENCH = 7;
export const STARTING_BUDGET = 150; // $150M
export const SELL_TAX_RATE = 0.1; // 10% sell tax

/**
 * Get the formation slot requirements for starters.
 * Returns null if the formation code is not supported.
 */
export function getFormationSlots(code: string): FormationSlots | null {
  return FORMATIONS[code as FormationCode]?.slots ?? null;
}

/**
 * Check if a formation code is valid.
 */
export function isValidFormation(code: string): code is FormationCode {
  return code in FORMATIONS;
}
