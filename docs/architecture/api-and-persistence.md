# API i persistència: primer recorregut

## Estat actual

La fase 5 està en curs. El primer bloc permet crear escenaris manuals i recuperar-los amb una API REST. Les comparacions i les execucions encara no tenen endpoints ni taules.

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

Des de l'arrel del repositori, amb Docker Desktop iniciat:

```powershell
Copy-Item .env.example apps/api/.env
docker compose up -d postgres
npm run db:migrate --workspace @queuescope/api
npm run dev --workspace @queuescope/api
```

`Copy-Item` només és necessari la primera vegada. En una altra terminal, visita `http://localhost:3000/docs`.

1. Obre `POST /scenarios`, prem «Try it out» i envia l'exemple que mostra Swagger. El resultat esperat és `201` amb l'escenari i les tasques.
2. Obre `GET /scenarios` i executa la petició. L'escenari creat ha d'aparèixer a la llista.
3. Obre `GET /scenarios/{id}` amb `escenari-demo-1`. La resposta ha de contenir les mateixes tasques en ordre de seqüència.
4. Atura l'API amb `Ctrl+C`, torna-la a iniciar i repeteix el `GET`. L'escenari ha de continuar disponible.
5. Si envies una segona vegada el mateix `POST`, la resposta esperada és `409` perquè l'identificador ja existeix.
6. Si canvies una arribada a `-1`, la resposta esperada és `400` amb el camp invàlid.

Amb `npm run db:studio --workspace @queuescope/api` pots inspeccionar visualment les dues taules. La interfície React encara no ofereix aquest recorregut.

## Límits d'aquest bloc

La prova automatitzada comprova les respostes HTTP i la validació amb un substitut de la base de dades. La persistència real i la migració encara s'han de verificar manualment amb PostgreSQL local. La prova d'integració amb una base real i el flux de comparacions corresponen als blocs següents de la fase 5.
