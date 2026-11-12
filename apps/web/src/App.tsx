import { Container, CssBaseline, Typography } from '@mui/material';

export function App() {
  return (
    <>
      <CssBaseline />
      <Container component="main" sx={{ py: 4 }}>
        <Typography component="h1" variant="h3">
          QueueScope
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Plataforma per comparar polítiques de planificació amb càrregues
          sintètiques reproduïbles.
        </Typography>
      </Container>
    </>
  );
}
