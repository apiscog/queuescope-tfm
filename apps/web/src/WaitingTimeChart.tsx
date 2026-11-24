import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import type { RunResult } from '@queuescope/contracts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { policyColors, policyName } from './comparison-presentation';

const numberFormat = new Intl.NumberFormat('ca-ES', {
  maximumFractionDigits: 2,
});

export function WaitingTimeChart({ runs }: { runs: RunResult[] }) {
  if (runs.every((run) => run.metrics.completedTaskCount === 0)) {
    return (
      <Alert severity="info">
        No hi ha temps d'espera per representar perquè no s'ha completat cap
        tasca.
      </Alert>
    );
  }

  const data = [
    {
      metric: 'Mitjana',
      ...Object.fromEntries(
        runs.map((run) => [run.runId, run.metrics.waitingTime.mean]),
      ),
    },
    {
      metric: 'P95',
      ...Object.fromEntries(
        runs.map((run) => [run.runId, run.metrics.waitingTime.p95]),
      ),
    },
    {
      metric: 'Màxim',
      ...Object.fromEntries(
        runs.map((run) => [run.runId, run.metrics.waitingTime.maximum]),
      ),
    },
  ];

  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5" id="waiting-time-title">
          Temps d'espera per política
        </Typography>
        <Typography color="text.secondary" id="waiting-time-description">
          Com canvien l'espera mitjana, el percentil 95 i l'espera màxima segons
          la política? Tots els valors són ticks de temps virtual. La taula
          anterior mostra les xifres exactes.
        </Typography>
        <Box
          component="figure"
          role="img"
          aria-labelledby="waiting-time-title"
          aria-describedby="waiting-time-description"
          sx={{ m: 0, width: '100%', height: 360 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 16, bottom: 24, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" />
              <YAxis
                width={52}
                allowDecimals
                tickFormatter={(value: number) => numberFormat.format(value)}
                label={{ value: 'Ticks', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) =>
                  `${numberFormat.format(Number(value))} ticks`
                }
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 12 }}
              />
              {runs.map((run) => (
                <Bar
                  key={run.runId}
                  dataKey={run.runId}
                  name={policyName(run.policy)}
                  fill={policyColors[run.policy.id]}
                  maxBarSize={52}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Paper>
  );
}
