# Identitat visual i experiència de simulació

## Propòsit

QueueScope presenta una comparació acadèmica de polítiques de planificació. La
interfície ha d'ajudar a entendre el recorregut d'una tasca i a llegir els
resultats amb precisió. La identitat visual pren la caixa en cua com a símbol
del producte.

## Sistema visual

- Fons marfil `#F5F4ED`, superfícies blanques, text grafit `#1A2925` i línies
  suaus `#D8E1D9`.
- Verd `#245C46` per a accions principals. Els colors de les polítiques
  continuen sent blau per a FIFO, taronja per a prioritat estricta i violeta per
  a envelliment. Cada color s'acompanya d'un nom. El taronja `#A95820` manté
  prou contrast sobre el fons clar per a text petit.
- Tipografia de sistema per al text i monoespaiada per a identificadors, ticks i
  dades compactes. El tema de Material UI concentra colors, tipografia, radis i
  estats dels components.
- Logotip SVG amb tres caixes en cua. Les caixes i la línia de servei formen una
  marca que funciona a mida petita i en una sola tinta.
- Les transicions de botons i targetes són breus. El moviment ornamental es
  desactiva quan el sistema demana menys animació.

## Esbossos de les quatre rutes

### Llistat `/`

```text
escriptori                         mòbil
┌ marca ── navegació ─────────┐    ┌ marca ── acció ───────┐
│ títol i acció │ diagrama    │    │ títol i acció         │
│              │ conceptual  │    │ diagrama conceptual   │
│ escenari     │ escenari    │    │ escenari              │
└──────────────────────────────┘    └───────────────────────┘
```

El diagrama de portada és conceptual i ho indica explícitament. No representa
cap execució ni cap mesura.

### Creació `/scenarios/new`

```text
escriptori                         mòbil
┌ dades principals │ ajuda ──┐    ┌ dades principals ─────┐
│ paràmetres       │         │    │ paràmetres            │
│ previsualització de tasques │    │ previsualització      │
└─────────────────────────────┘    └───────────────────────┘
```

Primer es defineix la càrrega, després es previsualitza i finalment es desa.
Els camps han de conservar les unitats visibles.

### Escenari `/scenarios/:id`

```text
nom i resum → taula exacta de tasques → polítiques → executar
```

El recompte de tasques i workers ha de ser visible abans de llançar la
comparació. La selecció ha de poder-se llegir sense dependre del color.

### Comparació `/comparisons/:id`

```text
nom i context → taula resum → gràfics → detall per prioritat → recorregut
```

La taula conserva els valors exactes. Els gràfics i l'eventual recorregut de
tasques expliquen dades persistides, sense tornar a simular ni alterar-les.

## Revisió de la primera entrega visual

La primera entrega implementa el tema compartit, la marca SVG, la navegació,
la portada i les targetes d'escenaris. La il·lustració de portada és un esquema
estàtic. La resta dels esbossos descriuen el treball pendent d'aquesta fase.
La revisió manual ha de comprovar la lectura i l'ús en escriptori i mòbil abans
de continuar amb el redisseny de les pantalles internes.

## Segona entrega visual

Després de validar la portada, la creació i el detall de l'escenari han adoptat
la mateixa jerarquia visual. El formulari separa les dades principals, la mida
de la càrrega i els rangs de les tasques. Un panell explica que la
previsualització no desa res. La taula de previsualització conserva els valors
exactes i pot desplaçar-se horitzontalment en pantalles estretes.

El detall presenta el nom, el recompte de tasques i el de workers abans de la
taula. Les polítiques són targetes amb el nom, la regla resumida i una casella
de selecció. El color reforça la identificació, però el text i la casella
permeten entendre l'estat sense dependre del color. Aquest bloc encara requereix
una revisió manual amb una càrrega coneguda abans de continuar amb la pantalla
de resultats.

## Tercera entrega visual

Després de validar la creació i la selecció de polítiques, la pantalla de
resultats utilitza la mateixa capçalera de procés que les altres rutes. El
resum mostra el nom, el nombre de tasques, els workers i les polítiques. La
taula de mètriques continua sent la primera lectura i conserva els valors
exactes. Les taules es poden desplaçar horitzontalment en pantalles estretes.

Cada política té una etiqueta textual i un punt de color consistent amb les
targetes de selecció i els gràfics. Un requadre descriu el rang del P95 observat
en la comparació carregada. Aquesta frase només parla del cas concret i no
atribueix superioritat general a cap política. Quan les dades no permeten
calcular el P95, el requadre no apareix. Si diverses polítiques comparteixen
un extrem del rang, s'hi esmenten totes.

## Quarta entrega visual: línia temporal de tasques

Després de validar la pantalla de resultats, s'hi ha afegit una línia temporal
estàtica. Un selector permet veure una política cada vegada. Cada tasca apareix
en una fila sota el worker que la va executar. Un tram puntejat va de l'arribada
a l'inici del servei i representa l'espera. Un tram sòlid va de l'inici a la
finalització i representa el servei. Al costat es mostren els tres temps i
l'espera exacta en ticks.

La vista llegeix `arrivalTime`, `serviceStartTime`, `completionTime` i
`waitingTime` de `RunResult.taskResults`, que ja s'havia persistit. El selector
només canvia l'execució representada. No torna a planificar tasques. Les tasques
s'agrupen pel worker que finalment les va executar, però la franja d'espera no
vol dir que el worker estigués reservat. Quan no hi ha un interval de servei,
apareix un missatge explicatiu.

La taula de mètriques i els gràfics continuen abans d'aquesta vista. La
comparació entre FIFO i prioritat estricta es pot verificar contra els temps
individuals desats. La possibilitat d'avançar per esdeveniments queda per a una
avaluació posterior a la revisió manual de la línia temporal estàtica.

## Cinquena entrega visual: reproducció per esdeveniments

La línia temporal estàtica s'ha validat manualment. A sobre s'hi ha incorporat
un panell de reproducció que mostra l'estat de les tasques en els ticks on es
produeix una arribada, un inici o una finalització. La vista distingeix les
tasques que encara no han arribat, les que esperen, les que ocupa cada worker i
les que ja han acabat. Tots els canvis es dedueixen dels temps desats de la
política seleccionada.

Els controls permeten iniciar, pausar, retrocedir un esdeveniment, avançar-ne un
i tornar al principi. La reproducció automàtica canvia de pantalla cada 0,9
segons. Aquest ritme és només una ajuda visual i no representa la durada real
de cap tasca. Quan el sistema demana moviment reduït, l'inici automàtic no es
mostra i l'avanç manual continua disponible. La línia temporal estàtica i els
temps textuals segueixen visibles.

La prova automatitzada comprova els estats de la cua i del worker en dos ticks,
el canvi entre polítiques, la pausa de la reproducció i l'avanç manual amb
moviment reduït. La reproducció també s'ha revisat manualment amb una
comparació persistida.

La compilació actual genera un paquet inicial d'uns 701 kB i un fitxer separat
per a la pàgina de comparació d'uns 414 kB abans de comprimir. Vite continua
mostrant l'avís dels 500 kB per al paquet inicial. La vista temporal no afegeix
cap motor 2D o 3D extern. La revisió del paquet inicial queda registrada per a
la fase 9, abans del desplegament.

## Revisió de tancament de la fase 8

La reproducció per esdeveniments s'ha validat manualment amb una comparació
desada. En un tick amb dues finalitzacions i un inici, la cua, els workers i les
tasques acabades van coincidir amb els resultats. Per a pantalles estretes, la
capçalera mostra només la icona de la marca i manté una etiqueta accessible en
l'enllaç d'inici. El taronja de la política estricta s'ha enfosquit per obtenir
un contrast d'aproximadament 5,1:1 sobre blanc i 4,6:1 sobre el fons marfil.

Han passat format, lint, tipus, 94 proves automatitzades i la compilació de tot
el monorepositori. El paquet inicial és d'uns 702 kB abans de comprimir i
continua sent un punt de revisió per a la fase 9. L'usuari ha confirmat que el
recorregut es veu bé amb el navegador estret. Les accions utilitzen controls
semàntics de Material UI i la prova web obre el selector de polítiques amb la
tecla de cursor avall. La comprovació manual completa amb teclat es pot repetir
durant l'assaig de la demostració.
