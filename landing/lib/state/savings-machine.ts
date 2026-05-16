/** Pure synchronous savings calculator state. */
export type Tier = 'mini' | 'mk2' | 'plus' | 'xl';

export const TIER_PRICES: Record<Tier, number> = {
  mini: 99,
  mk2: 169,
  plus: 249,
  xl: 279,
};

export type State = {
  devices: number;
  tier: Tier;
};

export type Event =
  | { type: 'SET_DEVICES'; value: number }
  | { type: 'SET_TIER'; value: Tier };

export const initial: State = { devices: 3, tier: 'mk2' };

export function reducer(state: State, event: Event): State {
  switch (event.type) {
    case 'SET_DEVICES':
      return { ...state, devices: Math.max(1, Math.min(20, Math.round(event.value))) };
    case 'SET_TIER':
      return { ...state, tier: event.value };
    default:
      return state;
  }
}

export function computeTotal(state: State): number {
  return state.devices * TIER_PRICES[state.tier];
}
