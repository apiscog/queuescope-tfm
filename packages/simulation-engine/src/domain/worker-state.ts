export interface WorkerState {
  readonly id: string;
  readonly index: number;
  activeTaskId: string | null;
}
