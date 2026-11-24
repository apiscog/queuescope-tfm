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
import { ThemeProvider } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';

import { getScenario, listScenarios } from './api';
import { PolicyPicker } from './PolicyPicker';
import { QueueIllustration } from './QueueIllustration';
import { QueueMark } from './QueueMark';
import { ScenarioForm } from './ScenarioForm';
import { colors, theme } from './theme';

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
    <Stack spacing={{ xs: 6, md: 8 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        <Stack spacing={3} sx={{ py: { xs: 1, md: 5 } }}>
          <Typography
            variant="overline"
            sx={{
              color: colors.green,
              fontWeight: 800,
              letterSpacing: '0.17em',
            }}
          >
            LABORATORI DE PLANIFICACIÓ
          </Typography>
          <Typography component="h1" variant="h1">
            Cada tasca té el seu torn.
            <Box
              component="span"
              sx={{ color: colors.green, display: 'block' }}
            >
              Tu tries l'ordre.
            </Box>
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: '1.125rem', maxWidth: 540, lineHeight: 1.65 }}
          >
            Crea una càrrega sintètica, compara polítiques de cua i descobreix
            com canvia l'espera de cada tasca.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button
              component={RouterLink}
              to="/scenarios/new"
              variant="contained"
              size="large"
            >
              Crea un escenari →
            </Button>
            <Button component="a" href="#escenaris" variant="text" size="large">
              Explora els escenaris
            </Button>
          </Stack>
          <Typography sx={{ color: colors.muted, fontSize: 13 }}>
            Simulació reproduïble · Temps virtual · Resultats comparables
          </Typography>
        </Stack>
        <QueueIllustration />
      </Box>
      <Box id="escenaris" sx={{ scrollMarginTop: 100 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            mb: 3,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
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
              01 / PUNT DE PARTIDA
            </Typography>
            <Typography component="h2" variant="h4">
              Escenaris
            </Typography>
            <Typography color="text.secondary">
              Tria una càrrega desada o prepara'n una de nova.
            </Typography>
          </Box>
          {scenarios.data && scenarios.data.length > 0 && (
            <Typography
              sx={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 13,
                color: colors.muted,
              }}
            >
              {scenarios.data.length}{' '}
              {scenarios.data.length === 1
                ? 'escenari disponible'
                : 'escenaris disponibles'}
            </Typography>
          )}
        </Stack>
        {scenarios.isPending && <LoadingState />}
        {scenarios.isError && (
          <QueryFeedback
            error={scenarios.error}
            retry={() => void scenarios.refetch()}
          />
        )}
        {scenarios.data?.length === 0 && (
          <Card variant="outlined">
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="h6">La cua encara és buida</Typography>
                <Typography color="text.secondary">
                  Crea el primer escenari per començar a comparar polítiques.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/scenarios/new"
                  variant="contained"
                >
                  Crea un escenari
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
        {scenarios.data && scenarios.data.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2.5,
            }}
          >
            {scenarios.data.map((scenario) => (
              <Card
                key={scenario.id}
                variant="outlined"
                sx={{
                  height: '100%',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 18px 40px rgba(24, 52, 38, 0.10)',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '&:hover': { transform: 'none' },
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
                  <Stack spacing={2.5} sx={{ height: '100%' }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Chip
                        size="small"
                        label={
                          scenario.source.kind === 'generated'
                            ? 'Generat'
                            : 'Manual'
                        }
                        sx={{
                          bgcolor: colors.greenLight,
                          color: colors.green,
                          fontWeight: 700,
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                          color: colors.muted,
                        }}
                      >
                        ESCENARI
                      </Typography>
                    </Stack>
                    <Box>
                      <Typography component="h3" variant="h6" sx={{ mb: 0.7 }}>
                        {scenario.name}
                      </Typography>
                      <Typography color="text.secondary">
                        {scenario.tasks.length}{' '}
                        {scenario.tasks.length === 1 ? 'tasca' : 'tasques'} ·{' '}
                        {scenario.workers.count}{' '}
                        {scenario.workers.count === 1 ? 'worker' : 'workers'}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      component={RouterLink}
                      to={`/scenarios/${encodeURIComponent(scenario.id)}`}
                      aria-label={`Veure escenari: ${scenario.name}`}
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Veure escenari →
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Stack>
  );
}

function SiteHeader() {
  const location = useLocation();
  const isNew = location.pathname === '/scenarios/new';
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        bgcolor: 'rgba(245,244,237,0.95)',
        borderBottom: `1px solid ${colors.line}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 70, sm: 78 }, gap: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            aria-label="QueueScope, torna a l'inici"
            sx={{
              color: colors.ink,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
              <QueueMark compact />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <QueueMark />
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            component="nav"
            aria-label="Navegació principal"
            direction="row"
            spacing={{ xs: 0.5, sm: 1.5 }}
            sx={{ alignItems: 'center' }}
          >
            <Button
              component={RouterLink}
              to="/"
              aria-current={location.pathname === '/' ? 'page' : undefined}
              color="inherit"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                color: location.pathname === '/' ? colors.green : colors.ink,
              }}
            >
              Escenaris
            </Button>
            <Button
              component={RouterLink}
              to="/scenarios/new"
              aria-current={isNew ? 'page' : undefined}
              variant={isNew ? 'outlined' : 'contained'}
              size="small"
            >
              Crea un escenari
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
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
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 4 },
              bgcolor: '#E9F0E8',
              overflow: 'hidden',
            }}
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
                02 / CÀRREGA DESADA
              </Typography>
              <Typography component="h1" variant="h4">
                {scenario.data.name}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 660 }}>
                Aquestes tasques i workers formaran una instantània igual per a
                cada política que comparis.
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap' }}
                useFlexGap
              >
                <Chip
                  label={`${scenario.data.tasks.length} ${scenario.data.tasks.length === 1 ? 'tasca' : 'tasques'}`}
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
                <Chip
                  label={`${scenario.data.workers.count} ${scenario.data.workers.count === 1 ? 'worker' : 'workers'}`}
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
                <Chip
                  label={
                    scenario.data.source.kind === 'generated'
                      ? 'Generat'
                      : 'Manual'
                  }
                  sx={{ bgcolor: '#FFFFFF', fontWeight: 700 }}
                />
              </Stack>
            </Stack>
          </Paper>
          {scenario.data.source.kind === 'generated' && (
            <Alert severity="info">
              Càrrega reproduïble amb la llavor{' '}
              {scenario.data.source.parameters.seed}.
            </Alert>
          )}
          <Box>
            <Typography component="h2" variant="h5" sx={{ mb: 0.5 }}>
              Tasques de l'escenari
            </Typography>
            <Typography color="text.secondary">
              Arribada, durada i prioritat originals de cada tasca.
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ overflowX: 'auto' }}
          >
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
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <SiteHeader />
        <Container
          component="main"
          maxWidth="lg"
          sx={{ py: { xs: 4, md: 6 }, pb: 10 }}
        >
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
    </ThemeProvider>
  );
}
