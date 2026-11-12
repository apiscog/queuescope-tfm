# AGENTS.md

## Purpose

This repository contains the implementation of the Master's Final Project of
Andres Pisco Granda for the Master's Degree in Computer Engineering at the UOC.

The product is a web platform for defining synthetic workloads and comparing
scheduling policies for asynchronous backend tasks under controlled and
reproducible conditions.

PAC1 defined the approved proposal and PAC2 established the state of the art.
PAC3 requires:

- a ZIP file containing all material generated during product development,
  including source code, tests, images and user documentation
- a 2 to 5 minute MP4 demonstration of the developed product

The immediate objective is a complete, demonstrable vertical slice. Optional
features must never endanger the delivery of a functional prototype.

## Product boundaries

The platform must allow a user to:

1. create or select a synthetic workload scenario
2. configure tasks and the number of available workers
3. choose two or more scheduling policies
4. execute every selected policy against an equivalent immutable workload
5. persist the scenario, execution parameters and results
6. inspect and compare a concise set of metrics in a web interface

The minimum policies are:

- FIFO as the baseline
- strict priority
- priority with aging

The simulator uses synthetic data only. Do not connect it to real businesses,
public websites or production queues.

Do not introduce Citta, administrative appointments, scraping, bots, CAPTCHAs
or automation of public websites.

## Scope priorities

Implement the following end-to-end flow before optional work:

```text
scenario definition
  -> workload validation
  -> run the same workload with selected policies
  -> calculate metrics
  -> persist execution and results
  -> compare results in the web UI
```

The web platform is the product. The simulation engine is an internal backend
component, not a general-purpose simulation framework.

Keep the synthetic workload generator bounded. The minimum configuration is:

- task count or an explicit task list
- arrival time
- estimated duration
- task type
- initial priority
- worker count
- deterministic random seed when generation uses randomness

Keep visualization focused. Prioritize:

- a comparison summary table
- average, median, p95 and maximum waiting time
- completed task count
- throughput
- worker utilization
- results grouped by priority
- at most a few charts that materially help interpretation

The following are optional until the complete minimum flow works:

- failures, retries and backoff
- advanced arrival or duration distributions
- imports from external systems
- real-time dashboards
- user-defined dashboards
- advanced statistical analysis
- authentication and multi-user permissions
- BullMQ, RabbitMQ or n8n integrations
- deployment orchestration beyond the local reproducible environment

## Planned technology stack

Use this concrete TypeScript-first stack unless a verified incompatibility
requires a documented change:

- Node.js 24 LTS, pinned in `.nvmrc`, `.node-version` and `package.json`
- npm workspaces with one committed `package-lock.json`
- TypeScript in strict mode for backend, frontend and simulation engine
- NestJS for the REST API and application modules
- OpenAPI/Swagger generated from the NestJS API
- React with TypeScript and Vite for the single-page web application
- React Router for the four initial application routes
- Material UI for accessible layout, forms, tables and feedback components
- React Hook Form and Zod for client-side forms and validation
- TanStack Query for server state, requests, loading and error handling
- Recharts for a small number of comparison charts
- PostgreSQL for scenarios, comparisons, runs and metrics
- Prisma for schema definition, type-safe persistence and migrations
- Docker Compose with PostgreSQL for reproducible local development
- Vitest for the framework-independent engine
- Jest or Vitest with Supertest for API integration tests
- Testing Library for React component behavior
- Playwright for the minimum end-to-end demonstration path
- GitHub Actions for linting, type checking, tests and builds

Do not add Redis, BullMQ, RabbitMQ, n8n, Kubernetes or microservices merely to
make the architecture appear more advanced. Add infrastructure only when it
solves a requirement that exists in the approved scope.

Do not add Next.js, server-side rendering or Redux to the initial architecture.
The application does not require SEO or complex global client state. Reconsider
these decisions only if a later requirement clearly needs them.

## Hosting and deployment

Use this deployment topology for the PAC3 prototype:

```text
browser
  -> React/Vite static frontend on Vercel Hobby
  -> NestJS REST API on a Render Free Web Service in Frankfurt
  -> Neon Free managed PostgreSQL in a nearby European region
```

The expected cost is zero while the academic project remains within the free
allowances. Free plans can change and do not provide production availability
guarantees. Recheck their official limits before final deployment and before
recording the demonstration.

Deployment responsibilities:

- GitHub stores the monorepo and runs continuous integration.
- Vercel builds `apps/web` and exposes the static frontend through HTTPS.
- Render builds and runs `apps/api` as one Node.js web service.
- Neon stores persistent relational data. Do not use Render Free Postgres for
  the final PAC3 database because free Render databases currently expire.
- Use the free provider subdomains. A custom domain is not required.

Known free-tier behavior must be reflected in the product and demonstration:

- Render can suspend the API after inactivity and the first request can take
  approximately one minute while it starts again.
- Neon can scale compute to zero and add a short delay to the first database
  operation.
- Wake the API through `/health` before recording the video.
- Show a clear loading state instead of reporting a cold start as an error.
- Never use provider cold-start latency as a simulation performance result.

Keep local development independent from cloud availability. Run PostgreSQL in
Docker Compose and run the API and web development servers directly with Node.

Use these local endpoints unless a conflict requires a documented change:

```text
web:      http://localhost:5173
api:      http://localhost:3000
swagger:  http://localhost:3000/docs
postgres: localhost:5432
```

Use environment variables with this separation:

```text
Backend:  DATABASE_URL, DIRECT_URL, CORS_ORIGIN, PORT,
          MAX_SCENARIO_TASKS, NODE_ENV
Frontend: VITE_API_URL
```

`DATABASE_URL` must use Neon's pooled runtime connection. `DIRECT_URL` must use
the direct connection required by Prisma migrations. Store both only in local
ignored environment files and provider secret settings. Variables prefixed
with `VITE_` are public browser configuration and must never contain secrets.

Allow CORS only from the local Vite origin in development and the deployed
Vercel origin in production. The API must expose `/health` for deployment and
demonstration checks.

Provider assumptions were last verified on 2026-10-18. Recheck these official
pages before relying on them:

- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Vite deployment on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Render free services: https://render.com/docs/free
- Render regions: https://render.com/docs/regions
- Neon compute behavior: https://neon.com/docs/manage/endpoints/
- Prisma with Neon: https://docs.prisma.io/docs/orm/v6/overview/databases/neon

## Recommended repository structure

Prefer a small monorepo with explicit boundaries:

```text
.
|-- apps/
|   |-- api/                 # NestJS API and application orchestration
|   `-- web/                 # React application
|-- packages/
|   |-- simulation-engine/   # Pure TypeScript domain and virtual-time engine
|   `-- contracts/           # Shared DTO schemas and generated/shared types
|-- docs/
|   |-- architecture/
|   |-- user-guide/
|   `-- demo/
|-- infra/                   # Docker and local infrastructure configuration
|-- scripts/                 # Reproducible development and packaging helpers
|-- docker-compose.yml
|-- package.json
|-- README.md
`-- IMPLEMENTATION_WORKFLOW.md
```

Adapt this layout only when there is a concrete benefit. Avoid adding packages
that contain only one trivial file.

## Architecture rules

Keep these responsibilities separate:

- The simulation engine owns virtual time, tasks, workers, policy selection,
  state transitions, event ordering and raw run results.
- The API owns use cases, validation at system boundaries, persistence,
  comparison orchestration and HTTP concerns.
- The web application owns scenario forms, execution feedback and result
  presentation.
- PostgreSQL owns durable records. It must not become the implementation of the
  scheduling algorithm.

The simulation engine must be a framework-independent TypeScript module. It
must not import NestJS, React, database clients or HTTP types.

Prefer a modular monolith. Do not split the system into independently deployed
services unless a later requirement provides a strong reason.

## Simulation model

Model only the concepts needed to answer the comparison question.

A task should contain at least:

- stable identifier
- type
- arrival time in virtual-time units
- estimated service duration
- initial priority

A scenario should contain at least:

- stable identifier and name
- worker count
- task definitions
- generation parameters and seed, when generated
- creation metadata

A run should record at least:

- scenario snapshot or immutable scenario version
- selected policy and policy parameters
- engine/model version when practical
- start and completion status
- deterministic inputs
- aggregate metrics
- per-task outcome data needed to explain those metrics

Execution is initially non-preemptive: once a worker starts a task, that task
runs until its simulated completion. Do not add interruption or migration
unless the scope is explicitly revised.

Use virtual time. Do not implement simulated duration with `setTimeout`, sleep,
the n8n Wait node or wall-clock delays.

Use a deterministic future-event mechanism. Event ordering must have an
explicit stable tie-break rule so repeated runs produce identical output.

Never mutate the source workload while comparing policies. Create an equivalent
run input for each policy from the same validated scenario snapshot.

## Scheduling policy contract

Scheduling policies must be interchangeable behind one small interface. A
policy selects the next eligible task from the pending tasks using only the
state and parameters explicitly provided to it.

At minimum, define and test:

- FIFO: earliest arrival first, with a stable identifier or insertion order as
  tie-breaker
- strict priority: highest configured priority first, FIFO for equal priority
- aging: effective priority changes as waiting time grows, with a documented
  formula and deterministic tie-breakers

Do not encode policy-specific branches throughout the engine. Adding a policy
should primarily require a new policy implementation and its tests.

Do not state or encode that one policy is universally better. The platform must
expose trade-offs under each scenario.

## Metrics

Define metric formulas and units before implementing presentation logic.

At minimum, consider:

- waiting time = service start time - arrival time
- turnaround time = completion time - arrival time
- throughput = completed tasks / simulated time span
- worker utilization = busy worker time / available worker time
- queue length observations when required for a selected chart
- average, median, p95 and maximum waiting time
- counts and metrics grouped by initial priority

Handle zero-duration scenarios, empty task lists and zero elapsed simulated time
explicitly. Do not hide invalid arithmetic behind default zero values.

Keep raw measurements separate from rounded values used by the UI. Round only
for presentation.

## Synthetic workload generation

Build the simplest useful generator first. It may generate tasks from bounded
ranges for arrivals, durations, types and priorities using a seeded
pseudorandom generator.

Generation must be reproducible: the same parameters and seed must create the
same ordered workload.

Allow explicit task entry or a small predefined scenario if that is the fastest
way to complete the first vertical slice. Advanced probability distributions
are not part of the minimum unless justified by an evaluation scenario.

Validate limits to prevent accidental creation of workloads too large for the
prototype or demonstration.

## API and persistence

Design the API around user actions, not database tables. A minimal API can
support:

- create, list and retrieve scenarios
- validate or preview a generated workload
- create a comparison for selected policies
- retrieve comparison status and results
- retrieve individual run details when needed by the UI

Use explicit request and response schemas. Validate all external input. Keep
database entities and public DTOs separate when their responsibilities differ.

Comparisons may run synchronously while workloads remain intentionally small.
Do not introduce a production job queue before measurements show that it is
necessary for the PAC3 prototype.

Use database migrations. Never depend on manual database edits to run the
project from a clean checkout.

Use a scenario snapshot in every comparison so later scenario edits cannot
change the meaning of an existing result. A practical initial relational model
contains `scenarios`, `scenario_tasks`, `comparisons`, `runs` and
`run_task_results`. Store aggregate run metrics either in a dedicated table or
as a structured run field, choosing the simplest form that supports the actual
queries.

Apply Prisma migrations locally with the direct database URL. In deployment,
run the idempotent production migration command before starting the API. Do not
use schema synchronization that changes production tables without migrations.

## Frontend behavior

The initial UI should contain no more screens than necessary:

1. scenario list or landing page
2. scenario creation/configuration form
3. policy selection and comparison launch
4. comparison results

Use the corresponding initial routes:

```text
/
/scenarios/new
/scenarios/:id
/comparisons/:id
```

The results screen must first provide a readable comparison table. Add charts
only after the table is correct. Every chart needs a title, units, labels and a
clear reason to exist.

Show validation and execution errors in plain language. Do not expose stack
traces, raw SQL errors or internal identifiers as the only user feedback.

Accessibility basics are required: semantic controls, keyboard access, visible
labels, sufficient contrast and no reliance on color alone to distinguish
policies.

Do not spend implementation time on decorative animations or a large design
system before the end-to-end workflow is stable.

## Testing strategy

Testing the engine has higher priority than snapshot-testing presentation.

Required engine tests include:

- empty scenario behavior
- one task and one worker
- simultaneous arrivals
- more tasks than workers
- stable tie-breaking
- FIFO ordering
- strict-priority ordering and equal-priority ties
- aging promotion behavior
- deterministic replay with the same seed
- invariants such as no start before arrival and no overlapping work per worker
- metric calculations with small manually verifiable examples

Required application tests include:

- scenario validation
- comparison orchestration using the same workload for every policy
- persistence and retrieval of results
- at least one API integration path from scenario creation to results
- one frontend end-to-end happy path when feasible

A failing test must be fixed or explicitly explained. Do not weaken assertions
only to make the suite pass.

## Coding standards

- Use strict TypeScript configuration.
- Avoid `any`. If unavoidable at an external boundary, narrow it immediately.
- Prefer small pure functions in the engine.
- Make units visible in names or types when ambiguity is possible.
- Use domain names consistently: scenario, task, worker, policy, run,
  comparison and metric.
- Keep comments for decisions and non-obvious invariants, not line-by-line
  narration.
- Do not commit secrets, credentials, personal data or production datasets.
- Use synthetic fixtures in tests and demonstrations.
- Keep dependencies minimal and justify major additions.
- Run formatting, linting, type checking and relevant tests after meaningful
  changes.

## Documentation language

Code identifiers may be in English. User-facing text and academic/user
documentation for the UOC submission must be written in natural Catalan.

When introducing technical terms in documentation, briefly explain their role
for a non-specialist reader. Preserve academic caution and do not describe
planned or partially implemented behavior as complete.

Do not use semicolons in Catalan prose or table cells.

## Development workflow

Follow `IMPLEMENTATION_WORKFLOW.md`. Work phase by phase and satisfy each exit
criterion before starting optional work from a later phase.

For every meaningful change:

1. inspect existing code and tests
2. state assumptions that affect architecture or scope
3. implement the smallest complete change
4. run formatting, linting, type checking and relevant tests
5. update documentation when behavior or commands change
6. report what was verified and what remains

Do not rewrite unrelated user changes. Do not use destructive Git commands.

## Definition of done for PAC3

PAC3 is technically ready only when:

- a clean checkout can be started with documented commands
- the database can be created through migrations or automated setup
- at least FIFO and strict priority work end to end, with aging strongly
  preferred as the third policy
- the same scenario can be compared across policies
- results and required metrics are persisted and shown in the web interface
- core engine and API tests pass
- the interface provides a stable demonstration path
- the README and user guide match the implemented product
- GitHub Actions passes linting, type checking, tests and builds
- the frontend is available on Vercel, the API on Render and persistent data in
  Neon, or a documented equivalent is used after a justified provider change
- cloud secrets are absent from Git and browser bundles
- cold-start behavior is handled and the demonstration path has been rehearsed
- the repository contains no secrets or unnecessary generated artifacts
- the final ZIP contains all required development material
- a 2 to 5 minute MP4 demonstrates the implemented flow

If time is constrained, reduce optional breadth instead of delivering several
partially working features.

## PAC3 packaging and demonstration

Maintain a short demonstration script in `docs/demo/`. The video should show a
single coherent flow rather than every technical detail:

1. open or create a synthetic scenario
2. show the relevant workload and worker settings
3. select policies
4. launch the comparison
5. explain the key metrics and one visible trade-off

Prepare the ZIP from a clean, verified repository state. Include source code,
lockfiles, migrations, tests, Docker configuration, README, user guide and any
assets needed to run the product. Exclude secrets, dependency directories,
build caches, temporary files and local database volumes.

