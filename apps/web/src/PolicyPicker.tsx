import {
  Alert,
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

const policyOptions: Array<{ id: PolicyId; label: string }> = [
  { id: 'fifo', label: 'FIFO: primer en arribar, primer en executar' },
  {
    id: 'strict-priority',
    label: 'Prioritat estricta: primer la prioritat més alta',
  },
  {
    id: 'priority-aging',
    label: 'Prioritat amb envelliment: la prioritat puja en espera',
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
      <CardContent>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Compara polítiques
          </Typography>
          <Typography color="text.secondary">
            Cada política rebrà la mateixa instantània de tasques i workers.
          </Typography>
          <FormGroup>
            {policyOptions.map((option) => (
              <FormControlLabel
                key={option.id}
                control={
                  <Checkbox
                    checked={selected.includes(option.id)}
                    onChange={() => toggle(option.id)}
                  />
                }
                label={option.label}
              />
            ))}
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
