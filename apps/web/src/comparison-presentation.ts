import type { PolicyConfiguration, PolicyId } from '@queuescope/contracts';

export const policyColors: Record<PolicyId, string> = {
  fifo: '#1565c0',
  'strict-priority': '#b54708',
  'priority-aging': '#7b1fa2',
};

export function policyName(policy: PolicyConfiguration): string {
  if (policy.id === 'fifo') return 'FIFO';
  if (policy.id === 'strict-priority') return 'Prioritat estricta';
  return `Prioritat amb envelliment (${policy.agingInterval} ticks)`;
}
