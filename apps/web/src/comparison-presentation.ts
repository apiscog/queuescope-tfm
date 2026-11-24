import type { PolicyConfiguration, PolicyId } from '@queuescope/contracts';

import { colors } from './theme';

export const policyColors: Record<PolicyId, string> = {
  fifo: colors.fifo,
  'strict-priority': colors.priority,
  'priority-aging': colors.aging,
};

export function policyName(policy: PolicyConfiguration): string {
  if (policy.id === 'fifo') return 'FIFO';
  if (policy.id === 'strict-priority') return 'Prioritat estricta';
  return `Prioritat amb envelliment (${policy.agingInterval} ticks)`;
}
