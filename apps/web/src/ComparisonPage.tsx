import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { RunResult } from '@queuescope/contracts';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router';

import { getComparison } from './api';
import { policyColors, policyName } from './comparison-presentation';
import { PriorityWaitingChart } from './PriorityWaitingChart';
import { TaskTimeline } from './TaskTimeline';
import { colors } from './theme';
import { WaitingTimeChart } from './WaitingTimeChart';

const numberFormat = new Intl.NumberFormat('ca-ES', {
  maximumFractionDigits: 2,
});

function formatValue(value: number | null): string {
  return value === null ? 'No definit' : numberFormat.format(value);
}

function p95Insight(runs: RunResult[]): string | null {
  const values = runs
    .flatMap((run) => {
      const value = run.metrics.waitingTime.p95;
      return value === null ? [] : [{ name: policyName(run.policy), value }];
    })
    .sort((left, right) => left.value - right.value);

  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  if (!first || !last) return null;
  if (first.value === last.value) {
    return `En aquest escenari, totes les polítiques tenen el mateix P95 d'espera: ${formatValue(first.value)} ticks.`;
  }
  const lowestNames = values
    .filter((item) => item.value === first.value)
    .map((item) => item.name)
    .join(' i ');
  const highestNames = values
    .filter((item) => item.value === last.value)
    .map((item) => item.name)
    .join(' i ');
  return `En aquest escenari, el P95 d'espera va de ${formatValue(first.value)} ticks (${lowestNames}) a ${formatValue(last.value)} ticks (${highestNames}).`;
}

function PolicyLabel({ run }: { run: RunResult }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', minWidth: 155 }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: policyColors[run.policy.id],
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>{policyName(run.policy)}</span>
    </Stack>
  );
}

export function ComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const comparison = useQuery({
    queryKey: ['comparisons', id],
    queryFn: () => getComparison(id ?? ''),
    enabled: Boolean(id),
  });
  const insight = comparison.data ? p95Insight(comparison.data.runs) : null;

  return (
    <Stack spacing={4}>
      <Link component={RouterLink} to="/" underline="hover">
        ← Tornar als escenaris
      </Link>
      {comparison.isPending && (
        <Stack
          direction="row"
          spacing={2}
          role="status"
          sx={{ alignItems: 'center' }}
        >
          <CircularProgress size={24} />
          <Typography>
            Carregant la comparació. El servidor pot trigar a respondre.
          </Typography>
        </Stack>
      )}
      {comparison.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void comparison.refetch()}>
              Torna-ho a provar
            </Button>
          }
        >
          {comparison.error.message}
        </Alert>
      )}
      {comparison.data && (
        <>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: '#E9F0E8' }}
          >
            <Stack spacing={2.5}>
              <Typography
                variant="overline"
                sx={{
                  color: colors.green,
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                }}
              >
                04 / RESULTATS
              </Typography>
              <Typography component="h1" variant="h4">
                Comparació de {comparison.data.scenarioSnapshot.name}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap' }}
                useFlexGap
              >
                <Chip
                  label={`${comparison.data.scenarioSnapshot.tasks.length} ${comparison.data.scenarioSnapshot.tasks.length === 1 ? 'tasca' : 'tasques'}`}
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
                <Chip
                  label={`${comparison.data.scenarioSnapshot.workers.count} ${comparison.data.scenarioSnapshot.workers.count === 1 ? 'worker' : 'workers'}`}
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
                <Chip
                  label={`${comparison.data.runs.length} polítiques`}
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
              </Stack>
              <Button
                component={RouterLink}
                to={`/scenarios/${encodeURIComponent(comparison.data.scenarioSnapshot.id)}`}
                variant="outlined"
                sx={{ alignSelf: 'flex-start', bgcolor: '#FFFFFF' }}
              >
                Veure l'escenari utilitzat
              </Button>
              <Link
                href="#task-timeline-title"
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
              >
                Veure el recorregut de les tasques ↓
              </Link>
            </Stack>
          </Paper>
          <Alert severity="info">
            Els valors provenen d'una simulació en ticks de temps virtual i no
            mesuren el rendiment real del servidor.
          </Alert>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.green,
                fontWeight: 800,
                letterSpacing: '0.15em',
              }}
            >
              LECTURA PRINCIPAL
            </Typography>
            <Typography component="h2" variant="h5">
              Resum de resultats
            </Typography>
            <Typography color="text.secondary">
              La mateixa càrrega, mesurada amb cada política. Desplaça la taula
              horitzontalment si cal.
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ overflowX: 'auto' }}
          >
            <Table
              size="small"
              aria-label="Comparació de mètriques"
              sx={{ minWidth: 850 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Política</TableCell>
                  <TableCell align="right">Tasques acabades</TableCell>
                  <TableCell align="right">Espera mitjana (ticks)</TableCell>
                  <TableCell align="right">Mediana (ticks)</TableCell>
                  <TableCell align="right">P95 (ticks)</TableCell>
                  <TableCell align="right">Espera màxima (ticks)</TableCell>
                  <TableCell align="right">Tasques per tick</TableCell>
                  <TableCell align="right">Utilització (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.data.runs.map((run) => (
                  <TableRow key={run.runId}>
                    <TableCell component="th" scope="row">
                      <PolicyLabel run={run} />
                    </TableCell>
                    <TableCell align="right">
                      {run.metrics.completedTaskCount}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(run.metrics.waitingTime.mean)}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(run.metrics.waitingTime.median)}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(run.metrics.waitingTime.p95)}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(run.metrics.waitingTime.maximum)}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(run.metrics.throughput)}
                    </TableCell>
                    <TableCell align="right">
                      {formatValue(
                        run.metrics.workerUtilization === null
                          ? null
                          : run.metrics.workerUtilization * 100,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {insight && (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderLeft: `4px solid ${colors.green}`,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: colors.green,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                }}
              >
                QUÈ MOSTRA AQUEST CAS?
              </Typography>
              <Typography sx={{ fontWeight: 650 }}>{insight}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                El P95 és el valor que deixa almenys el 95 % de les esperes
                iguals o per sota. Llegeix-lo juntament amb la resta de
                mètriques.
              </Typography>
            </Paper>
          )}
          <WaitingTimeChart runs={comparison.data.runs} />
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.green,
                fontWeight: 800,
                letterSpacing: '0.15em',
              }}
            >
              LECTURA PER GRUPS
            </Typography>
            <Typography component="h2" variant="h5">
              Resultats per prioritat inicial
            </Typography>
            <Typography color="text.secondary">
              Com varia l'espera de les tasques segons la prioritat que tenien
              en arribar?
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ overflowX: 'auto' }}
          >
            <Table
              size="small"
              aria-label="Mètriques per prioritat inicial"
              sx={{ minWidth: 640 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Política</TableCell>
                  <TableCell align="right">Prioritat</TableCell>
                  <TableCell align="right">Tasques</TableCell>
                  <TableCell align="right">Espera mitjana (ticks)</TableCell>
                  <TableCell align="right">P95 (ticks)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.data.runs.flatMap((run) =>
                  run.metrics.byInitialPriority.map((group) => (
                    <TableRow key={`${run.runId}-${group.initialPriority}`}>
                      <TableCell component="th" scope="row">
                        <PolicyLabel run={run} />
                      </TableCell>
                      <TableCell align="right">
                        {group.initialPriority}
                      </TableCell>
                      <TableCell align="right">
                        {group.completedTaskCount}
                      </TableCell>
                      <TableCell align="right">
                        {formatValue(group.waitingTime.mean)}
                      </TableCell>
                      <TableCell align="right">
                        {formatValue(group.waitingTime.p95)}
                      </TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <PriorityWaitingChart runs={comparison.data.runs} />
          <TaskTimeline
            runs={comparison.data.runs}
            workerCount={comparison.data.scenarioSnapshot.workers.count}
          />
        </>
      )}
    </Stack>
  );
}
