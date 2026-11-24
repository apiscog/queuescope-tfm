import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
  useParams,
} from 'react-router';

import { getScenario, listScenarios } from './api';
import { PolicyPicker } from './PolicyPicker';
import { ScenarioForm } from './ScenarioForm';

const ComparisonPage = lazy(() =>
  import('./ComparisonPage').then((module) => ({
    default: module.ComparisonPage,
  })),
);

function QueryFeedback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={retry}>
          Torna-ho a provar
        </Button>
      }
    >
      {error.message}
    </Alert>
  );
}

function LoadingState() {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center' }}
      spacing={2}
      role="status"
    >
      <CircularProgress size={24} />
      <Typography>
        Carregant dades. El servidor pot trigar a respondre.
      </Typography>
    </Stack>
  );
}

function ScenarioList() {
  const scenarios = useQuery({
    queryKey: ['scenarios'],
    queryFn: listScenarios,
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h4" gutterBottom>
          Escenaris
        </Typography>
        <Typography color="text.secondary">
          Consulta les càrregues de tasques desades abans de comparar
          polítiques.
        </Typography>
        <Button
          component={RouterLink}
          to="/scenarios/new"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Crea un escenari
        </Button>
      </Box>
      {scenarios.isPending && <LoadingState />}
      {scenarios.isError && (
        <QueryFeedback
          error={scenarios.error}
          retry={() => void scenarios.refetch()}
        />
      )}
      {scenarios.data?.length === 0 && (
        <Alert severity="info">Encara no hi ha cap escenari desat.</Alert>
      )}
      {scenarios.data && scenarios.data.length > 0 && (
        <Stack spacing={2}>
          {scenarios.data.map((scenario) => (
            <Card key={scenario.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                  }}
                  spacing={2}
                >
                  <Box>
                    <Typography component="h2" variant="h6">
                      {scenario.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {scenario.tasks.length}{' '}
                      {scenario.tasks.length === 1 ? 'tasca' : 'tasques'} ·{' '}
                      {scenario.workers.count}{' '}
                      {scenario.workers.count === 1 ? 'worker' : 'workers'}
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={`/scenarios/${encodeURIComponent(scenario.id)}`}
                  >
                    Veure escenari
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function ScenarioDetail() {
  const { id } = useParams<{ id: string }>();
  const scenario = useQuery({
    queryKey: ['scenarios', id],
    queryFn: () => getScenario(id ?? ''),
    enabled: Boolean(id),
  });

  return (
    <Stack spacing={3}>
      <Link component={RouterLink} to="/" underline="hover">
        ← Tornar als escenaris
      </Link>
      {scenario.isPending && <LoadingState />}
      {scenario.isError && (
        <QueryFeedback
          error={scenario.error}
          retry={() => void scenario.refetch()}
        />
      )}
      {scenario.data && (
        <>
          <Box>
            <Typography component="h1" variant="h4" gutterBottom>
              {scenario.data.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap' }}
              useFlexGap
            >
              <Chip
                label={`${scenario.data.tasks.length} ${scenario.data.tasks.length === 1 ? 'tasca' : 'tasques'}`}
              />
              <Chip
                label={`${scenario.data.workers.count} ${scenario.data.workers.count === 1 ? 'worker' : 'workers'}`}
              />
              <Chip
                label={
                  scenario.data.source.kind === 'generated'
                    ? 'Generat'
                    : 'Manual'
                }
              />
            </Stack>
          </Box>
          {scenario.data.source.kind === 'generated' && (
            <Alert severity="info">
              Càrrega reproduïble amb la llavor{' '}
              {scenario.data.source.parameters.seed}.
            </Alert>
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Tasques de l'escenari">
              <TableHead>
                <TableRow>
                  <TableCell>Tasca</TableCell>
                  <TableCell>Tipus</TableCell>
                  <TableCell align="right">Arribada (ticks)</TableCell>
                  <TableCell align="right">Durada (ticks)</TableCell>
                  <TableCell align="right">Prioritat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scenario.data.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.id}</TableCell>
                    <TableCell>{task.type}</TableCell>
                    <TableCell align="right">{task.arrivalTime}</TableCell>
                    <TableCell align="right">{task.serviceDuration}</TableCell>
                    <TableCell align="right">{task.initialPriority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <PolicyPicker scenarioId={scenario.data.id} />
        </>
      )}
    </Stack>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            color="inherit"
            sx={{ textDecoration: 'none' }}
          >
            QueueScope
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<ScenarioList />} />
          <Route path="/scenarios/new" element={<ScenarioForm />} />
          <Route path="/scenarios/:id" element={<ScenarioDetail />} />
          <Route
            path="/comparisons/:id"
            element={
              <Suspense fallback={<LoadingState />}>
                <ComparisonPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Alert severity="warning">No s'ha trobat la pàgina.</Alert>
            }
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
