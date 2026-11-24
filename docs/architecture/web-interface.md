# Interfície web funcional

La fase 6 connecta l'aplicació React amb l'API NestJS. El primer bloc permet consultar els escenaris desats i obrir-ne el detall a `http://localhost:5173`. El segon bloc incorpora la generació, la previsualització i el desament d'un escenari sintètic. El tercer bloc permet executar una comparació i consultar-ne les mètriques en una taula.

```text
Navegador → React Router → TanStack Query → GET /scenarios
                                 │
                                 └──────────→ GET /scenarios/{id}
```

React Router associa l'adreça `/` al llistat i `/scenarios/:id` al detall. TanStack Query gestiona la petició, l'estat de càrrega, l'error i el reintent. El client valida les respostes amb els contractes Zod compartits abans de presentar-les. Material UI aporta components accessibles per al llistat, els avisos i la taula de tasques.

La configuració pública `VITE_API_URL` es llegeix des de `apps/web/.env`. En desenvolupament, copia `apps/web/.env.example` a aquest fitxer. No hi ha cap contrasenya al navegador. El servidor local de Vite funciona a `http://localhost:5173` i l'API a `http://localhost:3000`.

## Prova manual del primer bloc

1. Arrenca PostgreSQL, l'API i la web seguint el README.
2. Obre `http://localhost:5173`. Han d'aparèixer els escenaris guardats, inclòs `Escenari sintètic de prova` si continua a la base local.
3. Prem «Veure escenari». El detall ha de mostrar cinc tasques, dos workers, la llavor `12345` i la taula amb arribada, durada i prioritat.
4. Torna al llistat amb l'enllaç de la pàgina.

Si l'API està aturada, la web mostra un error llegible i un botó per tornar-ho a provar. Un servidor desplegat que es desperti després d'un període d'inactivitat mostra un estat de càrrega mentre respon.

L'usuari ha confirmat que veu els quatre escenaris desats i les seves taules de tasques. El nom antic que conté `�` ja estava mal codificat a PostgreSQL per una càrrega anterior feta des de PowerShell. La interfície presenta el valor desat i no modifica la instantània històrica. També s'ha corregit l'etiqueta del singular perquè mostri `1 worker`.

## Segon bloc: generar i desar un escenari

La ruta `/scenarios/new` presenta un formulari amb nom, nombre de tasques i workers, llavor, tipus i rangs d'arribada, durada i prioritat. React Hook Form gestiona els camps i mostra errors de validació. El contracte Zod compartit valida la petició completa abans d'enviar-la. El formulari limita la generació a 100 tasques i 16 workers per mantenir la prova manual àgil. L'API conserva els límits generals de 1.000 tasques i 64 workers.

El botó «Previsualitza les tasques» crida `POST /scenarios/preview`. La resposta es mostra en una taula i encara no queda desada. El botó «Desa aquest escenari» envia exactament la previsualització a `POST /scenarios` i obre el detall de l'escenari guardat. Si es canvia un camp després de previsualitzar, la taula anterior desapareix perquè ja no correspon als paràmetres actuals.

### Prova manual en curs

1. Obre `http://localhost:5173` i prem «Crea un escenari».
2. Escriu un nom propi i conserva inicialment els valors de prova. Prem «Previsualitza les tasques». Han d'aparèixer cinc tasques, dos workers i la llavor `12345`.
3. Canvia la llavor i torna a previsualitzar. La llista de tasques hauria de canviar. Canvia-la de nou a `12345` i comprova que la càrrega torna a ser igual.
4. Prem «Desa aquest escenari». La web ha d'obrir el detall amb les tasques guardades. Torna al llistat i comprova que hi apareix el nom nou.

L'usuari ha previsualitzat i desat `APScenario01`. La previsualització ha mostrat cinc tasques, dos workers i la llavor `12345`. Les tasques, els temps, els tipus i les prioritats coincideixen amb la previsualització anterior feta a Swagger amb els mateixos paràmetres. Després de desar, la web ha obert la ruta de detall i ha recuperat les cinc tasques. El canvi de llavor dins del formulari i el retorn al llistat encara no s'han comprovat manualment.

## Tercer bloc: seleccionar polítiques i consultar resultats

El detall de l'escenari ofereix FIFO i prioritat estricta seleccionades inicialment. També es pot activar la prioritat amb envelliment i configurar el seu interval en ticks. El formulari rebutja menys de dues polítiques i valida els paràmetres amb el contracte compartit abans de cridar `POST /comparisons`. L'API executa cada política sobre la mateixa instantània i desa el resultat.

La ruta `/comparisons/:id` consulta `GET /comparisons/{id}`. La primera taula mostra tasques acabades, espera mitjana, mediana, p95, espera màxima, tasques per tick i utilització dels workers. La segona agrupa les tasques i l'espera per prioritat inicial. La interfície arrodoneix només per presentar els nombres. La resposta desada conserva els valors originals. Un avís explica que els ticks són temps virtual i no rendiment real del servidor.

### Prova manual completada

1. Obre el detall d'`APScenario01` i baixa fins a «Compara polítiques».
2. Deixa FIFO i prioritat estricta marcades. Activa també «Prioritat amb envelliment» amb interval `2`.
3. Prem «Executa la comparació». La web ha d'obrir una adreça `/comparisons/{id}` amb tres files a la taula de resum.
4. Recarrega la pàgina. Les mateixes tres execucions i mètriques han de continuar visibles perquè provenen de PostgreSQL.

L'usuari ha executat una comparació amb FIFO i prioritat estricta des de la web. La pàgina ha mostrat dues polítiques i les dues taules de mètriques. FIFO presenta una espera màxima d'`1` tick, `0,63` tasques per tick i una utilització del `75 %`. La prioritat estricta presenta una espera màxima de `2` ticks, `0,71` tasques per tick i una utilització del `85,71 %`. Aquestes xifres arrodonides coincideixen amb les obtingudes abans a Swagger per la mateixa càrrega. Després de recarregar la pàgina, les mateixes dues execucions i mètriques continuen visibles.

L'usuari ha tornat a l'escenari i ha executat les tres polítiques amb un interval d'envelliment de `2` ticks. La nova pàgina mostra tres execucions i els resultats per prioritat inicial. En aquesta càrrega, prioritat estricta i envelliment tenen les mateixes mètriques, mentre que FIFO conserva una espera màxima inferior. Després de recarregar la pàgina, les tres execucions i les mateixes mètriques continuen visibles. El recorregut complet queda verificat manualment amb PostgreSQL local.

## Tancament de la fase 6

Les quatre rutes inicials funcionen amb dades reals de l'API. El formulari té etiquetes, límits i missatges d'error, i les taules indiquen les unitats. `VITE_API_URL` configura l'adreça de l'API. Han passat el format, el lint, la comprovació de tipus, 90 proves automatitzades i la compilació. La prova manual ha recorregut la creació, la previsualització, el desament, la comparació i la recuperació després de recarregar el navegador.

Vite avisa que el paquet JavaScript inicial supera 500 kB abans de comprimir. La compilació funciona i aquest avís es reserva per a la revisió de rendiment de la fase 8. Els gràfics i les visualitzacions comparatives corresponen a la fase 7.
