# Visualització comparativa

La fase 7 afegeix representacions visuals a la pàgina de resultats de la fase 6. La taula continua mostrant les xifres exactes. Els gràfics ajuden a veure diferències entre polítiques sense substituir les dades ni suggerir que una política és sempre superior.

## Primer bloc: temps d'espera per política

El gràfic respon una pregunta concreta: com canvien l'espera mitjana, el percentil 95 i l'espera màxima quan s'aplica cada política al mateix escenari? El percentil 95 és un valor per sota del qual queda aproximadament el 95 % de les observacions segons la regla de càlcul definida al motor. El màxim identifica la tasca amb l'espera més llarga.

Recharts dibuixa tres grups de barres, un per cada mètrica. Cada política conserva el mateix color en tots els grups i també apareix identificada pel seu nom a la llegenda. L'eix vertical i la informació emergent indiquen ticks de temps virtual. La descripció textual i la taula de resultats permeten interpretar les dades sense dependre només del color. Si no hi ha tasques completades, la pantalla mostra un avís en lloc d'un gràfic sense valors.

La ruta de comparació es carrega quan s'obre per evitar que la biblioteca gràfica s'inclogui a la descàrrega inicial del llistat d'escenaris. La compilació genera un fitxer separat per a aquesta pantalla. El paquet inicial encara supera el llindar d'avís de Vite i es revisarà a la fase 9.

La informació prové dels `runs` retornats per `GET /comparisons/{id}`. No es torna a executar la simulació. El gràfic utilitza els valors originals i aplica el format decimal només quan els presenta. Per a `APScenario01`, FIFO té una espera mitjana de `0,4` ticks i un p95 i màxim d'`1` tick. La prioritat estricta i la prioritat amb envelliment de dos ticks tenen la mateixa mitjana, però un p95 i màxim de `2` ticks en aquest escenari.

### Prova manual completada

1. Obre al navegador la comparació de tres polítiques d'`APScenario01`.
2. Després de la taula «Resum de resultats», busca el gràfic «Temps d'espera per política».
3. Comprova que les barres de la mitjana tenen la mateixa alçada i que les barres de p95 i màxim de FIFO són més baixes que les de les altres dues polítiques.
4. Passa el cursor sobre les barres i comprova que la informació emergent mostra valors en ticks. La taula anterior ha de continuar visible amb les xifres exactes.

L'usuari ha confirmat que el gràfic apareix a la comparació de tres polítiques i que les dades dels quadres informatius es veuen correctament. La taula de valors exactes i la llegenda continuen visibles. També s'ha ajustat l'eix vertical perquè mostri la coma decimal pròpia del format català.

## Segon bloc: espera mitjana per prioritat inicial

Aquest gràfic respon una pregunta diferent de la del primer: quins grups de prioritat inicial esperen més amb cada política? Les tres polítiques poden tenir la mateixa espera mitjana global i repartir-la de manera diferent entre les tasques. La taula «Resultats per prioritat inicial» mostra els valors exactes i el gràfic en facilita la comparació.

L'eix horitzontal conté les prioritats inicials presents a les tasques completades. L'eix vertical mostra l'espera mitjana en ticks. Cada política conserva el color i el nom utilitzats al primer gràfic. La informació emergent indica la prioritat i el valor en ticks. Si no s'ha completat cap tasca, es mostra un avís en lloc de barres sense dades.

Per a `APScenario01`, les tasques amb prioritat inicial `1` esperen una mitjana d'`1` tick amb FIFO i `0` amb les altres dues polítiques. Les de prioritat `4` esperen `0` amb FIFO i `1` amb prioritat estricta i envelliment. Les de prioritat `5` esperen `0,5` amb FIFO i `0` amb les altres dues. Aquest repartiment explica per què una mitjana global idèntica no implica el mateix tractament de totes les tasques.

### Prova manual completada

1. Recarrega la comparació de tres polítiques d'`APScenario01`.
2. Després de la taula «Resultats per prioritat inicial», busca «Espera mitjana per prioritat inicial».
3. Comprova les barres dels grups `1`, `4` i `5` amb els valors descrits més amunt.
4. Passa el cursor sobre una barra i comprova que apareixen la prioritat i l'espera en ticks. Les dues taules han de continuar visibles.

L'usuari ha confirmat que el segon gràfic es veu a la comparació de tres polítiques. Les dues taules continuen disponibles per consultar els valors exactes. La diferència entre els grups de prioritat `1`, `4` i `5` aporta informació que no ofereix la mitjana global.

## Tancament de la fase 7

Els dos gràfics responen preguntes diferents. El primer compara mètriques d'espera entre polítiques i el segon mostra com es reparteix l'espera entre prioritats inicials. Tots dos tenen títol, unitats, llegenda, descripció i un resum tabular amb valors exactes. No s'assigna una classificació automàtica de polítiques. La prova manual amb `APScenario01` ha confirmat que el flux continua funcionant amb la visualització afegida.

Han passat el format, el lint, la comprovació de tipus, 90 proves automatitzades i la compilació. El paquet de la pàgina de comparació es carrega per separat. Vite continua avisant que el paquet inicial supera 500 kB abans de comprimir, qüestió que queda registrada per a la fase 9. Una línia temporal de workers podria explicar l'ordre de servei en el futur, però els dos gràfics actuals cobreixen les preguntes de comparació prioritàries del prototip.
