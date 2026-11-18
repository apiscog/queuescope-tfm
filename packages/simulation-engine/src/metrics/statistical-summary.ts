import {
  StatisticalSummarySchema,
  type StatisticalSummary,
} from '@queuescope/contracts';

export function calculateStatisticalSummary(
  values: readonly number[],
): StatisticalSummary {
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError('Metric samples must be finite and non-negative');
  }

  if (values.length === 0) {
    return StatisticalSummarySchema.parse({
      sampleSize: 0,
      mean: null,
      median: null,
      p95: null,
      maximum: null,
    });
  }

  const orderedValues = values.toSorted((left, right) => left - right);
  const sum = orderedValues.reduce((total, value) => total + value, 0);
  const middleIndex = Math.floor(orderedValues.length / 2);
  const middleValue = orderedValues[middleIndex];
  if (middleValue === undefined) {
    throw new Error('Non-empty metric sample must contain a middle value');
  }

  const median =
    orderedValues.length % 2 === 1
      ? middleValue
      : ((orderedValues[middleIndex - 1] ?? middleValue) + middleValue) / 2;
  const p95Index = Math.ceil(0.95 * orderedValues.length) - 1;
  const p95 = orderedValues[p95Index];
  const maximum = orderedValues.at(-1);
  if (p95 === undefined || maximum === undefined) {
    throw new Error('Non-empty metric sample must contain percentile values');
  }

  return StatisticalSummarySchema.parse({
    sampleSize: orderedValues.length,
    mean: sum / orderedValues.length,
    median,
    p95,
    maximum,
  });
}
