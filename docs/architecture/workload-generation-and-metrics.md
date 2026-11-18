# Generació de càrregues i mètriques

## Objectiu

La fase 4 transforma paràmetres acotats en escenaris sintètics reproduïbles i converteix els resultats individuals del motor en mètriques interpretables. Tota aquesta funcionalitat continua dins de paquets TypeScript independents de NestJS, React i PostgreSQL.

No s'han incorporat distribucions probabilístiques avançades. Els rangs uniformes enters són suficients per construir els primers experiments controlats i mantenen la configuració comprensible.

## Contracte de generació

`WorkloadGenerationParameters` defineix:

- quantitat de tasques entre 0 i 1.000
- quantitat de workers entre 1 i 64
- rang inclusiu d'arribades
- rang inclusiu de durades
- rang inclusiu de prioritats entre 0 i 9
- llista no buida de tipus de tasca sense duplicats
- llavor entera de 32 bits sense signe

Els límits es validen abans de generar cap tasca. Els valors mínims no poden superar els màxims.

```text
GenerateScenarioInput
        |
        v
validació amb Zod
        |
        v
PRNG Mulberry32 amb llavor
        |
        v
tasques dins dels rangs
        |
        v
ordre per arribada i identificador
        |
        v
Scenario immutable i validat
```

## Reproductibilitat

El generador pseudoaleatori utilitza Mulberry32. És un algoritme petit i determinista adequat per a simulacions acadèmiques, però no és criptogràfic i no s'ha d'utilitzar per generar secrets.

La mateixa configuració i la mateixa llavor produeixen exactament la mateixa seqüència. Els identificadors segueixen el patró `task-0001` i les tasques s'ordenen per arribada i identificador abans d'assignar la seqüència estable. La font de l'escenari conserva tots els paràmetres de generació, inclosa la llavor.

## Càlcul de mètriques

El motor continua produint un resultat explicable per tasca. La funció `calculateRunMetrics` valida que hi hagi exactament un resultat coherent per cada tasca de l'escenari abans de calcular agregats.

```text
TaskResult[] + Scenario
          |
          +--> temps d'espera
          +--> temps de retorn
          +--> temps ocupat dels workers
          +--> grups per prioritat inicial
          |
          v
RunMetrics
```

Les fórmules són:

```text
waitingTime = serviceStartTime - arrivalTime
turnaroundTime = completionTime - arrivalTime
simulationSpan = lastCompletionTime - firstArrivalTime
throughput = completedTaskCount / simulationSpan
workerUtilization = totalBusyWorkerTime / (workerCount * simulationSpan)
```

Per als temps d'espera i de retorn es calculen la mitjana, la mediana, el percentil 95 amb rang més proper i el màxim. També es calculen aquests estadístics agrupats per prioritat inicial. Els valors del domini no s'arrodoneixen.

Una mostra buida conté `sampleSize` igual a 0 i estadístics `null`. Quan `simulationSpan` és 0, el throughput i la utilització també són `null` perquè la divisió no està definida.

## Integració pública

`SimulationEngine.run` conserva el resultat cru intern. La funció pública `runSimulation` valida l'entrada, crea la política, executa el motor i afegeix les mètriques per retornar un `RunResult` complet.

Aquesta separació manté el bucle d'esdeveniments concentrat en la simulació i situa els agregats en un mòdul pur que es pot provar de manera independent.

## Verificació

Les proves comproven la seqüència coneguda del generador pseudoaleatori, els límits inclusius, la repetició amb la mateixa llavor, la variació amb llavors diferents, l'ordre estable, la immutabilitat i els paràmetres invàlids.

Les mètriques es contrasten amb l'exemple FIFO calculat manualment. També es proven mostres buides, durades totals nul·les, múltiples workers, agrupació per prioritat i resultats absents, duplicats o incoherents.
