# Motor de simulació amb temps virtual

## Objectiu i abast

El paquet `@queuescope/simulation-engine` executa escenaris sintètics amb temps virtual. FIFO es va implementar com a primera política i el motor produeix un resultat individual per tasca. Les polítiques incorporades posteriorment es descriuen a `docs/architecture/scheduling-policies.md`. El motor encara no calcula mètriques agregades.

El motor és un mòdul TypeScript independent. Només depèn dels contractes compartits i no importa NestJS, React, clients de base de dades ni tipus HTTP.

## Estructura

```text
packages/simulation-engine/src/
├── domain/
│   ├── engine-run-result.ts
│   └── worker-state.ts
├── events/
│   ├── future-event-queue.ts
│   └── simulation-event.ts
├── policies/
│   ├── fifo-policy.ts
│   └── scheduling-policy.ts
├── simulation/
│   └── simulation-engine.ts
└── index.ts
```

`SimulationEngine` conté el bucle central i rep una implementació de `SchedulingPolicy`. Per tant, el bucle no incorpora condicions específiques de FIFO. `FifoPolicy` selecciona la tasca pendent segons l'arribada, la seqüència d'inserció i l'identificador.

## Temps virtual i esdeveniments

La simulació no utilitza temporitzadors ni esperes reals. `FutureEventQueue` manté els esdeveniments ordenats i el rellotge avança directament fins al següent instant rellevant.

Hi ha dos tipus d'esdeveniment:

- `task-arrival` incorpora una tasca a la llista de tasques disponibles.
- `task-completion` allibera el worker i produeix el resultat de la tasca.

Els esdeveniments del mateix instant es processen com un lot. Primer es registren les finalitzacions, després les arribades i finalment s'assignen les tasques disponibles. Això permet que els workers que acaben i les tasques que arriben en el mateix `tick` participin en la nova decisió.

```text
següent lot d'esdeveniments
          │
          ▼
avançar el temps virtual
          │
          ├── processar finalitzacions
          ├── processar arribades
          └── assignar tasques a workers lliures
                         │
                         ▼
              programar finalitzacions
```

Una tasca de durada zero programa la seva finalització en el mateix instant. El bucle processa aquest nou esdeveniment abans d'avançar el rellotge, sense crear una espera real ni un bucle infinit.

## Estats i invariants

Cada tasca recorre aquests estats interns:

```text
scheduled → ready → active → completed
```

El motor comprova les transicions i aquestes invariants:

- una tasca només arriba si estava programada
- la política només pot seleccionar una tasca disponible
- una tasca no comença abans de l'arribada
- un worker només finalitza la tasca que té activa
- tots els workers queden lliures al final
- totes les tasques queden completades al final

La suma de l'instant d'inici i la durada també ha de continuar dins del rang d'enters segurs de JavaScript.

## Workers i determinisme

Els workers es creen com `worker-1`, `worker-2` i així successivament. Quan n'hi ha més d'un de lliure, l'assignació segueix aquest ordre estable.

La cua d'esdeveniments ordena per temps, tipus d'esdeveniment, seqüència de tasca, identificador i índex de worker quan correspon. El resultat final s'ordena per la seqüència original de la tasca. Aquestes regles garanteixen que dues execucions amb la mateixa entrada produeixin el mateix resultat.

El motor valida l'entrada amb `RunInputSchema` i treballa amb estat intern propi. No modifica l'escenari rebut.

## Resultat de la fase

`EngineRunResult` conté les dades de l'execució i un `TaskResult` per tasca:

```text
EngineRunResult
├── runId
├── scenarioId
├── policy
├── engineVersion
└── taskResults[]
```

Les mètriques agregades del contracte final es calcularan en una fase posterior. Aquesta separació evita avançar funcionalitat i conserva les mesures individuals necessàries per verificar els càlculs futurs.

## Verificació

Les proves cobreixen la cua d'esdeveniments, la política i el motor complet. Inclouen l'escenari buit, una tasca, arribades simultànies, més tasques que workers, workers ociosos, durades zero, determinisme, immutabilitat i absència de solapaments per worker.

El motor també llegeix l'escenari i el resultat manual de `docs/examples/`. FIFO reprodueix exactament els temps d'inici, finalització, espera i turnaround calculats abans de la implementació.
