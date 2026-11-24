import {
  Alert,
  Button,
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
import type { PolicyConfiguration } from '@queuescope/contracts';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router';

import { getComparison } from './api';

const numberFormat = new Intl.NumberFormat('ca-ES', {
  maximumFractionDigits: 2,
});

function formatValue(value: number | null): string {
  return value === null ? 'No definit' : numberFormat.format(value);
}

function policyName(policy: PolicyConfiguration): string {
  if (policy.id === 'fifo') return 'FIFO';
  if (policy.id === 'strict-priority') return 'Prioritat estricta';
  return `Prioritat amb envelliment (${policy.agingInterval} ticks)`;
}

export function ComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const comparison = useQuery({
    queryKey: ['comparisons', id],
    queryFn: () => getComparison(id ?? ''),
    enabled: Boolean(id),
  });

  return (
    <Stack spacing={3}>
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
          <Typography component="h1" variant="h4">
            Comparació de {comparison.data.scenarioSnapshot.name}
          </Typography>
          <Typography>
            {comparison.data.scenarioSnapshot.tasks.length}{' '}
            {comparison.data.scenarioSnapshot.tasks.length === 1
              ? 'tasca'
              : 'tasques'}{' '}
            · {comparison.data.scenarioSnapshot.workers.count}{' '}
            {comparison.data.scenarioSnapshot.workers.count === 1
              ? 'worker'
              : 'workers'}{' '}
            · {comparison.data.runs.length} polítiques
          </Typography>
          <Alert severity="info">
            Els valors provenen d'una simulació en ticks de temps virtual i no
            mesuren el rendiment real del servidor.
          </Alert>
          <Typography component="h2" variant="h5">
            Resum de resultats
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Comparació de mètriques">
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
                      {policyName(run.policy)}
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
          <Typography component="h2" variant="h5">
            Resultats per prioritat inicial
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Mètriques per prioritat inicial">
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
                        {policyName(run.policy)}
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
          <Link
            component={RouterLink}
            to={`/scenarios/${encodeURIComponent(comparison.data.scenarioSnapshot.id)}`}
          >
            Veure l'escenari utilitzat
          </Link>
        </>
      )}
    </Stack>
  );
}
