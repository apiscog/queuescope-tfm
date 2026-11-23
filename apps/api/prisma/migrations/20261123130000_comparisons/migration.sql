-- CreateTable
CREATE TABLE "comparisons" (
    "id" VARCHAR(100) NOT NULL,
    "scenarioId" VARCHAR(100) NOT NULL,
    "scenarioSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" VARCHAR(100) NOT NULL,
    "comparisonId" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "policy" JSONB NOT NULL,
    "engineVersion" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3) NOT NULL,
    "metrics" JSONB NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_task_results" (
    "runId" VARCHAR(100) NOT NULL,
    "taskId" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "workerId" VARCHAR(100) NOT NULL,
    "initialPriority" INTEGER NOT NULL,
    "arrivalTime" BIGINT NOT NULL,
    "serviceStartTime" BIGINT NOT NULL,
    "completionTime" BIGINT NOT NULL,
    "waitingTime" BIGINT NOT NULL,
    "turnaroundTime" BIGINT NOT NULL,

    CONSTRAINT "run_task_results_pkey" PRIMARY KEY ("runId","taskId")
);

-- CreateIndex
CREATE INDEX "comparisons_scenarioId_createdAt_idx" ON "comparisons"("scenarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "runs_comparisonId_sequence_key" ON "runs"("comparisonId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "run_task_results_runId_sequence_key" ON "run_task_results"("runId", "sequence");

-- AddForeignKey
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_task_results" ADD CONSTRAINT "run_task_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
