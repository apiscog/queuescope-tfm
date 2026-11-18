import {
  compareSimulationEvents,
  type SimulationEvent,
} from './simulation-event.js';

export class FutureEventQueue {
  readonly #events: SimulationEvent[] = [];

  get isEmpty(): boolean {
    return this.#events.length === 0;
  }

  get size(): number {
    return this.#events.length;
  }

  enqueue(event: SimulationEvent): void {
    let lowerBound = 0;
    let upperBound = this.#events.length;

    while (lowerBound < upperBound) {
      const midpoint = Math.floor((lowerBound + upperBound) / 2);
      const midpointEvent = this.#events[midpoint];

      if (
        midpointEvent !== undefined &&
        compareSimulationEvents(midpointEvent, event) <= 0
      ) {
        lowerBound = midpoint + 1;
      } else {
        upperBound = midpoint;
      }
    }

    this.#events.splice(lowerBound, 0, event);
  }

  dequeueNextBatch(): readonly SimulationEvent[] {
    const firstEvent = this.#events.shift();
    if (firstEvent === undefined) {
      return [];
    }

    const batch: SimulationEvent[] = [firstEvent];
    while (this.#events[0]?.time === firstEvent.time) {
      const event = this.#events.shift();
      if (event !== undefined) {
        batch.push(event);
      }
    }

    return batch;
  }
}
