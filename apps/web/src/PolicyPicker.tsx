import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreateComparisonInputSchema,
  type PolicyConfiguration,
  type PolicyId,
} from '@queuescope/contracts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { createComparison } from './api';
import { colors } from './theme';

const policyOptions: Array<{
  id: PolicyId;
  title: string;
  description: string;
  color: string;
  index: string;
}> = [
  {
    id: 'fifo',
    title: 'FIFO',
    description: 'Primer en arribar, primer en executar',
    color: colors.fifo,
    index: '01',
  },
  {
    id: 'strict-priority',
    title: 'Prioritat estricta',
    description: 'Primer la prioritat més alta',
    color: colors.priority,
    index: '02',
  },
  {
    id: 'priority-aging',
    title: 'Prioritat amb envelliment',
    description: 'La prioritat puja durant l’espera',
    color: colors.aging,
    index: '03',
  },
];

export function PolicyPicker({ scenarioId }: { scenarioId: string }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PolicyId[]>([
    'fifo',
    'strict-priority',
  ]);
  const [agingInterval, setAgingInterval] = useState(2);
  const [validationError, setValidationError] = useState<string | null>(null);
  const comparison = useMutation({
    mutationFn: createComparison,
    onSuccess: (result) =>
      navigate(`/comparisons/${encodeURIComponent(result.comparisonId)}`),
  });

  function toggle(id: PolicyId) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : policyOptions
            .map((option) => option.id)
            .filter((item) => item === id || previous.includes(item)),
    );
    setValidationError(null);
    comparison.reset();
  }

  function launch() {
    const policies: PolicyConfiguration[] = [];
    if (selected.includes('fifo')) policies.push({ id: 'fifo' });
    if (selected.includes('strict-priority'))
      policies.push({ id: 'strict-priority' });
    if (selected.includes('priority-aging')) {
      policies.push({ id: 'priority-aging', agingInterval });
    }

    const input = CreateComparisonInputSchema.safeParse({
      scenarioId,
      policies,
    });
    if (!input.success) {
      setValidationError(
        'Selecciona almenys dues polítiques i un interval d’envelliment enter i positiu.',
      );
      return;
    }
    setValidationError(null);
    comparison.mutate(input.data);
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.green,
                fontWeight: 800,
                letterSpacing: '0.15em',
              }}
            >
              03 / COMPARA
            </Typography>
            <Typography component="h2" variant="h5">
              Tria les polítiques
            </Typography>
            <Typography color="text.secondary">
              Selecciona almenys dues opcions. Cada política rebrà exactament la
              mateixa càrrega de tasques i workers.
            </Typography>
          </Box>
          <FormGroup
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {policyOptions.map((option) => {
              const active = selected.includes(option.id);
              return (
                <Card
                  key={option.id}
                  variant="outlined"
                  sx={{
                    borderColor: active ? option.color : colors.line,
                    borderWidth: active ? 2 : 1,
                    bgcolor: active ? '#FAFCF9' : '#FFFFFF',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1.5}>
                      <Typography
                        sx={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                          fontWeight: 800,
                          color: option.color,
                        }}
                      >
                        {option.index} / POLÍTICA
                      </Typography>
                      <FormControlLabel
                        sx={{
                          m: 0,
                          alignItems: 'flex-start',
                          '& .MuiFormControlLabel-label': { pt: 0.7 },
                        }}
                        control={
                          <Checkbox
                            checked={active}
                            onChange={() => toggle(option.id)}
                            sx={{
                              color: option.color,
                              '&.Mui-checked': { color: option.color },
                            }}
                          />
                        }
                        label={
                          <Stack spacing={0.5}>
                            <Typography
                              sx={{ fontWeight: 750, lineHeight: 1.25 }}
                            >
                              {option.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Stack>
                        }
                      />
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </FormGroup>
          {selected.includes('priority-aging') && (
            <TextField
              label="Interval d'envelliment (ticks)"
              type="number"
              value={agingInterval}
              onChange={(event) => setAgingInterval(Number(event.target.value))}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              helperText="Cada interval complet d'espera suma un punt de prioritat"
              sx={{ maxWidth: 320 }}
            />
          )}
          {validationError && (
            <Alert severity="warning">{validationError}</Alert>
          )}
          {comparison.isError && (
            <Alert severity="error">{comparison.error.message}</Alert>
          )}
          <Button
            variant="contained"
            onClick={launch}
            disabled={comparison.isPending}
            sx={{ alignSelf: 'flex-start' }}
          >
            {comparison.isPending
              ? 'Executant la comparació…'
              : 'Executa la comparació'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
