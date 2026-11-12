# Model de domini i contractes

## Propòsit

Aquest document fixa el vocabulari i les regles que utilitzaran el motor, l'API i la interfície web. El motor treballarà amb temps virtual, és a dir, avançarà entre esdeveniments simulats sense esperar temps real. En aquesta fase només es defineixen els contractes. Encara no s'ha implementat l'algoritme de simulació.

Els contractes executables es troben al paquet `@queuescope/contracts`. Aquest paquet utilitza Zod, una biblioteca de validació d'esquemes, per comprovar les dades en temps d'execució i obtenir-ne els tipus TypeScript.

## Conceptes principals

- Una tasca és una unitat de treball sintètica amb un instant d'arribada, una durada prevista, un tipus i una prioritat inicial.
- Un escenari és una instantània de tasques i capacitat de treball que es pot reutilitzar sense mutacions.
- Un worker és una unitat de capacitat que executa una sola tasca alhora. L'execució prevista és no preemptiva, de manera que una tasca iniciada no s'interromp.
- Una política decideix quina tasca pendent ha de començar quan hi ha un worker disponible.
- Una execució aplica una política a una instantània d'escenari i produeix resultats per tasca i mètriques agregades.
- Una comparació agrupa dues o més execucions sobre la mateixa instantània.

## Temps virtual i límits

La unitat comuna és el `tick`, una unitat virtual sense equivalència obligatòria amb segons o mil·lisegons. Els instants i les durades són nombres enters segurs i no negatius. Aquesta decisió evita errors d'arrodoniment i permet reproduir exactament una execució.

| Element              | Regla                            |
| -------------------- | -------------------------------- |
| Arribada             | Enter segur igual o superior a 0 |
| Durada de servei     | Enter segur igual o superior a 0 |
| Workers              | Entre 1 i 64                     |
| Tasques per escenari | Entre 0 i 1.000                  |
| Prioritat            | Enter entre 0 i 9                |
| Llavor aleatòria     | Enter entre 0 i 4.294.967.295    |

Una durada zero és vàlida i representa una tasca que finalitza en el mateix instant en què comença. Un escenari buit també és vàlid per poder definir i provar explícitament el seu comportament.

## Prioritats i desempats

Una prioritat numèrica més alta representa més urgència. Les polítiques previstes són `fifo`, `strict-priority` i `priority-aging`.

FIFO ordenarà primer per arribada, després per `sequence` i finalment per identificador. La seqüència representa l'ordre estable d'inserció i ha de ser única dins de l'escenari.

La prioritat estricta seleccionarà primer la prioritat inicial més alta. En cas d'empat aplicarà l'ordre FIFO complet.

L'envelliment utilitzarà inicialment aquesta fórmula:

```text
effectivePriority = min(9, initialPriority + floor(waitingTime / agingInterval))
```

`agingInterval` és un nombre enter positiu de `tick`. Si dues tasques tenen la mateixa prioritat efectiva, s'aplica l'ordre FIFO complet. Aquesta fórmula es documenta abans d'implementar-se i es podrà ajustar si els experiments posteriors ho justifiquen.

## Mètriques

Per a cada tasca:

```text
waitingTime = serviceStartTime - arrivalTime
turnaroundTime = completionTime - arrivalTime
```

Per a cada execució:

```text
simulationSpan = lastCompletionTime - firstArrivalTime
throughput = completedTaskCount / simulationSpan
workerUtilization = totalBusyWorkerTime / (workerCount * simulationSpan)
```

La mitjana, la mediana, el percentil 95 i el màxim es calculen sobre els valors sense arrodonir. El percentil 95 utilitzarà el mètode de rang més proper sobre la mostra ordenada, amb l'índex `ceil(0.95 * n) - 1`.

Si no hi ha observacions, els quatre estadístics són `null` i `sampleSize` és 0. Si `simulationSpan` és 0, el throughput i la utilització són `null`, perquè la divisió no està definida. No es convertirà una operació indefinida en un zero aparentment vàlid.

Les mètriques agrupades utilitzen sempre la prioritat inicial. Així es pot observar què ha passat amb cada grup sense confondre'l amb la prioritat efectiva que pot canviar durant l'envelliment.

## Exemple verificable

`docs/examples/manual-scenario.json` conté tres tasques i un worker. La referència `docs/examples/manual-fifo-result.json` mostra el resultat FIFO calculat manualment. Les tasques s'executen en l'ordre A, B i C. Els temps d'espera són 0, 3 i 5 `tick`. Per tant, la mitjana és 8 dividit per 3, la mediana és 3 i el percentil 95 és 5.

Aquest resultat és una referència per a les proves de les fases següents. No implica que el motor FIFO ja estigui implementat ni que una política sigui superior a una altra.
