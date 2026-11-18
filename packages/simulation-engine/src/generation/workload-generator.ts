import {
  GenerateScenarioInputSchema,
  ScenarioSchema,
  type GenerateScenarioInput,
  type Scenario,
  type TaskDefinition,
} from '@queuescope/contracts';

import { compareIdentifiers } from '../domain/compare-identifiers.js';
import { SeededRandom } from './seeded-random.js';

interface GeneratedTaskWithoutSequence {
  readonly id: string;
  readonly type: string;
  readonly arrivalTime: number;
  readonly serviceDuration: number;
  readonly initialPriority: number;
}

function selectTaskType(
  random: SeededRandom,
  taskTypes: readonly string[],
): string {
  const selectedIndex = random.nextInteger(0, taskTypes.length - 1);
  const selectedType = taskTypes[selectedIndex];
  if (selectedType === undefined) {
    throw new Error('Validated task type list cannot be empty');
  }
  return selectedType;
}

export function generateScenario(input: GenerateScenarioInput): Scenario {
  const validatedInput = GenerateScenarioInputSchema.parse(input);
  const { parameters } = validatedInput;
  const random = new SeededRandom(parameters.seed);
  const identifierWidth = Math.max(4, String(parameters.taskCount).length);
  const generatedTasks: GeneratedTaskWithoutSequence[] = [];

  for (let index = 0; index < parameters.taskCount; index += 1) {
    generatedTasks.push({
      id: `task-${String(index + 1).padStart(identifierWidth, '0')}`,
      type: selectTaskType(random, parameters.taskTypes),
      arrivalTime: random.nextInteger(
        parameters.arrivalTimeRange.minimum,
        parameters.arrivalTimeRange.maximum,
      ),
      serviceDuration: random.nextInteger(
        parameters.serviceDurationRange.minimum,
        parameters.serviceDurationRange.maximum,
      ),
      initialPriority: random.nextInteger(
        parameters.priorityRange.minimum,
        parameters.priorityRange.maximum,
      ),
    });
  }

  const tasks: TaskDefinition[] = generatedTasks
    .toSorted(
      (left, right) =>
        left.arrivalTime - right.arrivalTime ||
        compareIdentifiers(left.id, right.id),
    )
    .map((task, sequence) => ({ ...task, sequence }));

  return ScenarioSchema.parse({
    id: validatedInput.id,
    name: validatedInput.name,
    timeUnit: 'tick',
    workers: { count: parameters.workerCount },
    tasks,
    source: {
      kind: 'generated',
      parameters,
    },
    createdAt: validatedInput.createdAt,
  });
}
