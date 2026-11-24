import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { TaskResult } from '@queuescope/contracts';
import { useEffect, useState } from 'react';

import { colors } from './theme';

function TaskBox({ id, color }: { id: string; color: string }) {
  return (
    <Chip
      label={id}
      sx={{
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 750,
        color: colors.ink,
        bgcolor: '#FFFFFF',
        border: `1px solid ${colors.line}`,
        borderLeft: `4px solid ${color}`,
        '@media (prefers-reduced-motion: no-preference)': {
          animation: 'queue-appear 220ms ease-out',
        },
        '@keyframes queue-appear': {
          from: { opacity: 0, transform: 'translateY(5px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    />
  );
}

export function TaskReplay({
  taskResults,
  workerIds,
  color,
}: {
  taskResults: TaskResult[];
  workerIds: string[];
  color: string;
}) {
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)',
  );
  const ticks = [
    ...new Set(
      taskResults.flatMap((task) => [
        task.arrivalTime,
        task.serviceStartTime,
        task.completionTime,
      ]),
    ),
  ].sort((left, right) => left - right);
  const [eventIndex, setEventIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastIndex = ticks.length - 1;
  const currentTick = ticks[eventIndex] ?? 0;
  const isPlaying = playing && eventIndex < lastIndex && !prefersReducedMotion;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(
      () => setEventIndex((index) => Math.min(index + 1, lastIndex)),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [isPlaying, eventIndex, lastIndex]);

  if (ticks.length === 0) return null;

  const pending = taskResults.filter(
    (task) =>
      task.arrivalTime <= currentTick && task.serviceStartTime > currentTick,
  );
  const completed = taskResults.filter(
    (task) => task.completionTime <= currentTick,
  );
  const notArrived = taskResults.filter(
    (task) => task.arrivalTime > currentTick,
  ).length;
  const arriving = taskResults.filter(
    (task) => task.arrivalTime === currentTick,
  ).length;
  const starting = taskResults.filter(
    (task) => task.serviceStartTime === currentTick,
  ).length;
  const finishing = taskResults.filter(
    (task) => task.completionTime === currentTick,
  ).length;

  function playOrPause() {
    if (isPlaying) {
      setPlaying(false);
    } else {
      if (eventIndex === lastIndex) setEventIndex(0);
      setPlaying(true);
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: '#E9F0E8' }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography component="h3" variant="h6">
            Recorregut per esdeveniments
          </Typography>
          <Typography color="text.secondary">
            Avança pels ticks en què arriba, comença o acaba alguna tasca. Cada
            pantalla mostra l'estat després dels canvis d'aquell tick.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
          {!prefersReducedMotion && (
            <Button variant="contained" onClick={playOrPause}>
              {isPlaying
                ? 'Pausa'
                : eventIndex === lastIndex
                  ? 'Reprodueix de nou'
                  : 'Inicia'}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => {
              setPlaying(false);
              setEventIndex(Math.max(0, eventIndex - 1));
            }}
            disabled={eventIndex === 0}
          >
            Esdeveniment anterior
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setPlaying(false);
              setEventIndex(Math.min(lastIndex, eventIndex + 1));
            }}
            disabled={eventIndex === lastIndex}
          >
            Esdeveniment següent
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setPlaying(false);
              setEventIndex(0);
            }}
            disabled={eventIndex === 0}
          >
            Torna a l'inici
          </Button>
        </Stack>
        {prefersReducedMotion && (
          <Typography variant="body2" color="text.secondary">
            La reproducció automàtica està desactivada per la configuració de
            moviment reduït. Pots avançar manualment.
          </Typography>
        )}
        <Box role="status" aria-live="polite">
          <Typography
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 800,
              color: colors.green,
            }}
          >
            TICK {currentTick} · ESDEVENIMENT {eventIndex + 1} DE {ticks.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En aquest tick: {arriving}{' '}
            {arriving === 1 ? 'arribada' : 'arribades'}, {starting}{' '}
            {starting === 1 ? 'inici' : 'inicis'} i {finishing}{' '}
            {finishing === 1 ? 'finalització' : 'finalitzacions'}.
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={lastIndex === 0 ? 100 : (eventIndex / lastIndex) * 100}
          aria-label="Progrés de la reproducció"
          sx={{ height: 7, borderRadius: 3, bgcolor: '#C8DCCB' }}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr)',
            },
            gap: 2,
          }}
        >
          <Paper
            component="section"
            variant="outlined"
            aria-label="Tasques en cua"
            sx={{ p: 2, minHeight: 140 }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1 }}>
              En cua · {pending.length}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {pending.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Cap tasca esperant.
                </Typography>
              ) : (
                pending.map((task) => (
                  <TaskBox
                    key={task.taskId}
                    id={task.taskId}
                    color={colors.muted}
                  />
                ))
              )}
            </Stack>
          </Paper>
          <Paper
            component="section"
            variant="outlined"
            aria-label="Estat dels workers"
            sx={{ p: 2, minHeight: 140 }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Workers</Typography>
            <Stack spacing={1}>
              {workerIds.map((workerId) => {
                const active = taskResults.find(
                  (task) =>
                    task.workerId === workerId &&
                    task.serviceStartTime <= currentTick &&
                    task.completionTime > currentTick,
                );
                return (
                  <Box
                    key={workerId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      p: 1,
                      border: `1px solid ${colors.line}`,
                      borderRadius: 1.5,
                      bgcolor: active ? '#F7FBF6' : '#FFFFFF',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 12,
                        fontWeight: 750,
                      }}
                    >
                      {workerId}
                    </Typography>
                    {active ? (
                      <TaskBox id={active.taskId} color={color} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Lliure
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>
          <Paper
            component="section"
            variant="outlined"
            aria-label="Tasques completades"
            sx={{ p: 2, minHeight: 140 }}
          >
            <Typography sx={{ fontWeight: 800, mb: 1 }}>
              Acabades · {completed.length}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {completed.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Encara cap tasca.
                </Typography>
              ) : (
                completed.map((task) => (
                  <TaskBox
                    key={task.taskId}
                    id={task.taskId}
                    color={colors.green}
                  />
                ))
              )}
            </Stack>
          </Paper>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {notArrived}{' '}
          {notArrived === 1
            ? 'tasca encara no ha arribat'
            : 'tasques encara no han arribat'}
          . La reproducció avança entre esdeveniments cada 0,9 segons de
          pantalla, independentment dels ticks simulats. La línia temporal de
          sota conserva tots els temps exactes.
        </Typography>
      </Stack>
    </Paper>
  );
}
