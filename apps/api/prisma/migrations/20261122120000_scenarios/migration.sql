-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "scenarios" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "timeUnit" VARCHAR(20) NOT NULL,
    "workerCount" INTEGER NOT NULL,
    "source" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_tasks" (
    "scenarioId" VARCHAR(100) NOT NULL,
    "id" VARCHAR(100) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "arrivalTime" BIGINT NOT NULL,
    "serviceDuration" BIGINT NOT NULL,
    "initialPriority" INTEGER NOT NULL,

    CONSTRAINT "scenario_tasks_pkey" PRIMARY KEY ("scenarioId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scenario_tasks_scenarioId_sequence_key" ON "scenario_tasks"("scenarioId", "sequence");

-- AddForeignKey
ALTER TABLE "scenario_tasks" ADD CONSTRAINT "scenario_tasks_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
