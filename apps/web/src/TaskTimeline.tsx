import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { RunResult, TaskResult } from '@queuescope/contracts';
import { useState } from 'react';

import { policyColors, policyName } from './comparison-presentation';
import { TaskReplay } from './TaskReplay';
import { colors } from './theme';

function percent(value: number, start: number, span: number): string {
  return `${((value - start) / span) * 100}%`;
}

function width(start: number, end: number, span: number): string {
  return `${((end - start) / span) * 100}%`;
}

function TimelineTask({
  task,
  start,
  span,
  color,
}: {
  task: TaskResult;
  start: number;
  span: number;
  color: string;
}) {
  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gridTemplateColumns: '125px minmax(420px, 1fr) 225px',
        gap: 2,
        alignItems: 'center',
        listStyle: 'none',
        minHeight: 58,
        borderTop: `1px solid ${colors.line}`,
      }}
    >
      <Typography
        sx={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          fontWeight: 750,
        }}
      >
        {task.taskId}
      </Typography>
      <Box
        role="img"
        aria-label={`${task.taskId}: arriba al tick ${task.arrivalTime}, espera ${task.waitingTime} ticks i es processa del tick ${task.serviceStartTime} al ${task.completionTime}`}
        sx={{
          position: 'relative',
          height: 24,
          backgroundImage: `linear-gradient(to right, ${colors.line} 1px, transparent 1px)`,
          backgroundSize: '25% 100%',
          borderRight: `1px solid ${colors.line}`,
        }}
      >
        {task.waitingTime > 0 && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              left: percent(task.arrivalTime, start, span),
              width: width(task.arrivalTime, task.serviceStartTime, span),
              top: 6,
              height: 12,
              border: `1px dashed ${colors.muted}`,
              bgcolor: '#E5EBE5',
              borderRadius: 1,
            }}
          />
        )}
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left: percent(task.serviceStartTime, start, span),
            width: width(task.serviceStartTime, task.completionTime, span),
            top: 3,
            height: 18,
            bgcolor: color,
            borderRadius: 1,
          }}
        />
      </Box>
      <Typography
        sx={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          color: colors.muted,
        }}
      >
        {task.arrivalTime} → {task.serviceStartTime} → {task.completionTime}
        <Box component="span" sx={{ display: 'block', fontFamily: 'inherit' }}>
          Espera: {task.waitingTime} ticks
        </Box>
      </Typography>
    </Box>
  );
}

export function TaskTimeline({
  runs,
  workerCount,
}: {
  runs: RunResult[];
  workerCount: number;
}) {
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.runId ?? '');
  const run =
    runs.find((candidate) => candidate.runId === selectedRunId) ?? runs[0];

  if (!run) return null;

  const results = run.taskResults;
  const start = Math.min(...results.map((task) => task.arrivalTime));
  const end = Math.max(...results.map((task) => task.completionTime));
  const span = end - start;
  const workerIds = [
    ...new Set([
      ...Array.from(
        { length: workerCount },
        (_, index) => `worker-${index + 1}`,
      ),
      ...results.map((task) => task.workerId),
    ]),
  ];
  const ticks =
    span > 0
      ? [
          ...new Set(
            Array.from({ length: 5 }, (_, index) =>
              Math.round(start + (span * index) / 4),
            ),
          ),
        ]
      : [];

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="task-timeline-title"
      sx={{ p: { xs: 2.5, sm: 3.5 } }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 270px' },
            gap: 2,
            alignItems: 'end',
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.green,
                fontWeight: 800,
                letterSpacing: '0.15em',
              }}
            >
              RECORREGUT DE LES TASQUES
            </Typography>
            <Typography component="h2" variant="h5" id="task-timeline-title">
              Línia temporal per worker
            </Typography>
            <Typography color="text.secondary">
              Compara quan arriba cada tasca, quant espera i quan ocupa un
              worker. Els temps provenen de l'execució desada.
            </Typography>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel id="timeline-policy-label">
              Política de la línia temporal
            </InputLabel>
            <Select
              labelId="timeline-policy-label"
              label="Política de la línia temporal"
              value={run.runId}
              onChange={(event) => setSelectedRunId(event.target.value)}
            >
              {runs.map((candidate) => (
                <MenuItem key={candidate.runId} value={candidate.runId}>
                  {policyName(candidate.policy)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {results.length === 0 || span <= 0 ? (
          <Alert severity="info">
            Aquesta execució no conté tasques amb un interval de servei per
            representar.
          </Alert>
        ) : (
          <>
            <TaskReplay
              key={run.runId}
              taskResults={results}
              workerIds={workerIds}
              color={policyColors[run.policy.id]}
            />
            <Stack
              direction="row"
              spacing={2}
              sx={{ flexWrap: 'wrap' }}
              useFlexGap
            >
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 10,
                    border: `1px dashed ${colors.muted}`,
                    bgcolor: '#E5EBE5',
                  }}
                  aria-hidden="true"
                />
                <Typography variant="body2">En espera</Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 10,
                    bgcolor: policyColors[run.policy.id],
                  }}
                  aria-hidden="true"
                />
                <Typography variant="body2">En servei</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Cada fila mostra una tasca, agrupada pel worker assignat.
              </Typography>
            </Stack>
            <Box
              sx={{
                overflowX: 'auto',
                border: `1px solid ${colors.line}`,
                borderRadius: 2,
                bgcolor: '#FAFCF9',
              }}
            >
              <Box sx={{ minWidth: 800, p: 2.5 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '125px minmax(420px, 1fr) 225px',
                    gap: 2,
                    alignItems: 'end',
                    pb: 1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 800, color: colors.muted }}
                  >
                    TASCA
                  </Typography>
                  <Box sx={{ position: 'relative', height: 30 }}>
                    {ticks.map((tick) => (
                      <Typography
                        key={tick}
                        sx={{
                          position: 'absolute',
                          left: percent(tick, start, span),
                          transform:
                            tick === end
                              ? 'translateX(-100%)'
                              : tick === start
                                ? 'none'
                                : 'translateX(-50%)',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.muted,
                        }}
                      >
                        {tick}
                      </Typography>
                    ))}
                  </Box>
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 800, color: colors.muted }}
                  >
                    ARRIBA → INICIA → ACABA
                  </Typography>
                </Box>
                {workerIds.map((workerId) => {
                  const tasks = results
                    .filter((task) => task.workerId === workerId)
                    .sort(
                      (left, right) =>
                        left.serviceStartTime - right.serviceStartTime ||
                        left.taskId.localeCompare(right.taskId),
                    );
                  return (
                    <Box key={workerId} sx={{ mt: 1.5 }}>
                      <Typography
                        component="h3"
                        sx={{ fontWeight: 800, color: colors.green, mb: 0.5 }}
                      >
                        {workerId} · {tasks.length}{' '}
                        {tasks.length === 1 ? 'tasca' : 'tasques'}
                      </Typography>
                      {tasks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Cap tasca assignada.
                        </Typography>
                      ) : (
                        <Box component="ul" sx={{ m: 0, p: 0 }}>
                          {tasks.map((task) => (
                            <TimelineTask
                              key={task.taskId}
                              task={task}
                              start={start}
                              span={span}
                              color={policyColors[run.policy.id]}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              L'eix comença al primer tick d'arribada ({start}) i acaba al
              darrer tick de finalització ({end}). És temps virtual, no temps
              real d'espera a la web. La franja d'espera s'agrupa amb el worker
              que finalment executa la tasca. No indica que el worker estigui
              reservat durant aquesta espera.
            </Typography>
          </>
        )}
      </Stack>
    </Paper>
  );
}
