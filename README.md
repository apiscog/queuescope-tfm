# QueueScope

QueueScope és una plataforma web per definir càrregues sintètiques de tasques asíncrones i comparar polítiques de planificació en condicions controlades i reproduïbles.

El projecte és un monorepositori amb una API REST basada en NestJS, una aplicació web React i dos paquets TypeScript independents per al motor de simulació i els contractes compartits. El nucli pot generar càrregues reproduïbles, executar FIFO, prioritat estricta o prioritat amb envelliment i calcular mètriques agregades. La fase 5 està en curs i ja permet guardar i consultar escenaris manuals a PostgreSQL.

## Requisits

- Node.js 24 LTS
- npm 11 o posterior
- Docker amb Docker Compose per executar PostgreSQL localment

La versió de Node està fixada a `.nvmrc` i `.node-version`. Amb `fnm`, es pot activar amb `fnm use 24` després d'aplicar la configuració del gestor a la terminal.

## Preparació de l'entorn

1. Instal·la les dependències des de l'arrel amb `npm install`.
2. Copia `.env.example` a `apps/api/.env` i adapta els valors si cal. No versionis aquest fitxer.
3. Inicia PostgreSQL amb `docker compose up -d postgres`.
4. Aplica les migracions amb `npm run db:migrate --workspace @queuescope/api`.
5. Executa l'API amb `npm run dev --workspace @queuescope/api`.
6. Executa el frontend en una altra terminal amb `npm run dev --workspace @queuescope/web`.

La primera prova manual de la fase 5 està explicada a `docs/architecture/api-and-persistence.md`. Per veure les taules i les files també es pot executar `npm run db:studio --workspace @queuescope/api`.

| Servei         | Adreça                       |
| -------------- | ---------------------------- |
| Web            | http://localhost:5173        |
| API            | http://localhost:3000        |
| Swagger        | http://localhost:3000/docs   |
| Salut de l'API | http://localhost:3000/health |
| PostgreSQL     | localhost:5432               |

## Comprovacions de qualitat

Els mateixos comandaments s'executen localment i a GitHub Actions:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Estructura

```text
apps/
  api/                    API NestJS
  web/                    Aplicació React i Vite
packages/
  simulation-engine/      Motor TypeScript independent
  contracts/              Contractes compartits
docs/                     Arquitectura, guia i guió de demostració
infra/                    Configuració d'infraestructura
scripts/                  Automatitzacions reproduïbles
```

## Variables d'entorn

`DATABASE_URL` i `DIRECT_URL` configuren les connexions de PostgreSQL. `CORS_ORIGIN`, `PORT`, `MAX_SCENARIO_TASKS` i `NODE_ENV` pertanyen a l'API. `VITE_API_URL` és una configuració pública del navegador i no pot contenir secrets.

## Progrés

| Fase                     | Estat      | Evidència                                                                                  | Bloquejos | Pròxima acció                                      |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------ | --------- | -------------------------------------------------- |
| 0. Inicialització        | Completada | Instal·lació, format, lint, typecheck, tests, build, Compose i endpoints mínims verificats |           |                                                    |
| 1. Domini                | Completada | Contractes Zod, regles documentades, exemples JSON i proves automatitzades                 |           |                                                    |
| 2. Motor FIFO            | Completada | Temps virtual, cua d'esdeveniments, FIFO i 13 proves del motor                             |           |                                                    |
| 3. Polítiques            | Completada | Prioritat estricta, envelliment, factoria i 35 proves del motor                            |           |                                                    |
| 4. Generador i mètriques | Completada | Generació amb llavor, mètriques agregades, 58 proves del motor i 11 de contractes          |           |                                                    |
| 5. API i persistència    | En curs    | Migració inicial i API per crear, llistar i consultar escenaris manuals                    |           | Validar el primer recorregut i afegir comparacions |
| 6. Interfície funcional  | Pendent    |                                                                                            |           |                                                    |
| 7. Visualització         | Pendent    |                                                                                            |           |                                                    |
| 8. Qualitat              | Pendent    |                                                                                            |           |                                                    |
| 9. Entrega               | Pendent    |                                                                                            |           |                                                    |
| 10. Vídeo                | Pendent    |                                                                                            |           |                                                    |
