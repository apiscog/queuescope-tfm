# API i persistència: primer recorregut

## Primer recorregut: escenaris

La fase 5 està en curs. El primer bloc permet crear escenaris manuals i recuperar-los amb una API REST.

NestJS rep la petició HTTP, valida les dades amb el contracte `ScenarioSchema` i delega la persistència a Prisma. Prisma és la biblioteca que tradueix les operacions del codi en consultes a PostgreSQL. La migració crea les taules `scenarios` i `scenario_tasks` des d'una base buida.

```text
Swagger o client HTTP
       |
       v
ScenariosController
       |
       v
ScenariosService -> validació Zod
       |
       v
PrismaService
       |
       v
PostgreSQL: scenarios + scenario_tasks
```

Les tasques es desen com a registres relacionats amb l'escenari. Els temps virtuals s'emmagatzemen com a enters de 64 bits i es retornen com a nombres JavaScript després de validar que continuen dins del rang segur del contracte. La font manual o generada es conserva en un camp JSON.

`DATABASE_URL` configura la connexió del client i `DIRECT_URL` la connexió directa per a migracions. En local poden apuntar a la mateixa base PostgreSQL. En el futur desplegament a Neon, la primera serà la connexió agrupada i la segona la connexió directa.

## Prova manual amb Swagger

Des de l'arrel del repositori, amb Docker Desktop iniciat, obre el símbol del sistema de Windows (CMD):

```cmd
copy .env.example apps\api\.env
fnm exec --using=24 npm.cmd run db:generate --workspace @queuescope/api
docker compose up -d postgres
fnm exec --using=24 npm.cmd run db:migrate --workspace @queuescope/api
fnm exec --using=24 npm.cmd run dev --workspace @queuescope/api
```

`copy` només és necessari la primera vegada. Si el fitxer ja existeix, no acceptis sobreescriure'l. En una altra terminal, visita `http://localhost:3000/docs`.

El client de Prisma es genera una vegada després d'instal·lar dependències i cada vegada que es modifica `schema.prisma`. A Windows cal aturar l'API abans de regenerar-lo perquè el procés manté obert el fitxer binari.

1. Obre `POST /scenarios`, prem «Try it out» i envia l'exemple que mostra Swagger. El resultat esperat és `201` amb l'escenari i les tasques.
2. Obre `GET /scenarios` i executa la petició. L'escenari creat ha d'aparèixer a la llista.
3. Obre `GET /scenarios/{id}`, prem «Try it out» i escriu `escenari-demo-1` al camp `id`. La resposta ha de contenir les mateixes tasques en ordre de seqüència.
4. Atura l'API amb `Ctrl+C`, torna-la a iniciar i repeteix el `GET`. L'escenari ha de continuar disponible.
5. Si envies una segona vegada el mateix `POST`, la resposta esperada és `409` perquè l'identificador ja existeix.
6. Si canvies una arribada a `-1`, la resposta esperada és `400` amb el camp invàlid.

Amb `npm run db:studio --workspace @queuescope/api` pots inspeccionar visualment les dues taules. La interfície React encara no ofereix aquest recorregut.

## Límits d'aquest bloc

La prova automatitzada comprova les respostes HTTP i la validació amb un substitut de la base de dades. També verifica que les dependències de NestJS estan declarades explícitament per al procés de desenvolupament amb `tsx`.

S'ha comprovat la creació i consulta d'escenaris amb PostgreSQL local mitjançant les respostes `201` i `200`. Després de reiniciar l'API, l'usuari ha recuperat el mateix escenari amb les seves dues tasques. Això confirma la persistència del primer recorregut.

## Segon recorregut: comparacions

La segona migració incorpora `comparisons`, `runs` i `run_task_results`. Cada comparació conserva una instantània JSON de l'escenari. Cada execució registra la política i els seus paràmetres, la versió del motor, l'estat completat, els instants administratius d'inici i finalització, les mètriques i els resultats per tasca. La creació de la comparació i totes les seves dades és una operació atòmica de Prisma.

```text
escenari desat
      |
      v
instantània validada
      |
      +--> FIFO ------------> RunResult
      +--> prioritat estricta -> RunResult
      +--> envelliment ------> RunResult
      |
      v
comparació i execucions desades a PostgreSQL
```

`POST /comparisons` accepta l'identificador d'un escenari i entre dues i tres polítiques diferents. La mateixa instantània es passa a totes les execucions. `GET /comparisons/{id}` recupera l'instantània i els resultats complets sense tornar a executar el motor.

### Prova manual amb Swagger

La migració s'aplica amb l'API aturada:

```cmd
fnm exec --using=24 npm.cmd run db:generate --workspace @queuescope/api
fnm exec --using=24 npm.cmd run db:migrate --workspace @queuescope/api
fnm exec --using=24 npm.cmd run dev --workspace @queuescope/api
```

El primer comandament és necessari quan es modifica el model de Prisma. La migració és idempotent i conserva els escenaris existents.

1. A `POST /comparisons`, prem «Try it out» i envia l'exemple de Swagger amb `scenario-comparison-001`, FIFO i prioritat estricta. L'escenari de prova ja s'ha creat a la base local durant la verificació del desenvolupament. Si no existeix en una altra instal·lació, crea'l amb `POST /scenarios` utilitzant `docs/examples/comparison-scenario.json`.
2. La resposta ha de ser `201`. Copia `comparisonId` i comprova que hi hagi dues execucions amb la mateixa `scenarioSnapshot`.
3. A les mètriques d'espera, `maximum` és 6 per a FIFO i 4 per a prioritat estricta. L'exemple té un worker. La tasca A l'ocupa fins al tick 4. FIFO tria B abans de C, mentre que la prioritat estricta tria C abans de B.
4. A `GET /comparisons/{id}`, escriu el `comparisonId` retornat. La resposta ha de contenir les mateixes mètriques i els resultats individuals de cada tasca.
5. Reinicia l'API i repeteix el `GET` per comprovar que els resultats persisteixen.

La comprovació local de desenvolupament ha creat i recuperat una comparació amb PostgreSQL real. L'usuari ha repetit el recorregut a Swagger i ha obtingut la mateixa comparació després de reiniciar l'API. La interfície React i els gràfics es construiran en fases posteriors.

L'escenari de prova creat amb un comandament de PowerShell conté un caràcter mal codificat al nom. Les tasques i les mètriques no han canviat. El fitxer d'exemple del repositori conserva el text correcte. Les càrregues futures de fitxers amb accents han d'enviar el cos HTTP codificat explícitament en UTF-8.

## Tercer recorregut: previsualització reproduïble

`POST /scenarios/preview` rep un nom, un identificador, una data i paràmetres acotats per generar tasques. Valida el nombre de tasques i workers, els rangs d'arribada, durada i prioritat, els tipus i la llavor. Retorna un escenari generat amb el codi `200` sense escriure res a PostgreSQL.

L'exemple de Swagger crea cinc tasques amb dos workers i la llavor `12345`. Si s'envia dues vegades sense canvis, la llista ordenada de tasques ha de ser exactament igual. Si es canvia la llavor, s'espera una càrrega diferent. Per comprovar que la previsualització no persisteix, consulta `GET /scenarios/scenario-preview-001`, que ha de respondre `404` mentre no s'hagi desat explícitament.

Un usuari pot guardar posteriorment l'escenari retornat amb `POST /scenarios`, que ja valida tant escenaris manuals com generats. A la prova manual, aquesta petició ha retornat `201` amb les cinc tasques, `source.kind` igual a `generated` i la llavor `12345`. Tot seguit, `GET /scenarios/scenario-preview-001` ha retornat `200` amb les mateixes dades. Encara no hi ha un botó o endpoint separat que confirmi la generació i el desament en una sola operació.

La prova manual a Swagger ha retornat les mateixes cinc tasques en dues peticions amb la llavor `12345`. La consulta posterior de `GET /scenarios/scenario-preview-001` ha retornat `404`, de manera que la previsualització no ha desat l'escenari. La comprovació de desenvolupament també ha verificat que el nom català es conserva en enviar el cos HTTP com a bytes UTF-8.

### Comparació de l'escenari generat

La prova manual ha executat `POST /comparisons` sobre `scenario-preview-001` amb FIFO, prioritat estricta i prioritat amb envelliment d'interval `2`. La resposta `201` inclou una sola instantània de les cinc tasques i tres execucions. FIFO acaba al tick `10`, amb un temps simulat de `8` ticks, una espera màxima d'`1` tick i una utilització dels dos workers del `75 %`. La prioritat estricta acaba al tick `9`, amb un temps simulat de `7` ticks, una espera màxima de `2` ticks i una utilització aproximada del `85,7 %`.

La prioritat amb envelliment ha produït el mateix ordre i les mateixes mètriques que la prioritat estricta en aquesta càrrega. Cap tasca no ha esperat prou temps per canviar una decisió de selecció. L'exemple mostra un compromís concret: la prioritat estricta finalitza abans el conjunt, però fa esperar dos ticks una tasca que amb FIFO començava immediatament. `GET /comparisons/b91cb0c5-9625-4674-aabf-fe320d490d96` ha retornat `200` amb la mateixa instantània, les tres execucions, les mètriques i els resultats per tasca. Després de reiniciar l'API, l'usuari ha tornat a veure les tres execucions. Aquesta comparació concreta persisteix a PostgreSQL.

### Tancament de la fase 5

Les dues migracions s'han aplicat correctament des de zero en un esquema aïllat del PostgreSQL local. La comprovació de Prisma ha confirmat que l'esquema estava actualitzat i l'esquema temporal s'ha eliminat després de la prova. També han passat el format, el lint, la comprovació de tipus, les 83 proves automatitzades i la compilació. Les proves HTTP cobreixen la creació d'un escenari, l'execució de dues polítiques sobre la mateixa instantània i la recuperació del resultat. La prova manual amb PostgreSQL real ha verificat la creació, la consulta i la persistència després de reiniciar l'API.

La configuració de Prisma separa `DATABASE_URL` i `DIRECT_URL`. L'aplicació de les migracions a Neon queda per a la fase 8, quan es prepari el desplegament i el flux web local ja funcioni.
