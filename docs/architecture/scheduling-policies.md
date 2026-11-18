# Polítiques de planificació

## Objectiu

El motor admet FIFO, prioritat estricta i prioritat amb envelliment mitjançant el mateix contracte `SchedulingPolicy`. Cada política decideix quina tasca disponible s'ha d'assignar, mentre que `SimulationEngine` conserva la responsabilitat sobre el temps virtual, els esdeveniments, els workers i les transicions d'estat.

```text
                     ┌── FifoPolicy
SchedulingPolicy ────┼── StrictPriorityPolicy
                     └── AgingPolicy
```

La incorporació de les dues polítiques no modifica el bucle d'esdeveniments. La selecció segons la configuració es concentra a `policy-factory.ts`.

## Configuració i execució

Cada implementació exposa la seva configuració completa. El motor comprova que coincideixi amb la configuració del `RunInput`. Aquesta validació és especialment rellevant per a l'envelliment, perquè el resultat ha de registrar el mateix `agingInterval` que s'ha utilitzat per prendre decisions.

`createSchedulingPolicy` valida la configuració amb Zod i crea la implementació corresponent. La funció pública `runSimulation` utilitza aquesta factoria i executa el motor.

```text
RunInput
   │
   ▼
PolicyConfigurationSchema
   │
   ▼
createSchedulingPolicy
   │
   ▼
SimulationEngine.run
```

## FIFO

FIFO selecciona primer la tasca amb l'arribada més antiga. Els desempats utilitzen la seqüència d'inserció i l'identificador ordinal.

```text
arrivalTime ascendent
sequence ascendent
id ascendent
```

## Prioritat estricta

`StrictPriorityPolicy` selecciona la prioritat inicial numèricament més alta. Quan dues tasques tenen la mateixa prioritat, aplica l'ordre FIFO complet.

```text
initialPriority descendent
arrivalTime ascendent
sequence ascendent
id ascendent
```

La política no interromp una tasca activa. Si arriba una tasca més urgent mentre tots els workers estan ocupats, espera fins que un worker queda lliure.

## Prioritat amb envelliment

`AgingPolicy` calcula una prioritat efectiva en cada decisió:

```text
waitingTime = currentTime - arrivalTime

effectivePriority =
  min(9, initialPriority + floor(waitingTime / agingInterval))
```

`agingInterval` ha de ser un enter segur positiu. La prioritat efectiva no supera 9. Si dues tasques obtenen la mateixa prioritat efectiva, la política aplica FIFO.

L'envelliment pot permetre que una tasca antiga de prioritat inicial baixa avanci una tasca més recent. Aquest comportament redueix el risc d'inanició, però no implica que la política sigui superior en tots els escenaris.

## Exemple controlat

L'exemple de prova utilitza un worker:

| Tasca        | Arribada | Durada | Prioritat |
| ------------ | -------: | -----: | --------: |
| Bloquejadora |        0 |     10 |         9 |
| Antiga       |        0 |      2 |         1 |
| Recent       |        9 |      1 |         3 |

La tasca bloquejadora s'executa de 0 a 10. En el `tick` 10, la prioritat estricta selecciona la tasca recent perquè 3 és superior a 1.

Amb `agingInterval = 2`, la tasca antiga ha esperat 10 `tick` i obté prioritat efectiva 6. La tasca recent ha esperat 1 `tick` i manté prioritat efectiva 3. Per tant, l'envelliment selecciona la tasca antiga.

```text
Prioritat estricta: bloquejadora → recent → antiga
Aging:              bloquejadora → antiga → recent
```

L'exemple mostra una diferència de decisió sota una càrrega controlada. No estableix un rànquing general entre polítiques.

## Determinisme i equivalència

Les tres polítiques reben les mateixes definicions de tasca i no modifiquen la llista disponible. Les proves executen totes les configuracions dues vegades sobre el mateix escenari i comproven que els resultats són idèntics i que l'escenari original es conserva.

Cada `EngineRunResult` registra la política i els paràmetres validats. Aquesta traçabilitat permetrà persistir i explicar les comparacions en fases posteriors.

## Verificació

Les proves unitàries cobreixen:

- selecció urgent amb prioritat estricta
- FIFO en empats de prioritat
- execució no preemptiva
- evolució i saturació de la prioritat efectiva
- canvi de decisió amb envelliment
- validació de l'interval
- factoria de polítiques
- immutabilitat i determinisme entre execucions

El paquet del motor conté 35 proves després d'aquesta fase. Les mètriques agregades i la generació sintètica continuen fora de l'abast actual.
