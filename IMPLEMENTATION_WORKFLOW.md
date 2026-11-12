# Workflow de implementación de la PAC3

## 1. Objetivo de este documento

Este workflow organiza el desarrollo del prototipo por fases verificables. Su
finalidad es impedir que las funcionalidades opcionales desplacen el flujo
principal que debe mostrarse en la entrega.

La regla de trabajo es sencilla: no se inicia una funcionalidad opcional hasta
que la fase actual cumple sus criterios de salida.

## 2. Resultado mínimo que debemos alcanzar

Al finalizar la PAC3, una persona debe poder:

1. iniciar el proyecto desde un repositorio limpio
2. crear o seleccionar un escenario sintético
3. configurar tareas y workers
4. elegir varias políticas
5. ejecutar cada política con la misma carga
6. consultar los resultados persistidos
7. comparar métricas en una interfaz web

El flujo mínimo debe funcionar con FIFO y prioridad estricta. La prioridad con
envejecimiento forma parte del objetivo previsto y se implementará después de
estabilizar las dos primeras políticas.

## 3. Decisiones iniciales que no deben reabrirse sin motivo

- Lenguaje principal: TypeScript estricto sobre Node.js 24 LTS.
- Workspace: npm workspaces con un único `package-lock.json`.
- Backend: NestJS, API REST y documentación OpenAPI/Swagger.
- Frontend: React, TypeScript y Vite.
- Interfaz: Material UI, React Hook Form y Zod.
- Datos remotos del frontend: TanStack Query.
- Gráficos: Recharts, limitado a visualizaciones justificadas.
- Persistencia: PostgreSQL mediante Prisma y migraciones.
- Entorno local: Docker Compose.
- Arquitectura: monolito modular en un monorepo pequeño.
- Motor: módulo propio de TypeScript con reloj virtual.
- Ejecución inicial: tareas no preemptivas.
- Datos: exclusivamente sintéticos.
- Comparación: la misma carga inmutable para todas las políticas.
- BullMQ, RabbitMQ y n8n: fuera del núcleo del prototipo.
- Frontend desplegado en Vercel Hobby.
- API desplegada como Web Service gratuito de Render en Frankfurt.
- PostgreSQL administrado en Neon Free, preferentemente en región europea.
- Integración continua mediante GitHub Actions.
- Sin Next.js, Redux, autenticación ni dominio de pago en el alcance inicial.

Si una decisión cambia, debe registrarse en `docs/architecture/decisions.md` con
la razón, las alternativas consideradas y su impacto en el calendario.

## 4. Orden de implementación

### Fase 0. Inicialización del repositorio

Objetivo: disponer de una base reproducible antes de desarrollar funcionalidad.

Tareas:

- Crear el repositorio Git.
- Copiar `AGENTS.md` e `IMPLEMENTATION_WORKFLOW.md` en la raíz.
- Configurar el workspace y el gestor de paquetes.
- Fijar Node.js 24 LTS mediante `.nvmrc`, `.node-version` y `engines`.
- Crear `apps/api`, `apps/web`, `packages/simulation-engine` y
  `packages/contracts`.
- Activar TypeScript estricto, formateador y linter.
- Configurar scripts raíz para desarrollo, build, lint, typecheck y test.
- Preparar `.gitignore`, `.env.example` y un README inicial.
- Definir sin secretos `VITE_API_URL`, `DATABASE_URL`, `DIRECT_URL`,
  `CORS_ORIGIN`, `PORT`, `MAX_SCENARIO_TASKS` y `NODE_ENV` en los ejemplos.
- Crear Docker Compose con PostgreSQL, aunque la integración se complete en una
  fase posterior.
- Crear un workflow de GitHub Actions para lint, typecheck, test y build.
- Verificar que no se versionan secretos ni directorios de dependencias.

Criterios de salida:

- La instalación de dependencias funciona desde la raíz.
- Todos los paquetes compilan aunque todavía estén vacíos.
- Los comandos de lint, typecheck y test terminan correctamente.
- El README explica cómo preparar el entorno.
- GitHub Actions ejecuta los mismos comandos de calidad que el entorno local.

No hacer todavía:

- Diseñar todas las pantallas.
- Crear una arquitectura de microservicios.
- Añadir Redis o un sistema de colas.

### Fase 1. Modelo de dominio y contratos

Objetivo: fijar un vocabulario compartido antes de implementar algoritmos.

Tareas:

- Definir `TaskDefinition`, `Scenario`, `WorkerConfig`, `PolicyId`, `RunInput`,
  `TaskResult`, `RunResult` y `ComparisonResult`.
- Definir unidades de tiempo virtual y rangos válidos.
- Acordar si una prioridad numérica mayor significa mayor urgencia.
- Definir el desempate estable para llegadas y prioridades iguales.
- Especificar formalmente espera, turnaround, throughput y utilización.
- Documentar la primera fórmula de envejecimiento, sin implementarla aún si
  retrasa el flujo básico.
- Crear ejemplos JSON pequeños y comprensibles.

Criterios de salida:

- Los tipos compilan con TypeScript estricto.
- Hay un escenario manual cuyo resultado se puede calcular en papel.
- Las unidades y reglas de desempate están documentadas.
- Ningún tipo del motor depende de NestJS, React o PostgreSQL.

### Fase 2. Primer motor vertical con FIFO

Objetivo: ejecutar un escenario completo mediante tiempo virtual.

Tareas:

- Implementar el estado de tareas pendientes, activas y completadas.
- Implementar workers limitados y ejecución no preemptiva.
- Implementar la cola de eventos futuros.
- Avanzar directamente al siguiente evento relevante.
- Implementar la política FIFO mediante una interfaz de política.
- Producir resultados por tarea con llegada, inicio, finalización y worker.
- Comprobar invariantes durante las pruebas.

Casos de prueba obligatorios:

- escenario vacío
- una tarea y un worker
- varias tareas con llegada simultánea
- más tareas que workers
- trabajadores ociosos antes de una llegada futura
- desempates reproducibles
- ninguna tarea empieza antes de llegar
- un worker nunca ejecuta dos tareas a la vez

Criterios de salida:

- FIFO produce resultados correctos en ejemplos calculados manualmente.
- Dos ejecuciones idénticas producen exactamente el mismo resultado.
- El motor no usa temporizadores ni tiempo real.
- El paquete del motor tiene pruebas unitarias independientes.

### Fase 3. Políticas intercambiables

Objetivo: demostrar que el motor compara estrategias sin duplicar su lógica.

Tareas:

- Extraer o consolidar el contrato común de selección.
- Implementar prioridad estricta.
- Mantener FIFO como desempate entre tareas con la misma prioridad.
- Ejecutar FIFO y prioridad sobre copias equivalentes del mismo escenario.
- Implementar prioridad con envejecimiento.
- Hacer configurable el parámetro mínimo de envejecimiento si aporta valor.
- Registrar la política y sus parámetros en cada resultado.

Casos de prueba obligatorios:

- una tarea urgente adelanta a otra pendiente de menor prioridad
- una tarea ya iniciada no se interrumpe
- prioridades iguales conservan el desempate definido
- el envejecimiento cambia una decisión en un ejemplo controlado
- una configuración de envejecimiento inválida se rechaza

Criterios de salida:

- Añadir una política no exige modificar el bucle central del motor.
- Las políticas reciben una entrada equivalente.
- Los resultados no afirman que una política sea universalmente superior.

Si la fase se retrasa:

- Estabilizar FIFO y prioridad estricta de extremo a extremo.
- Mantener envejecimiento como siguiente tarea prioritaria, no añadir otras
  políticas.

### Fase 4. Generador sintético acotado y métricas

Objetivo: crear cargas reproducibles y resultados interpretables.

Tareas del generador:

- Admitir creación manual o escenario predefinido.
- Generar una cantidad limitada de tareas.
- Configurar rangos simples de llegada, duración, tipo y prioridad.
- Usar un generador pseudoaleatorio con semilla.
- Validar máximos para proteger el prototipo.
- Permitir previsualizar la carga antes de ejecutarla.

Tareas de métricas:

- Calcular espera y turnaround por tarea.
- Calcular media, mediana, p95 y máximo de espera.
- Calcular tareas completadas, throughput y utilización.
- Agrupar resultados por prioridad inicial.
- Mantener valores sin redondear en el dominio.
- Definir comportamiento para escenarios vacíos y tiempos totales nulos.

Criterios de salida:

- Mismos parámetros y semilla generan la misma carga ordenada.
- Las métricas coinciden con ejemplos manuales.
- El motor devuelve datos suficientes para explicar cada agregado.
- No se han añadido distribuciones avanzadas innecesarias.

### Fase 5. API y PostgreSQL

Objetivo: exponer el flujo del producto y conservar resultados.

Tareas:

- Configurar NestJS por módulos funcionales.
- Elegir y configurar una única herramienta de persistencia.
- Usar Prisma como ORM y generador de migraciones.
- Crear migraciones reproducibles.
- Implementar validación de DTO en los límites HTTP.
- Crear endpoints para escenarios.
- Crear un endpoint para lanzar una comparación.
- Ejecutar internamente una vez por política con la misma instantánea.
- Persistir comparación, runs, parámetros, métricas y resultados necesarios.
- Crear endpoints de consulta para la interfaz.
- Exponer `/health` y Swagger en `/docs`.
- Traducir errores internos a respuestas HTTP claras.

Modelo mínimo sugerido:

- `scenarios`
- `scenario_tasks`
- `comparisons`
- `runs`
- `run_task_results`
- `run_metrics` o métricas estructuradas en `runs`, según el diseño final

No normalizar prematuramente cada valor si complica el prototipo sin mejorar
las consultas necesarias.

Preparar la configuración para dos conexiones en Neon:

- `DATABASE_URL` agrupada para el cliente Prisma en ejecución.
- `DIRECT_URL` directa para las migraciones.

Guardar una instantánea inmutable del escenario en cada comparación. Las
ediciones posteriores del escenario no deben alterar resultados históricos.

Criterios de salida:

- Las migraciones preparan una base vacía.
- Existe una prueba de integración que crea un escenario, ejecuta una
  comparación y recupera los resultados.
- La API impide comparar cargas distintas por accidente.
- Reiniciar la API no elimina los resultados persistidos.
- Las migraciones se pueden aplicar tanto al PostgreSQL local como a Neon.

### Fase 6. Primera interfaz web funcional

Objetivo: completar el primer flujo de extremo a extremo sin gráficos.

Tareas:

- Crear una navegación mínima.
- Configurar React Router con `/`, `/scenarios/new`, `/scenarios/:id` y
  `/comparisons/:id`.
- Configurar Material UI para componentes y estructura visual.
- Configurar TanStack Query para llamadas, carga y errores de la API.
- Configurar React Hook Form y Zod para los formularios.
- Implementar lista o selección de escenarios.
- Implementar formulario de escenario con validación.
- Permitir usar generación sintética o un ejemplo predefinido.
- Mostrar una previsualización de tareas.
- Permitir seleccionar políticas.
- Lanzar la comparación y gestionar carga y errores.
- Mostrar una tabla de resultados agregados.

Criterios de salida:

- Una persona puede completar el flujo sin usar curl ni abrir la base de datos.
- Los formularios tienen etiquetas, mensajes de error y acceso por teclado.
- La tabla muestra unidades y nombres comprensibles.
- La interfaz funciona tras levantar el entorno con los comandos documentados.
- La URL de la API procede de `VITE_API_URL` y no está codificada en el código.

Este es el primer gran hito de la PAC3. Si se alcanza, debe crearse una etiqueta
o versión interna estable antes de continuar.

### Fase 7. Visualización comparativa

Objetivo: ayudar a interpretar resultados sin convertir la interfaz en un
dashboard genérico.

Orden recomendado:

1. mejorar la tabla comparativa
2. añadir un gráfico de tiempos de espera por política
3. añadir un gráfico por prioridad si aporta información diferente
4. valorar una representación de utilización o evolución de cola solo si los
   datos y el espacio lo justifican

Tareas:

- Seleccionar una biblioteca gráfica compatible con React.
- Mostrar títulos, leyendas, unidades y texto alternativo o resumen tabular.
- Mantener colores consistentes por política.
- No depender únicamente del color.
- Explicar que los resultados pertenecen al escenario simulado.
- Evitar rankings automáticos de «mejor política» sin un criterio declarado.

Criterios de salida:

- Cada gráfico responde a una pregunta concreta.
- La tabla sigue permitiendo consultar valores exactos.
- No hay gráficos decorativos ni métricas redundantes.
- El flujo continúa siendo demostrable en pocos minutos.

### Fase 8. Despliegue gratuito, endurecimiento y calidad

Objetivo: convertir el prototipo integrado en una entrega estable.

Tareas:

- Crear un proyecto de Neon y elegir una región europea próxima a Frankfurt.
- Aplicar las migraciones de producción con la conexión directa.
- Configurar el Web Service de Render para `apps/api` en Frankfurt.
- Configurar en Render los secretos del backend y el origen CORS de producción.
- Ejecutar la migración idempotente antes de iniciar la API desplegada.
- Desplegar `apps/web` en Vercel desde el mismo monorepo.
- Configurar `VITE_API_URL` con el dominio público de Render.
- Configurar CORS para el dominio final de Vercel y el origen local.
- Verificar `/health`, `/docs` y el flujo completo sobre servicios desplegados.
- Añadir un estado de carga comprensible para el arranque en frío de Render.
- Ejecutar todos los linters, typechecks y tests.
- Añadir pruebas para errores descubiertos durante integración.
- Probar límites de formularios y escenarios.
- Revisar determinismo y aislamiento entre políticas.
- Revisar consultas, migraciones y reinicio del entorno.
- Comprobar estados de carga, ausencia de datos y errores.
- Revisar accesibilidad básica.
- Revisar que no existan secretos o datos personales.
- Medir de forma sencilla el tamaño de carga que admite el prototipo.
- Registrar limitaciones conocidas sin ocultarlas.
- Ensayar la reactivación después de que Render y Neon hayan estado inactivos.

Criterios de salida:

- El pipeline local de calidad termina correctamente.
- No existen errores conocidos que impidan el flujo de demostración.
- Un segundo arranque desde cero funciona siguiendo el README.
- Las limitaciones están documentadas.
- Frontend, API y base de datos funcionan conjuntamente con los planes gratuitos.
- No aparece ningún secreto en Git, Vercel ni el bundle servido al navegador.
- El arranque en frío no se confunde con una métrica del motor.

### Fase 9. Documentación y material de entrega

Objetivo: asegurar que el producto pueda evaluarse y reproducirse.

Documentos mínimos:

- README con requisitos y puesta en marcha.
- `.env.example` sin secretos.
- descripción breve de arquitectura.
- instrucciones de despliegue para Vercel, Render y Neon.
- variables de entorno documentadas sin valores secretos.
- decisiones importantes y limitaciones.
- manual de usuario con el flujo principal.
- instrucciones para ejecutar pruebas.
- listado de tecnologías y licencias relevantes.
- guion de demostración.

Material para el ZIP:

- código fuente
- lockfile
- migraciones
- pruebas
- Docker Compose y configuración necesaria
- documentación
- recursos gráficos necesarios
- ejemplos sintéticos

Excluir del ZIP:

- `node_modules`
- builds y cachés regenerables
- volúmenes locales de PostgreSQL
- secretos y archivos `.env` reales
- logs y archivos temporales
- grabaciones descartadas

Criterios de salida:

- El ZIP se descomprime en una ruta nueva y el proyecto puede iniciarse.
- La documentación coincide con los comandos y pantallas reales.
- Todos los materiales necesarios están incluidos.
- La versión desplegada coincide con el commit utilizado para generar el ZIP.

### Fase 10. Vídeo demostrativo de 2 a 5 minutos

Objetivo: mostrar el valor y el funcionamiento real del producto de forma
directa.

Guion orientativo:

- 0:00-0:20. Presentación del problema y del objetivo.
- 0:20-1:15. Creación o selección de un escenario y configuración de workers.
- 1:15-1:45. Selección de políticas y ejecución.
- 1:45-3:30. Comparación de métricas y explicación de un compromiso observable.
- 3:30-4:15. Arquitectura o reproducibilidad, solo si aporta valor.
- 4:15-4:40. Limitaciones y cierre.

Antes de grabar:

- Preparar un escenario corto con diferencias visibles pero no manipuladas.
- Abrir `/health` antes de grabar para reactivar el servicio de Render.
- Limpiar datos de prueba irrelevantes.
- Ocultar notificaciones, credenciales y datos personales.
- Ensayar el flujo completo y medir su duración.
- Usar una resolución y un tamaño de texto legibles.

Criterios de salida:

- El MP4 dura entre 2 y 5 minutos.
- Se ve el producto funcionando, no solamente diapositivas o código.
- La narración no afirma resultados generales a partir de un único escenario.
- El vídeo corresponde a la misma versión incluida en el ZIP.

## 5. Backlog opcional ordenado

Solo después de completar las fases obligatorias:

1. exportación de resultados en JSON o CSV
2. patrones de llegada adicionales
3. fallos, reintentos y backoff
4. varias repeticiones de escenarios aleatorios
5. gráfica de longitud de cola
6. importación de una lista genérica de tareas
7. demostración separada con una cola operativa real

No implementar varias opciones en paralelo. Seleccionar una, terminarla y
volver a verificar el flujo completo.

## 6. Seguimiento de progreso

Mantener una tabla como esta en el README o en un documento de seguimiento:

| Fase | Estado | Evidencia | Bloqueos | Próxima acción |
|---|---|---|---|---|
| 0. Inicialización | Pendiente |  |  |  |
| 1. Dominio | Pendiente |  |  |  |
| 2. Motor FIFO | Pendiente |  |  |  |
| 3. Políticas | Pendiente |  |  |  |
| 4. Generador y métricas | Pendiente |  |  |  |
| 5. API y persistencia | Pendiente |  |  |  |
| 6. Interfaz funcional | Pendiente |  |  |  |
| 7. Visualización | Pendiente |  |  |  |
| 8. Calidad | Pendiente |  |  |  |
| 9. Entrega | Pendiente |  |  |  |
| 10. Vídeo | Pendiente |  |  |  |

Estados permitidos: `Pendiente`, `En curso`, `Bloqueada` y `Completada`.

Una fase solo se marca como completada cuando existe evidencia verificable:
tests, endpoint funcional, captura, documento actualizado o demostración.

## 7. Regla para tomar decisiones bajo presión de tiempo

Cuando una tarea amenace el calendario, aplicar este orden:

1. proteger la corrección del motor
2. proteger la comparación equivalente entre políticas
3. proteger la persistencia y recuperación de resultados
4. proteger el flujo web de extremo a extremo
5. proteger pruebas y documentación de ejecución
6. reducir gráficos y refinamientos visuales
7. eliminar funcionalidades opcionales

Nunca reducir la calidad ocultando errores, eliminando pruebas significativas o
presentando como implementado aquello que todavía está planificado.

