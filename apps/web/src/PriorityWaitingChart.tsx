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

export function PriorityWaitingChart({ runs }: { runs: RunResult[] }) {
  const priorities = [
    ...new Set(
      runs.flatMap((run) =>
        run.metrics.byInitialPriority.map((group) => group.initialPriority),
      ),
    ),
  ].sort((left, right) => left - right);

  if (priorities.length === 0) {
    return (
      <Alert severity="info">
        No hi ha grups de prioritat per representar perquè no s'ha completat cap
        tasca.
      </Alert>
    );
  }

  const data = priorities.map((priority) => ({
    priority: String(priority),
    ...Object.fromEntries(
      runs.map((run) => [
        run.runId,
        run.metrics.byInitialPriority.find(
          (group) => group.initialPriority === priority,
        )?.waitingTime.mean ?? null,
      ]),
    ),
  }));

  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5" id="priority-waiting-title">
          Espera mitjana per prioritat inicial
        </Typography>
        <Typography color="text.secondary" id="priority-waiting-description">
          Quines prioritats esperen més amb cada política? L'eix horitzontal
          mostra la prioritat inicial i l'eix vertical, l'espera mitjana en
          ticks. La taula anterior conserva les xifres exactes.
        </Typography>
        <Box
          component="figure"
          role="img"
          aria-labelledby="priority-waiting-title"
          aria-describedby="priority-waiting-description"
          sx={{ m: 0, width: '100%', height: 380 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 16, bottom: 36, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="priority"
                label={{
                  value: 'Prioritat inicial',
                  position: 'insideBottom',
                  offset: -8,
                }}
              />
              <YAxis
                width={60}
                allowDecimals
                tickFormatter={(value: number) => numberFormat.format(value)}
                label={{
                  value: 'Espera (ticks)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                formatter={(value) =>
                  `${numberFormat.format(Number(value))} ticks`
                }
                labelFormatter={(label) => `Prioritat inicial ${String(label)}`}
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
